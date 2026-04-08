import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatMinutesToHours, getFirstName } from '@/lib/utils'
import {
  Clock,
  Calculator,
  ClipboardCheck,
  ShoppingBag,
  BookOpen,
  User,
  CreditCard,
  Settings,
  ArrowRight,
  ExternalLink,
  Package,
  Award,
} from 'lucide-react'
import Link from 'next/link'

const SHOP_URL = process.env.NEXT_PUBLIC_SHOP_URL || 'https://shop.onsiteclub.ca'
const LEARN_URL = process.env.NEXT_PUBLIC_LEARN_URL || 'https://learn.onsiteclub.ca'

export const metadata = {
  title: 'Dashboard',
}

export default async function AccountHubPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [
    { data: profile },
    { data: subscriptions },
    { data: entries },
    { data: shopOrders },
    { data: learnCredentials },
  ] = await Promise.all([
    supabase.from('core_profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('billing_subscriptions')
      .select('app_name, status, trial_end, current_period_start, current_period_end, cancel_at_period_end')
      .eq('user_id', user.id),
    supabase
      .from('app_timekeeper_entries')
      .select('entry_at, exit_at')
      .eq('user_id', user.id)
      .gte('entry_at', thirtyDaysAgo.toISOString()),
    supabase
      .from('app_shop_orders')
      .select('id, status, total, created_at')
      .eq('customer_email', user.email || '')
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('learn_credentials')
      .select('id, credential_type, title, issued_at')
      .eq('user_id', user.id)
      .order('issued_at', { ascending: false })
      .limit(3),
  ])

  const subs = subscriptions || []
  const tkSub = subs.find(s => s.app_name === 'timekeeper')
  const calcSub = subs.find(s => s.app_name === 'calculator')

  // Timekeeper stats
  let totalMinutes = 0
  const sessionsCount = entries?.length || 0
  entries?.forEach(entry => {
    if (entry.exit_at) {
      const start = new Date(entry.entry_at).getTime()
      const end = new Date(entry.exit_at).getTime()
      totalMinutes += Math.round((end - start) / 60000)
    }
  })

  // Trial banner
  function getTrialDays(sub: { trial_end: string | null } | undefined): number {
    if (!sub?.trial_end) return 0
    const end = new Date(sub.trial_end).getTime()
    return Math.max(0, Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24)))
  }
  const activeTrials = subs.filter(s => s.status === 'trialing')

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {getFirstName(profile?.full_name)}!
        </h1>
        <p className="text-gray-500 mt-1">Your OnSite Club overview</p>
      </div>

      {/* Trial Banner */}
      {activeTrials.length > 0 && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Free Trial Active</p>
              <p className="text-blue-100 text-sm mt-1">
                {activeTrials.map(s => `${s.app_name}: ${getTrialDays(s)} days left`).join(' \u2022 ')}
              </p>
            </div>
            <Link
              href="/account/settings"
              className="px-4 py-2 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors text-sm"
            >
              Manage
            </Link>
          </div>
        </div>
      )}

      {/* TECH */}
      <section>
        <SectionHeader title="Tech" color="blue" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AppCard
            href="/account/timekeeper"
            icon={Clock}
            title="Timekeeper"
            description="Track your work hours"
            status={tkSub?.status || null}
            stats={[
              { label: 'This Month', value: formatMinutesToHours(totalMinutes) },
              { label: 'Sessions', value: sessionsCount.toString() },
            ]}
            color="blue"
          />
          <AppCard
            href="/account/calculator"
            icon={Calculator}
            title="Calculator"
            description="Construction calculator with voice"
            status={calcSub?.status || null}
            color="purple"
          />
          <AppCard
            href="/account/checklist"
            icon={ClipboardCheck}
            title="Checklist"
            description="Safety & inspection checklists"
            comingSoon
            color="teal"
          />
        </div>
      </section>

      {/* SHOP */}
      <section>
        <SectionHeader
          title="Shop"
          color="green"
          actionLabel="Go to Shop"
          actionHref={SHOP_URL}
          external
        />
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          {shopOrders && shopOrders.length > 0 ? (
            <div className="space-y-3">
              {shopOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <Package className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-700">Order #{String(order.id).slice(0, 8)}</span>
                  </div>
                  <span className="text-xs text-gray-400 capitalize">{order.status}</span>
                </div>
              ))}
              <Link
                href="/account/shop"
                className="flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-700 pt-2"
              >
                View all orders <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="text-center py-4">
              <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No orders yet</p>
              <a
                href={SHOP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-700 mt-2"
              >
                Browse shop <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      </section>

      {/* LEARN */}
      <section>
        <SectionHeader
          title="Learn"
          color="orange"
          actionLabel="Go to Learn"
          actionHref={LEARN_URL}
          external
        />
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          {learnCredentials && learnCredentials.length > 0 ? (
            <div className="space-y-3">
              {learnCredentials.map(cred => (
                <div key={cred.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <Award className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-gray-700">{cred.title}</span>
                  </div>
                  <span className="text-xs text-gray-400 capitalize">{cred.credential_type}</span>
                </div>
              ))}
              <Link
                href="/account/courses"
                className="flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700 pt-2"
              >
                View all certificates <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="text-center py-4">
              <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No certificates yet</p>
              <a
                href={LEARN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700 mt-2"
              >
                Start learning <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ACCOUNT Quick Links */}
      <section>
        <SectionHeader title="Account" color="gray" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QuickLink href="/account/profile" icon={User} label="Profile" description="Edit your personal info" />
          <QuickLink href="/account/credit-card" icon={CreditCard} label="Credit Card" description="Coming soon" disabled />
          <QuickLink href="/account/settings" icon={Settings} label="Settings" description="Subscriptions & preferences" />
        </div>
      </section>
    </div>
  )
}

/* ── Helper Components ─────────────────────────────── */

function SectionHeader({ title, color, actionLabel, actionHref, external }: {
  title: string
  color: string
  actionLabel?: string
  actionHref?: string
  external?: boolean
}) {
  const dotColor: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    gray: 'bg-gray-400',
  }
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${dotColor[color] || 'bg-gray-400'}`} />
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</h2>
      </div>
      {actionLabel && actionHref && (
        <a
          href={actionHref}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          {actionLabel}
          {external ? <ExternalLink className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
        </a>
      )}
    </div>
  )
}

function AppCard({ href, icon: Icon, title, description, status, stats, color, comingSoon }: {
  href: string
  icon: React.ElementType
  title: string
  description: string
  status?: string | null
  stats?: { label: string; value: string }[]
  color: string
  comingSoon?: boolean
}) {
  const iconBg: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    teal: 'bg-teal-50 text-teal-600',
  }
  const hoverBorder: Record<string, string> = {
    blue: 'hover:border-blue-200',
    purple: 'hover:border-purple-200',
    teal: 'hover:border-teal-200',
  }

  const badges: Record<string, { text: string; style: string }> = {
    active: { text: 'Active', style: 'bg-green-100 text-green-700' },
    trialing: { text: 'Trial', style: 'bg-blue-100 text-blue-700' },
    canceled: { text: 'Canceled', style: 'bg-gray-100 text-gray-500' },
    past_due: { text: 'Past Due', style: 'bg-red-100 text-red-700' },
  }

  if (comingSoon) {
    return (
      <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 opacity-60">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <Icon className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500">{title}</h3>
            <p className="text-xs text-gray-400">{description}</p>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-gray-200 text-gray-500">Coming Soon</span>
      </div>
    )
  }

  const badge = status ? badges[status] : null

  return (
    <Link
      href={href}
      className={`group bg-white rounded-2xl border border-gray-200 p-5 transition-all hover:shadow-lg ${hoverBorder[color] || ''}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg[color] || 'bg-gray-50 text-gray-600'}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-400">{description}</p>
          </div>
        </div>
        {badge && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${badge.style}`}>
            {badge.text}
          </span>
        )}
      </div>
      {stats && stats.length > 0 && (
        <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
          {stats.map((stat, i) => (
            <div key={i}>
              <p className="text-[10px] text-gray-400">{stat.label}</p>
              <p className="text-sm font-semibold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>
      )}
    </Link>
  )
}

function QuickLink({ href, icon: Icon, label, description, disabled }: {
  href: string
  icon: React.ElementType
  label: string
  description: string
  disabled?: boolean
}) {
  if (disabled) {
    return (
      <div className="flex items-center gap-3 bg-gray-50 rounded-xl border border-gray-200 p-4 opacity-60">
        <Icon className="w-5 h-5 text-gray-400" />
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-xs text-gray-400">{description}</p>
        </div>
      </div>
    )
  }
  return (
    <Link
      href={href}
      className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-gray-300 transition-all group"
    >
      <Icon className="w-5 h-5 text-gray-400 group-hover:text-amber-600 transition-colors" />
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
    </Link>
  )
}
