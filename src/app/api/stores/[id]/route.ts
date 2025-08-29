import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { store_id, branch, address, phone, email, status } = body

    console.log(`PUT /api/stores/${id} body:`, body)

    if (!store_id || !branch || !address) {
      return NextResponse.json(
        { error: 'Store ID, Branch, and Address are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('stores')
      .update({
        store_id,
        branch,
        address,
        phone,
        email,
        status
      })
      .eq('id', id)
      .select()

    if (error) {
      console.error(`PUT /api/stores/${id} error:`, error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (data.length === 0) {
      console.error(`PUT /api/stores/${id} store not found`)
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    console.log(`PUT /api/stores/${id} success:`, data[0])
    return NextResponse.json(data[0])
  } catch (error) {
    console.error(`PUT /api/stores exception:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    console.log(`DELETE /api/stores/${id}`)
    
    const { error } = await supabase
      .from('stores')
      .delete()
      .eq('id', id)

    if (error) {
      console.error(`DELETE /api/stores/${id} error:`, error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`DELETE /api/stores/${id} success`)
    return NextResponse.json({ message: 'Store deleted successfully' })
  } catch (error) {
    console.error(`DELETE /api/stores exception:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
