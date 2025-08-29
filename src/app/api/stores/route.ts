import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('GET /api/stores error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('GET /api/stores exception:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { store_id, branch, address, phone, email, status = 'active' } = body

    console.log('POST /api/stores body:', body)

    if (!store_id || !branch || !address) {
      return NextResponse.json(
        { error: 'Store ID, Branch, and Address are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('stores')
      .insert([
        {
          store_id,
          branch,
          address,
          phone,
          email,
          status
        }
      ])
      .select()

    if (error) {
      console.error('POST /api/stores error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('POST /api/stores success:', data[0])
    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    console.error('POST /api/stores exception:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
