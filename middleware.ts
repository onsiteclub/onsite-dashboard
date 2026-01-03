import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Rotas protegidas - requerem autenticação
  if (pathname.startsWith('/account') || pathname.startsWith('/admin')) {
    if (!user) {
      // Redireciona pra / (página de login) ao invés de /login
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Admin - requer is_admin = true
  if (pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user!.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.redirect(new URL('/account', request.url))
    }
  }

  // Atualizar last_seen_at
  if (user && (pathname.startsWith('/account') || pathname.startsWith('/admin'))) {
    await supabase
      .from('profiles')
      .update({ last_seen_at: new Date().toISOString() })
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