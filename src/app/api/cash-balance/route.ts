import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('cash_balance')
      .select(`
        *,
        stores (
          store_id,
          branch
        )
      `)
      .order('store_id')

    if (error) {
      console.error('GET /api/cash-balance error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('GET /api/cash-balance exception:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { store_id, amount, type } = body

    console.log('POST /api/cash-balance body:', body)

    if (!store_id || amount === undefined || !type) {
      return NextResponse.json(
        { error: 'Store ID, Amount, and Type are required' },
        { status: 400 }
      )
    }

    // Get current balance
    const { data: currentBalance, error: fetchError } = await supabase
      .from('cash_balance')
      .select('current_balance')
      .eq('store_id', store_id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching current balance:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    let newBalance = 0
    if (currentBalance) {
      // Update existing balance
      if (type === 'income') {
        newBalance = currentBalance.current_balance + parseFloat(amount)
      } else if (type === 'expense' || type === 'transfer') {
        newBalance = currentBalance.current_balance - parseFloat(amount)
      } else if (type === 'adjustment') {
        // For manual adjustments, set the exact amount
        newBalance = parseFloat(amount)
      }
    } else {
      // Create new balance record
      if (type === 'income') {
        newBalance = parseFloat(amount)
      } else if (type === 'adjustment') {
        newBalance = parseFloat(amount)
      } else {
        newBalance = -parseFloat(amount)
      }
    }

    // Upsert the balance
    const { data, error } = await supabase
      .from('cash_balance')
      .upsert([
        {
          store_id: parseInt(store_id),
          current_balance: newBalance,
          last_updated: new Date().toISOString()
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
      console.error('POST /api/cash-balance error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('POST /api/cash-balance success:', data[0])
    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    console.error('POST /api/cash-balance exception:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
