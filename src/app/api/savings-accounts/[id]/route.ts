import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let routeId = 'unknown'
  try {
    const { id } = await params
    routeId = id
    const body = await request.json()
    const {
      account_id,
      account_name,
      account_type,
      bank_name,
      account_number,
      current_balance,
      status,
      notes
    } = body

    console.log(`PUT /api/savings-accounts/${id} body:`, body)

    if (!account_id || !account_name || !account_type) {
      return NextResponse.json(
        { error: 'Account ID, Account Name, and Account Type are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('savings_accounts')
      .update({
        account_id,
        account_name,
        account_type,
        bank_name,
        account_number,
        current_balance,
        status,
        notes
      })
      .eq('id', id)
      .select()

    if (error) {
      console.error(`PUT /api/savings-accounts/${id} error:`, error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`PUT /api/savings-accounts/${id} success:`, data[0])
    return NextResponse.json(data[0])
  } catch (error) {
    console.error(`PUT /api/savings-accounts/${routeId} exception:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let routeId = 'unknown'
  try {
    const { id } = await params
    routeId = id

    console.log(`DELETE /api/savings-accounts/${id}`)

    const { error } = await supabase
      .from('savings_accounts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error(`DELETE /api/savings-accounts/${id} error:`, error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`DELETE /api/savings-accounts/${id} success`)
    return NextResponse.json({ message: 'Savings account deleted successfully' })
  } catch (error) {
    console.error(`DELETE /api/savings-accounts/${routeId} exception:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
