import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('transfers')
      .select(`
        *,
        outgoing_transaction:transactions!outgoing_transaction_id(*),
        incoming_transaction:transactions!incoming_transaction_id(*)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching transfers:', error)
      return NextResponse.json(
        { error: 'Failed to fetch transfers' },
        { status: 500 }
      )
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error fetching transfers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fromType, fromId, toType, toId, amount, notes, staff_email } = body

    console.log('POST /api/transfers body:', body)

    // Validate required fields
    if (!fromType || !fromId || !toType || !toId || !amount || !staff_email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate account types
    if (!['store', 'savings'].includes(fromType) || !['store', 'savings'].includes(toType)) {
      return NextResponse.json(
        { error: 'Invalid account type' },
        { status: 400 }
      )
    }

    // Generate unique transfer reference
    const transferReference = `TRF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const transactionDate = new Date().toISOString().split('T')[0]

    // Step 1: Create outgoing transaction (expense)
    const { data: outgoingTransaction, error: outgoingError } = await supabase
      .from('transactions')
      .insert([{
        store_id: fromType === 'store' ? fromId : null,
        savings_account_id: fromType === 'savings' ? fromId : null,
        type: 'expense',
        category: 'transfer_out',
        amount: amount,
        payment_method: 'transfer',
        notes: `Transfer out to ${toType === 'store' ? 'Store' : 'Savings Account'}: ${notes}`,
        transaction_date: transactionDate,
        staff_email
      }])
      .select()
      .single()

    if (outgoingError) {
      console.error('Error creating outgoing transaction:', outgoingError)
      return NextResponse.json(
        { error: 'Failed to create outgoing transaction' },
        { status: 500 }
      )
    }

    // Step 2: Create incoming transaction (income)
    const { data: incomingTransaction, error: incomingError } = await supabase
      .from('transactions')
      .insert([{
        store_id: toType === 'store' ? toId : null,
        savings_account_id: toType === 'savings' ? toId : null,
        type: 'income',
        category: 'transfer_in',
        amount: amount,
        payment_method: 'transfer',
        notes: `Transfer in from ${fromType === 'store' ? 'Store' : 'Savings Account'}: ${notes}`,
        transaction_date: transactionDate,
        staff_email
      }])
      .select()
      .single()

    if (incomingError) {
      console.error('Error creating incoming transaction:', incomingError)
      // Rollback outgoing transaction
      await supabase.from('transactions').delete().eq('id', outgoingTransaction.id)
      return NextResponse.json(
        { error: 'Failed to create incoming transaction' },
        { status: 500 }
      )
    }

    // Step 3: Create transfer record
    const { data: transferRecord, error: transferError } = await supabase
      .from('transfers')
      .insert([{
        transfer_reference: transferReference,
        from_type: fromType,
        from_id: fromId,
        to_type: toType,
        to_id: toId,
        amount: amount,
        notes: notes,
        transaction_date: transactionDate,
        staff_email,
        outgoing_transaction_id: outgoingTransaction.id,
        incoming_transaction_id: incomingTransaction.id
      }])
      .select()
      .single()

    if (transferError) {
      console.error('Error creating transfer record:', transferError)
      // Rollback both transactions
      await supabase.from('transactions').delete().eq('id', outgoingTransaction.id)
      await supabase.from('transactions').delete().eq('id', incomingTransaction.id)
      return NextResponse.json(
        { error: 'Failed to create transfer record' },
        { status: 500 }
      )
    }

    // Step 4: Update balances
    try {
      // Update "from" account balance (reduce)
      if (fromType === 'store') {
        const { data: currentFromBalance, error: fetchFromError } = await supabase
          .from('cash_balance')
          .select('current_balance')
          .eq('store_id', fromId)
          .single()

        if (fetchFromError) {
          console.error('Error fetching from balance:', fetchFromError)
          if (fetchFromError.code === 'PGRST116') {
            // Create new balance record
            await supabase
              .from('cash_balance')
              .insert([{ store_id: fromId, current_balance: -amount, last_updated: new Date().toISOString() }])
          }
        } else {
          const newFromBalance = currentFromBalance.current_balance - amount
          await supabase
            .from('cash_balance')
            .update({ current_balance: newFromBalance, last_updated: new Date().toISOString() })
            .eq('store_id', fromId)
        }
      } else {
        // Update savings account balance (reduce)
        const { data: currentFromSavings, error: fetchFromSavingsError } = await supabase
          .from('savings_accounts')
          .select('current_balance')
          .eq('id', fromId)
          .single()

        if (!fetchFromSavingsError && currentFromSavings) {
          const newFromBalance = currentFromSavings.current_balance - amount
          await supabase
            .from('savings_accounts')
            .update({ current_balance: newFromBalance })
            .eq('id', fromId)
        }
      }

      // Update "to" account balance (add)
      if (toType === 'store') {
        const { data: currentToBalance, error: fetchToError } = await supabase
          .from('cash_balance')
          .select('current_balance')
          .eq('store_id', toId)
          .single()

        if (fetchToError) {
          console.error('Error fetching to balance:', fetchToError)
          if (fetchToError.code === 'PGRST116') {
            // Create new balance record
            await supabase
              .from('cash_balance')
              .insert([{ store_id: toId, current_balance: amount, last_updated: new Date().toISOString() }])
          }
        } else {
          const newToBalance = currentToBalance.current_balance + amount
          await supabase
            .from('cash_balance')
            .update({ current_balance: newToBalance, last_updated: new Date().toISOString() })
            .eq('store_id', toId)
        }
      } else {
        // Update savings account balance (add)
        const { data: currentToSavings, error: fetchToSavingsError } = await supabase
          .from('savings_accounts')
          .select('current_balance')
          .eq('id', toId)
          .single()

        if (!fetchToSavingsError && currentToSavings) {
          const newToBalance = currentToSavings.current_balance + amount
          await supabase
            .from('savings_accounts')
            .update({ current_balance: newToBalance })
            .eq('id', toId)
        }
      }
    } catch (balanceError) {
      console.error('Error updating balances:', balanceError)
      // Note: We don't rollback here as the transactions are already created
      // The balances can be manually corrected if needed
    }

    console.log('Transfer completed successfully:', {
      transferReference,
      outgoingTransactionId: outgoingTransaction.id,
      incomingTransactionId: incomingTransaction.id,
      transferRecordId: transferRecord.id
    })

    return NextResponse.json({
      success: true,
      transferReference,
      outgoingTransaction: outgoingTransaction,
      incomingTransaction: incomingTransaction,
      transferRecord: transferRecord
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating transfer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
