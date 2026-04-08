import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { CommandPalette } from '@/components/ui/CommandPalette'
import AssistantWidget from '@/components/assistant/AssistantWidget'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Fetch all data in parallel
  const [
    { data: coreProfile },
    { data: allSubscriptions },
    { data: device },
    { data: shopOrders },
    { data: learnCredentials },
  ] = await Promise.all([
    supabase
      .from('core_profiles')
      .select('*')
      .eq('id', user.id)
      .single(),
    supabase
      .from('billing_subscriptions')
      .select('app_name, status, stripe_customer_id, stripe_subscription_id, current_period_start, current_period_end, trial_end, cancel_at_period_end, canceled_at, has_payment_method')
      .eq('user_id', user.id),
    supabase
      .from('core_devices')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .single(),
    supabase
      .from('app_shop_orders')
      .select('id')
      .eq('customer_email', user.email || ''),
    supabase
      .from('learn_credentials')
      .select('id')
      .eq('user_id', user.id),
  ])

  const subs = allSubscriptions || []
  const shopOrderCount = shopOrders?.length || 0
  const learnCredentialCount = learnCredentials?.length || 0

  // Compose profile for assistant widget (backward compat)
  const tkSub = subs.find(s => s.app_name === 'timekeeper')
  const profile = coreProfile ? {
    ...coreProfile,
    stripe_customer_id: tkSub?.stripe_customer_id ?? null,
    stripe_subscription_id: tkSub?.stripe_subscription_id ?? null,
    subscription_status: tkSub?.status ?? 'none',
    trial_ends_at: tkSub?.trial_end ?? null,
    subscription_started_at: tkSub?.current_period_start ?? null,
    subscription_canceled_at: tkSub?.canceled_at ?? null,
    has_payment_method: tkSub?.has_payment_method ?? false,
    device_id: device?.device_id ?? null,
    device_registered_at: device?.first_seen_at ?? null,
    device_model: device?.model ?? null,
    device_platform: device?.platform ?? null,
    blades_balance: 0,
    blades_lifetime_earned: 0,
    level: 'rookie' as const,
    voice_calculator_enabled: false,
    sync_enabled: false,
    is_admin: false,
    is_suspended: false,
  } : null

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        subscriptions={subs.map(s => ({ app_name: s.app_name, status: s.status }))}
        shopOrderCount={shopOrderCount}
        learnCredentialCount={learnCredentialCount}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          userName={coreProfile?.full_name || null}
          userEmail={user.email || ''}
          avatarUrl={coreProfile?.avatar_url || null}
        />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
      <CommandPalette />
      {profile && <AssistantWidget profile={profile} />}
    </div>
  )
}
