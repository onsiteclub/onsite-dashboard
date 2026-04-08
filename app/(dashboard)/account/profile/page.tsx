import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDate, getInitials } from '@/lib/utils'
import { Mail, Calendar, Clock, ShoppingBag, BookOpen } from 'lucide-react'
import { EditProfileForm } from './EditProfileForm'

export const metadata = {
  title: 'Profile | OnSite Club',
}

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [
    { data: profile },
    { data: entries },
    { data: shopOrders },
    { data: learnCredentials },
  ] = await Promise.all([
    supabase.from('core_profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('app_timekeeper_entries')
      .select('id')
      .eq('user_id', user.id)
      .gte('entry_at', thirtyDaysAgo.toISOString()),
    supabase
      .from('app_shop_orders')
      .select('id')
      .eq('customer_email', user.email || ''),
    supabase
      .from('learn_credentials')
      .select('id')
      .eq('user_id', user.id),
  ])

  const displayName = profile?.full_name || user.email || 'User'

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 mt-1">Manage your personal information</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-amber-500 to-orange-500" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg bg-amber-100 flex items-center justify-center">
                <span className="text-3xl font-bold text-amber-700">
                  {getInitials(displayName)}
                </span>
              </div>
            )}
            <div className="flex-1 sm:mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{displayName}</h2>
              <p className="text-gray-500">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cross-product Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Clock}
          label="Timekeeper sessions"
          value={String(entries?.length || 0)}
          sublabel="Last 30 days"
          color="blue"
        />
        <StatCard
          icon={ShoppingBag}
          label="Shop orders"
          value={String(shopOrders?.length || 0)}
          sublabel="Total"
          color="green"
        />
        <StatCard
          icon={BookOpen}
          label="Certificates"
          value={String(learnCredentials?.length || 0)}
          sublabel="Earned"
          color="orange"
        />
      </div>

      {/* Edit Form */}
      <EditProfileForm profile={profile} />

      {/* Account Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-5">Account Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoItem
            icon={Mail}
            label="Email"
            value={user.email || '-'}
          />
          <InfoItem
            icon={Calendar}
            label="Member since"
            value={formatDate(profile?.created_at || user.created_at || '')}
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sublabel, color }: {
  icon: React.ElementType
  label: string
  value: string
  sublabel: string
  color: string
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[color] || 'bg-gray-50 text-gray-600'}`}>
          <Icon className="w-4 h-4" />
        </div>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>
    </div>
  )
}

function InfoItem({ icon: Icon, label, value }: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
        <Icon className="w-5 h-5 text-gray-500" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-medium text-gray-900">{value}</p>
      </div>
    </div>
  )
}
