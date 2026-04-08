'use client'

import { useState } from 'react'
import { Loader2, CreditCard, ExternalLink, Settings } from 'lucide-react'

const AUTH_HUB_URL = process.env.NEXT_PUBLIC_AUTH_HUB_URL || 'https://auth.onsiteclub.ca'

interface SubscriptionManagerProps {
  subscriptions: {
    app_name: string
    status: string
    stripe_customer_id: string | null
    current_period_end: string | null
    cancel_at_period_end: boolean
    trial_end: string | null
  }[]
  userEmail: string
  userId: string
}

const appDisplayNames: Record<string, string> = {
  calculator: 'OnSite Calculator',
  timekeeper: 'OnSite Timekeeper',
}

const statusLabels: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700' },
  trialing: { label: 'Trial', color: 'bg-blue-100 text-blue-700' },
  canceled: { label: 'Canceled', color: 'bg-gray-100 text-gray-600' },
  past_due: { label: 'Past Due', color: 'bg-red-100 text-red-700' },
  none: { label: 'Not Subscribed', color: 'bg-gray-100 text-gray-500' },
  inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-500' },
}

export function SubscriptionManager({ subscriptions, userEmail, userId }: SubscriptionManagerProps) {
  const [loadingApp, setLoadingApp] = useState<string | null>(null)

  function handleUpgrade(appName: string) {
    setLoadingApp(appName)
    const params = new URLSearchParams({
      prefilled_email: userEmail,
      user_id: userId,
    })
    window.location.href = `${AUTH_HUB_URL}/checkout/${appName}?${params}`
  }

  function handleManage() {
    setLoadingApp('manage')
    window.location.href = `${AUTH_HUB_URL}/manage`
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-CA', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  function getTrialDaysRemaining(trialEnd: string | null) {
    if (!trialEnd) return 0
    const end = new Date(trialEnd)
    const now = new Date()
    return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
  }

  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-8">
        <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600 mb-2">No subscriptions found</p>
        <p className="text-sm text-gray-400 mb-6">Subscribe to unlock premium features</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => handleUpgrade('timekeeper')}
            disabled={!!loadingApp}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loadingApp === 'timekeeper' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Start Timekeeper Trial
          </button>
          <button
            onClick={() => handleUpgrade('calculator')}
            disabled={!!loadingApp}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loadingApp === 'calculator' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Start Calculator Trial
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {subscriptions.map((sub) => {
        const status = statusLabels[sub.status] || statusLabels.inactive
        const isActive = sub.status === 'active' || sub.status === 'trialing'
        const trialDays = getTrialDaysRemaining(sub.trial_end)

        return (
          <div
            key={sub.app_name}
            className="border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {appDisplayNames[sub.app_name] || sub.app_name}
                </h3>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${status.color}`}>
                  {status.label}
                  {sub.status === 'trialing' && trialDays > 0 && ` (${trialDays} days left)`}
                  {sub.cancel_at_period_end && isActive && ' - Cancels at period end'}
                </span>
              </div>
            </div>

            {sub.current_period_end && isActive && (
              <p className="text-sm text-gray-500 mb-3">
                {sub.cancel_at_period_end
                  ? `Access until: ${formatDate(sub.current_period_end)}`
                  : `Next billing: ${formatDate(sub.current_period_end)}`}
              </p>
            )}

            <div className="flex gap-2">
              {sub.stripe_customer_id && (
                <button
                  onClick={handleManage}
                  disabled={!!loadingApp}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {loadingApp === 'manage' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
                  Manage
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}

              {(sub.status === 'canceled' || sub.status === 'inactive') && (
                <button
                  onClick={() => handleUpgrade(sub.app_name)}
                  disabled={!!loadingApp}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50"
                >
                  {loadingApp === sub.app_name ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Reactivate
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
