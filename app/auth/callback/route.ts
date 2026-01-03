import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')

  if (code && type) {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.verifyOtp({
      token_hash: code,
      type: type as 'recovery' | 'email' | 'signup',
    })
    
    if (!error) {
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/reset-password`)
      }
      return NextResponse.redirect(`${origin}/account`)
    }
    
    console.error('Auth callback error:', error.message)
  }

  return NextResponse.redirect(`${origin}/?error=auth_callback_error`)
}