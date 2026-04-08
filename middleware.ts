import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const isProduction = process.env.NODE_ENV === 'production'
const AUTH_LOGIN_URL = process.env.NEXT_PUBLIC_AUTH_HUB_URL
  ? `${process.env.NEXT_PUBLIC_AUTH_HUB_URL}/login`
  : 'https://auth.onsiteclub.ca/login'

const sharedCookieOptions = isProduction
  ? { domain: '.onsiteclub.ca' as const }
  : {}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options, ...sharedCookieOptions })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options, ...sharedCookieOptions })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Protected routes - redirect to Auth Hub if not authenticated
  if (pathname.startsWith('/account') || pathname.startsWith('/admin')) {
    if (!user) {
      if (isProduction) {
        const loginUrl = new URL(AUTH_LOGIN_URL)
        loginUrl.searchParams.set('return_to', request.nextUrl.href)
        return NextResponse.redirect(loginUrl)
      }
      // Local dev: redirect to local login page
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Admin - requires admin role
  if (pathname.startsWith('/admin')) {
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('is_active, role')
      .eq('user_id', user!.id)
      .single()

    if (!adminUser?.is_active) {
      return NextResponse.redirect(new URL('/account', request.url))
    }
  }

  // Update last_active_at
  if (user && (pathname.startsWith('/account') || pathname.startsWith('/admin'))) {
    await supabase
      .from('core_profiles')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', user.id)
  }

  return response
}

export const config = {
  matcher: [
    '/account/:path*',
    '/admin/:path*',
  ],
}
