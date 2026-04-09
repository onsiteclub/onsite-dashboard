import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ContextLanding, type LandingContext } from '@/components/landing/ContextLanding'

export const dynamic = 'force-dynamic'

const AUTH_LOGIN_URL = process.env.NEXT_PUBLIC_AUTH_HUB_URL
  ? `${process.env.NEXT_PUBLIC_AUTH_HUB_URL}/login`
  : 'https://auth.onsiteclub.ca/login'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://member.onsiteclub.ca'

const VALID_CONTEXTS = ['shop', 'learn', 'tech'] as const

export default async function RootPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const params = await searchParams

  if (!user) {
    // Preserve ?from= context through auth redirect
    const fromParam = VALID_CONTEXTS.includes(params.from as any) ? params.from : null
    const returnTo = fromParam ? `${APP_URL}/?from=${fromParam}` : APP_URL
    redirect(`${AUTH_LOGIN_URL}?return_to=${encodeURIComponent(returnTo)}`)
  }

  const context: LandingContext = VALID_CONTEXTS.includes(params.from as any)
    ? (params.from as LandingContext)
    : 'general'

  // Fetch all data in parallel
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [
    { data: profile },
    { data: shopOrders },
    { data: learnCredentials },
    { data: entries },
    { data: subscriptions },
    { data: bladesTransactions },
  ] = await Promise.all([
    supabase
      .from('core_profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single(),
    supabase
      .from('app_shop_orders')
      .select('id')
      .eq('customer_email', user.email || ''),
    supabase
      .from('learn_credentials')
      .select('id')
      .eq('user_id', user.id),
    supabase
      .from('app_timekeeper_entries')
      .select('entry_at, exit_at')
      .eq('user_id', user.id)
      .gte('entry_at', thirtyDaysAgo.toISOString()),
    supabase
      .from('billing_subscriptions')
      .select('app_name, status')
      .eq('user_id', user.id),
    supabase
      .from('blades_transactions')
      .select('amount')
      .eq('user_id', user.id),
  ])

  // Compute timekeeper stats
  let totalMinutes = 0
  entries?.forEach(entry => {
    if (entry.exit_at) {
      const start = new Date(entry.entry_at).getTime()
      const end = new Date(entry.exit_at).getTime()
      totalMinutes += Math.round((end - start) / 60000)
    }
  })

  const bladesBalance = bladesTransactions?.reduce((sum, t) => sum + (t.amount || 0), 0) ?? 0

  return (
    <ContextLanding
      context={context}
      data={{
        profile: profile || null,
        shopOrderCount: shopOrders?.length || 0,
        learnCredentialCount: learnCredentials?.length || 0,
        timekeeperSessions: entries?.length || 0,
        timekeeperMinutes: totalMinutes,
        subscriptions: subscriptions || [],
        bladesBalance,
      }}
    />
  )
}
