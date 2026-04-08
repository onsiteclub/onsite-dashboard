import { createBrowserClient } from '@supabase/ssr'

const isProduction = process.env.NODE_ENV === 'production'

const cookieOptions = isProduction
  ? { domain: '.onsiteclub.ca', sameSite: 'lax' as const, secure: true }
  : { sameSite: 'lax' as const, secure: false }

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookieOptions }
  )
}
