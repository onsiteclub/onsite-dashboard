import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

const AUTH_LOGIN_URL = process.env.NEXT_PUBLIC_AUTH_HUB_URL
  ? `${process.env.NEXT_PUBLIC_AUTH_HUB_URL}/login`
  : 'https://auth.onsiteclub.ca/login'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/account')
  }

  // Not authenticated — redirect to Auth Hub
  redirect(`${AUTH_LOGIN_URL}?return_to=${encodeURIComponent(process.env.NEXT_PUBLIC_APP_URL || 'https://member.onsiteclub.ca')}/account`)
}
