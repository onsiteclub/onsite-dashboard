import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

type EmailOtpType = 'recovery' | 'email' | 'signup' | 'invite' | 'email_change' | 'magiclink'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const origin = url.origin

  const type = url.searchParams.get('type') as EmailOtpType | null
  const token_hash = url.searchParams.get('token_hash') ?? url.searchParams.get('code')

  const next = url.searchParams.get('next') ?? (type === 'recovery' ? '/reset-password' : '/account')
  const nextPath = next.startsWith('/') ? next : '/reset-password'

  if (!type || !token_hash) {
    return NextResponse.redirect(new URL('/?error=missing_token', origin))
  }

  const response = NextResponse.redirect(new URL(nextPath, origin))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { error } = await supabase.auth.verifyOtp({ type, token_hash })

  if (error) {
    console.error('Auth callback error:', error.message)
    return NextResponse.redirect(
      new URL(`/?error=auth_callback_error&message=${encodeURIComponent(error.message)}`, origin)
    )
  }

  return response
}
