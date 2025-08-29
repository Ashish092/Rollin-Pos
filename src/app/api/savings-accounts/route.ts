import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('savings_accounts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('GET /api/savings-accounts error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('GET /api/savings-accounts exception:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      account_id,
      account_name,
      account_type,
      bank_name,
      account_number,
      current_balance,
      notes
    } = body

    if (!account_id || !account_name || !account_type) {
      return NextResponse.json(
        { error: 'Account ID, Account Name, and Account Type are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('savings_accounts')
      .insert({
        account_id,
        account_name,
        account_type,
        bank_name,
        account_number,
        current_balance: current_balance || 0,
        status: 'active',
        notes
      })
      .select()

    if (error) {
      console.error('POST /api/savings-accounts error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error('POST /api/savings-accounts exception:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
