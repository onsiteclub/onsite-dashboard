import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

type EmailOtpType =
  | 'recovery'
  | 'email'
  | 'signup'
  | 'invite'
  | 'magiclink'
  | 'email_change'

const isProduction = process.env.NODE_ENV === 'production'
const AUTH_HUB_URL = process.env.NEXT_PUBLIC_AUTH_HUB_URL || 'https://auth.onsiteclub.ca'

const sharedCookieOptions = isProduction
  ? { domain: '.onsiteclub.ca' as const }
  : {}

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const origin = url.origin

  const type = url.searchParams.get('type') as EmailOtpType | null
  const token_hash =
    url.searchParams.get('token_hash') ??
    url.searchParams.get('code')

  // Recovery goes to Auth Hub reset-password; everything else goes to /account
  const nextParam =
    url.searchParams.get('next') ??
    (type === 'recovery' ? `${AUTH_HUB_URL}/reset-password` : '/account')

  // Allow internal paths and auth hub URLs
  const nextPath = nextParam.startsWith('/') || nextParam.startsWith(AUTH_HUB_URL)
    ? nextParam
    : '/account'

  if (!type || !token_hash) {
    return NextResponse.redirect(new URL('/account', origin))
  }

  const redirectUrl = nextPath.startsWith('http')
    ? new URL(nextPath)
    : new URL(nextPath, origin)

  const response = NextResponse.redirect(redirectUrl)

  type CookieToSet = {
    name: string
    value: string
    options?: Parameters<NextResponse['cookies']['set']>[2]
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, { ...options, ...sharedCookieOptions })
          })
        },
      },
    }
  )

  const { error } = await supabase.auth.verifyOtp({ type, token_hash })

  if (error) {
    console.error('Auth callback error:', {
      message: error.message,
      type,
      hasTokenHash: Boolean(token_hash),
    })
    return NextResponse.redirect(new URL('/account', origin))
  }

  return response
}
