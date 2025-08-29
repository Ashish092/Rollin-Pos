import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const store_id = searchParams.get('store_id')
    const date = searchParams.get('date')

    let query = supabase
      .from('cash_history')
      .select(`
        *,
        stores (
          store_id,
          branch
        )
      `)
      .order('date', { ascending: false })

    if (store_id) {
      query = query.eq('store_id', store_id)
    }

    if (date) {
      query = query.eq('date', date)
    }

    const { data, error } = await query

    if (error) {
      console.error('GET /api/cash-history error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('GET /api/cash-history exception:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { store_id, date } = body

    console.log('POST /api/cash-history body:', body)

    if (!store_id || !date) {
      return NextResponse.json(
        { error: 'Store ID and Date are required' },
        { status: 400 }
      )
    }

    // Get current balance (for validation)
    const { error: balanceError } = await supabase
      .from('cash_balance')
      .select('current_balance')
      .eq('store_id', store_id)
      .single()

    if (balanceError) {
      console.error('Error fetching current balance:', balanceError)
      return NextResponse.json({ error: balanceError.message }, { status: 500 })
    }

    // Get yesterday's closing balance (if exists)
    const yesterday = new Date(date)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const { data: yesterdayHistory } = await supabase
      .from('cash_history')
      .select('closing_balance')
      .eq('store_id', store_id)
      .eq('date', yesterdayStr)
      .single()

    const openingBalance = yesterdayHistory?.closing_balance || 0

    // Calculate today's totals
    const { data: todayTransactions, error: transError } = await supabase
      .from('transactions')
      .select('type, amount')
      .eq('store_id', store_id)
      .eq('transaction_date', date)

    if (transError) {
      console.error('Error fetching today\'s transactions:', transError)
      return NextResponse.json({ error: transError.message }, { status: 500 })
    }

    let totalIncome = 0
    let totalExpense = 0
    let totalTransfer = 0

    todayTransactions?.forEach(transaction => {
      if (transaction.type === 'income') {
        totalIncome += parseFloat(transaction.amount)
      } else if (transaction.type === 'expense') {
        totalExpense += parseFloat(transaction.amount)
      } else if (transaction.type === 'transfer') {
        totalTransfer += parseFloat(transaction.amount)
      }
    })

    const netChange = totalIncome - totalExpense - totalTransfer
    const closingBalance = openingBalance + netChange

    // Upsert the history record
    const { data, error } = await supabase
      .from('cash_history')
      .upsert([
        {
          store_id: parseInt(store_id),
          date,
          opening_balance: openingBalance,
          closing_balance: closingBalance,
          total_income: totalIncome,
          total_expense: totalExpense,
          total_transfer: totalTransfer,
          net_change: netChange
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
      console.error('POST /api/cash-history error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('POST /api/cash-history success:', data[0])
    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    console.error('POST /api/cash-history exception:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

