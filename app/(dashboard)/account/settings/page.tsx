import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { CreditCard, Smartphone, Shield, User, AlertCircle, Check, X } from 'lucide-react'
import { SubscriptionManager } from './SubscriptionManager'
import { DeviceManager } from './DeviceManager'

export const metadata = {
  title: 'Settings | OnSite Club',
}

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const [
    { data: coreProfile },
    { data: allSubscriptions },
    { data: device },
  ] = await Promise.all([
    supabase.from('core_profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('billing_subscriptions')
      .select('app_name, status, stripe_customer_id, current_period_end, cancel_at_period_end, trial_end, has_payment_method')
      .eq('user_id', user.id),
    supabase
      .from('core_devices')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .single(),
  ])

  const subs = allSubscriptions || []
  const hasAnyActive = subs.some(s => s.status === 'active' || s.status === 'trialing')
  const activeTrials = subs.filter(s => s.status === 'trialing')

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and preferences</p>
      </div>

      {/* Trial Banner */}
      {activeTrials.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900">Trial active</h3>
              <p className="text-blue-700 text-sm mt-1">
                {activeTrials.map(s => {
                  const days = s.trial_end
                    ? Math.max(0, Math.ceil((new Date(s.trial_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                    : 0
                  return `${s.app_name}: ${days} days remaining`
                }).join(' \u2022 ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Subscriptions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Subscriptions</h2>
        </div>

        <SubscriptionManager
          subscriptions={subs}
          userEmail={user.email || ''}
          userId={user.id}
        />
      </div>

      {/* Device */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-purple-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Linked Device</h2>
        </div>

        <DeviceManager
          deviceId={device?.device_id ?? null}
          deviceModel={device?.model ?? null}
          devicePlatform={device?.platform ?? null}
          deviceRegisteredAt={device?.first_seen_at ?? null}
        />
      </div>

      {/* Account */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
            <User className="w-5 h-5 text-gray-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Account</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-4 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Email</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center justify-between py-4 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Password</p>
              <p className="text-sm text-gray-500">{'\u2022'.repeat(8)}</p>
            </div>
            <button className="text-sm text-amber-600 hover:text-amber-700 font-medium">
              Change
            </button>
          </div>

          <div className="pt-4">
            <button className="text-sm text-red-600 hover:text-red-700 font-medium">
              Delete Account
            </button>
            <p className="text-xs text-gray-500 mt-1">
              This action is permanent and cannot be undone
            </p>
          </div>
        </div>
      </div>

      {/* Legal */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Security & Privacy</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {['Terms of Use', 'Privacy Policy', 'Cancellation Policy', 'Data Security'].map(text => (
            <a
              key={text}
              href={`/${text.toLowerCase().replace(/ /g, '-')}`}
              className="block p-3 rounded-lg border border-gray-200 text-gray-700 hover:border-amber-300 hover:text-amber-600 transition-colors"
            >
              {text}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
