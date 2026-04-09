import { UserGreeting } from './UserGreeting'
import { LandingCard } from './LandingCard'
import { BladesCard } from './BladesCard'
import Link from 'next/link'
import {
  ShoppingBag,
  User,
  Clock,
  Calculator,
  ClipboardCheck,
  Monitor,
  Store,
  GraduationCap,
  Cpu,
  Award,
  ArrowRight,
} from 'lucide-react'
import { formatMinutesToHours } from '@/lib/utils'

export type LandingContext = 'shop' | 'learn' | 'tech' | 'general'

export interface LandingData {
  profile: {
    full_name: string | null
    avatar_url: string | null
  } | null
  shopOrderCount: number
  learnCredentialCount: number
  timekeeperSessions: number
  timekeeperMinutes: number
  subscriptions: { app_name: string; status: string }[]
  bladesBalance: number
}

interface Props {
  context: LandingContext
  data: LandingData
}

const statusBadges: Record<string, { text: string; color: string }> = {
  active: { text: 'Active', color: 'bg-green-100 text-green-700' },
  trialing: { text: 'Trial', color: 'bg-blue-100 text-blue-700' },
  canceled: { text: 'Canceled', color: 'bg-gray-100 text-gray-500' },
  past_due: { text: 'Past Due', color: 'bg-red-100 text-red-700' },
}

export function ContextLanding({ context, data }: Props) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        <UserGreeting
          fullName={data.profile?.full_name || null}
          avatarUrl={data.profile?.avatar_url || null}
        />

        <div className="mt-10">
          {context === 'shop' && <ShopLanding data={data} />}
          {context === 'learn' && <LearnLanding data={data} />}
          {context === 'tech' && <TechLanding data={data} />}
          {context === 'general' && <GeneralLanding data={data} />}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/account"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all"
          >
            View Full Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

function ShopLanding({ data }: { data: LandingData }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <LandingCard
        icon={ShoppingBag}
        title="My Orders"
        stat={String(data.shopOrderCount)}
        statLabel="total orders"
        ctaLabel="View Orders"
        href="/account/shop"
        color="green"
      />
      <LandingCard
        icon={User}
        title="My Account"
        description="Profile & settings"
        ctaLabel="Manage"
        href="/account/profile"
        color="gray"
      />
      <BladesCard balance={data.bladesBalance} />
    </div>
  )
}

function LearnLanding({ data }: { data: LandingData }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <LandingCard
        icon={Award}
        title="My Certificates"
        stat={String(data.learnCredentialCount)}
        statLabel="earned"
        ctaLabel="View Certificates"
        href="/account/courses"
        color="orange"
      />
      <LandingCard
        icon={User}
        title="My Account"
        description="Profile & settings"
        ctaLabel="Manage"
        href="/account/profile"
        color="gray"
      />
      <BladesCard balance={data.bladesBalance} />
    </div>
  )
}

function TechLanding({ data }: { data: LandingData }) {
  const tkSub = data.subscriptions.find(s => s.app_name === 'timekeeper')
  const calcSub = data.subscriptions.find(s => s.app_name === 'calculator')
  const tkBadge = tkSub ? statusBadges[tkSub.status] : null
  const calcBadge = calcSub ? statusBadges[calcSub.status] : null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <LandingCard
        icon={Clock}
        title="Timekeeper"
        stat={formatMinutesToHours(data.timekeeperMinutes)}
        statLabel={`${data.timekeeperSessions} sessions this month`}
        ctaLabel="Open Timekeeper"
        href="/account/timekeeper"
        color="blue"
        badge={tkBadge?.text}
        badgeColor={tkBadge?.color}
      />
      <LandingCard
        icon={Calculator}
        title="Calculator"
        description="Construction calculator with voice input"
        ctaLabel="Open Calculator"
        href="/account/calculator"
        color="purple"
        badge={calcBadge?.text}
        badgeColor={calcBadge?.color}
      />
      <LandingCard
        icon={ClipboardCheck}
        title="Checklist"
        description="Safety & inspection checklists"
        ctaLabel="Open Checklist"
        href="/account/checklist"
        color="teal"
        disabled
      />
      <LandingCard
        icon={Monitor}
        title="My Software"
        description="Custom apps & SaaS solutions"
        ctaLabel="Manage"
        href="/account/settings"
        color="blue"
      />
    </div>
  )
}

function GeneralLanding({ data }: { data: LandingData }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <LandingCard
        icon={Store}
        title="Shop"
        stat={data.shopOrderCount > 0 ? String(data.shopOrderCount) : undefined}
        statLabel={data.shopOrderCount > 0 ? 'orders' : undefined}
        description="Orders, products & rewards"
        ctaLabel="Go to Shop"
        href="/?from=shop"
        color="green"
        isMetaCard
      />
      <LandingCard
        icon={GraduationCap}
        title="Learn"
        stat={data.learnCredentialCount > 0 ? String(data.learnCredentialCount) : undefined}
        statLabel={data.learnCredentialCount > 0 ? 'certificates' : undefined}
        description="Certificates & courses"
        ctaLabel="Go to Learn"
        href="/?from=learn"
        color="orange"
        isMetaCard
      />
      <LandingCard
        icon={Cpu}
        title="Tech"
        stat={data.timekeeperSessions > 0 ? formatMinutesToHours(data.timekeeperMinutes) : undefined}
        statLabel={data.timekeeperSessions > 0 ? 'tracked this month' : undefined}
        description="Timekeeper, Calculator & more"
        ctaLabel="Go to Tech"
        href="/?from=tech"
        color="blue"
        isMetaCard
      />
    </div>
  )
}
