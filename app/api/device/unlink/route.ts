import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('core_devices')
      .delete()
      .eq('user_id', user.id)
      .eq('is_primary', true)

    if (error) {
      console.error('Unlink device error:', error)
      return NextResponse.json({ error: 'Failed to unlink device' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Unlink device error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
