import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash') || searchParams.get('code')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/account'

  if (token_hash) {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type === 'recovery' ? 'recovery' : 'email',
    })
    
    if (!error) {
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/reset-password`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
    
    console.error('Auth error:', error)
  }

  return NextResponse.redirect(`${origin}/?error=auth_callback_error`)
}