import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { CreditCard, Smartphone, Shield, User, AlertCircle, Check, X } from 'lucide-react'
import { SubscriptionManager } from './SubscriptionManager'
import { DeviceManager } from './DeviceManager'

export const metadata = {
  title: 'Configurações',
}

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600 mt-1">
          Gerencie sua conta e preferências
        </p>
      </div>

      {/* Subscription Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Assinatura</h2>
        </div>

        {/* Status */}
        <div className="space-y-4">
          <div className="flex items-center justify-between py-4 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Status</p>
              <p className="text-sm text-gray-500">Estado atual da sua assinatura</p>
            </div>
            <SubscriptionBadge status={profile?.subscription_status || 'none'} />
          </div>

          {/* Trial Info */}
          {profile?.subscription_status === 'trialing' && profile?.trial_ends_at && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-900">Trial de 6 meses ativo</h3>
                  <p className="text-blue-700 text-sm mt-1">
                    Seu trial termina em {formatDate(profile.trial_ends_at)}.
                    Após isso, será cobrado CAD $9.99/mês automaticamente.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Subscription Manager (Client Component) */}
          <SubscriptionManager
            hasPaymentMethod={profile?.has_payment_method || false}
            subscriptionStatus={profile?.subscription_status || 'none'}
            stripeCustomerId={profile?.stripe_customer_id}
          />

          {/* Features */}
          <div className="pt-4">
            <p className="font-medium text-gray-900 mb-3">Features Liberadas</p>
            <div className="space-y-2">
              <FeatureStatus
                name="Voice Calculator"
                enabled={profile?.voice_calculator_enabled || false}
              />
              <FeatureStatus
                name="Sync Automático"
                enabled={profile?.sync_enabled || false}
              />
              <FeatureStatus
                name="Blades Rewards"
                enabled={profile?.has_payment_method || false}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Device Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-purple-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Dispositivo Vinculado</h2>
        </div>

        <DeviceManager
          deviceId={profile?.device_id}
          deviceModel={profile?.device_model}
          devicePlatform={profile?.device_platform}
          deviceRegisteredAt={profile?.device_registered_at}
        />
      </div>

      {/* Account Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
            <User className="w-5 h-5 text-gray-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Conta</h2>
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
              <p className="font-medium text-gray-900">Senha</p>
              <p className="text-sm text-gray-500">••••••••</p>
            </div>
            <button className="text-sm text-brand-600 hover:text-brand-700 font-medium">
              Alterar
            </button>
          </div>

          <div className="pt-4">
            <button className="text-sm text-red-600 hover:text-red-700 font-medium">
              Deletar Conta
            </button>
            <p className="text-xs text-gray-500 mt-1">
              Esta ação é permanente e não pode ser desfeita
            </p>
          </div>
        </div>
      </div>

      {/* Legal Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Segurança & Privacidade</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <LegalLink href="/terms" text="📄 Termos de Uso" />
          <LegalLink href="/privacy" text="🔒 Política de Privacidade" />
          <LegalLink href="/cancellation" text="💳 Política de Cancelamento" />
          <LegalLink href="/security" text="🛡️ Segurança de Dados" />
        </div>
      </div>
    </div>
  )
}

function SubscriptionBadge({ status }: { status: string }) {
  const badges: Record<string, { label: string; color: string; icon: string }> = {
    trialing: { label: 'Trial Ativo', color: 'bg-blue-100 text-blue-800', icon: '🎉' },
    active: { label: 'Ativo', color: 'bg-green-100 text-green-800', icon: '✅' },
    past_due: { label: 'Pagamento Pendente', color: 'bg-yellow-100 text-yellow-800', icon: '⚠️' },
    canceled: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: '❌' },
    none: { label: 'Sem Assinatura', color: 'bg-gray-100 text-gray-800', icon: '⏸️' },
  }

  const badge = badges[status] || badges.none

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${badge.color}`}>
      <span>{badge.icon}</span>
      {badge.label}
    </span>
  )
}

function FeatureStatus({ name, enabled }: { name: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-gray-700">{name}</span>
      {enabled ? (
        <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
          <Check className="w-4 h-4" />
          Ativado
        </span>
      ) : (
        <span className="flex items-center gap-1.5 text-sm text-gray-400">
          <X className="w-4 h-4" />
          Bloqueado
        </span>
      )}
    </div>
  )
}

function LegalLink({ href, text }: { href: string; text: string }) {
  return (
    <a
      href={href}
      className="block p-3 rounded-lg border border-gray-200 text-gray-700 hover:border-brand-300 hover:text-brand-600 transition-colors"
    >
      {text}
    </a>
  )
}
