import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        stores (
          store_id,
          branch
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('GET /api/transactions error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('GET /api/transactions exception:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      store_id, 
      type, 
      category, 
      amount, 
      payment_method, 
      notes, 
      transaction_date,
      staff_email 
    } = body

    console.log('POST /api/transactions body:', body)

    if (!store_id || !type || !category || !amount || !payment_method) {
      return NextResponse.json(
        { error: 'Store, Type, Category, Amount, and Payment Method are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert([
        {
          store_id,
          type,
          category,
          amount,
          payment_method,
          notes,
          transaction_date: transaction_date || new Date().toISOString().split('T')[0],
          staff_email
        }
      ])
      .select(`
        *,
        stores (
          store_id,
          branch
        )
      `)

    if (error) {
      console.error('POST /api/transactions error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('POST /api/transactions success:', data[0])

    // Update cash balance automatically
    try {
      // Get current balance
      const { data: currentBalance, error: fetchError } = await supabase
        .from('cash_balance')
        .select('current_balance')
        .eq('store_id', store_id)
        .single()

             if (fetchError) {
         console.error('Error fetching current balance:', fetchError)
         // If no balance record exists, create one
         if (fetchError.code === 'PGRST116') {
           console.log('No balance record found, creating new one...')
           const { error: insertError } = await supabase
             .from('cash_balance')
             .insert([
               {
                 store_id: parseInt(store_id),
                 current_balance: type === 'income' ? parseFloat(amount) : -parseFloat(amount),
                 last_updated: new Date().toISOString()
               }
             ])
           
           if (insertError) {
             console.error('Error creating new balance record:', insertError)
           } else {
             console.log('New balance record created successfully')
           }
         }
       } else {
                 let newBalance = 0
         if (currentBalance) {
           // Update existing balance
           if (type === 'income') {
             newBalance = currentBalance.current_balance + parseFloat(amount)
           } else if (type === 'expense' || type === 'transfer') {
             newBalance = currentBalance.current_balance - parseFloat(amount)
           }
           console.log(`Updating balance: ${currentBalance.current_balance} -> ${newBalance} (${type}: ${amount})`)
         } else {
           // Create new balance record
           if (type === 'income') {
             newBalance = parseFloat(amount)
           } else {
             newBalance = -parseFloat(amount)
           }
           console.log(`Creating new balance: ${newBalance} (${type}: ${amount})`)
         }

                 // Update the balance (use update instead of upsert to avoid conflicts)
         const { error: balanceError } = await supabase
           .from('cash_balance')
           .update({
             current_balance: newBalance,
             last_updated: new Date().toISOString()
           })
           .eq('store_id', parseInt(store_id))

                 if (balanceError) {
           console.error('Error updating cash balance:', balanceError)
         } else {
           console.log(`Cash balance updated successfully to: ${newBalance}`)
         }
      }
    } catch (balanceError) {
      console.error('Error updating cash balance:', balanceError)
      // Don't fail the transaction if balance update fails
    }

    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    console.error('POST /api/transactions exception:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
