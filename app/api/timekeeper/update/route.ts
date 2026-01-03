import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, field, value } = await request.json()

    if (!id || !field || !value) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['entrada', 'saida'].includes(field)) {
      return NextResponse.json({ error: 'Invalid field' }, { status: 400 })
    }

    // Buscar registro atual para salvar valor original
    const { data: currentRegistro } = await supabase
      .from('registros')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!currentRegistro) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    // Preparar update com backup do valor original
    const updateData: Record<string, any> = {
      [field]: value,
      edited_at: new Date().toISOString(),
      edited_by: 'manual',
      updated_at: new Date().toISOString(),
    }

    // Salvar valor original se ainda não foi salvo
    const originalField = `original_${field}`
    if (!currentRegistro[originalField]) {
      updateData[originalField] = currentRegistro[field]
    }

    // Atualizar registro
    const { data: updated, error } = await supabase
      .from('registros')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Update error:', error)
      return NextResponse.json({ error: 'Failed to update record' }, { status: 500 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
