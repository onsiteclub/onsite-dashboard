export type SubscriptionStatus = 'none' | 'trialing' | 'active' | 'past_due' | 'canceled'
export type UserLevel = 'rookie' | 'apprentice' | 'journeyman' | 'master' | 'legend'
export type BladesTransactionType = 'earn' | 'redeem' | 'bonus' | 'adjustment'

export interface Profile {
  id: string
  email: string
  nome: string | null
  first_name: string | null
  last_name: string | null
  birthday: string | null
  gender: string | null
  trade: string | null
  phone: string | null
  company: string | null
  role: string | null
  bio: string | null
  avatar_url: string | null
  
  // Shopify
  shopify_customer_id: string | null
  
  // Blades
  blades_balance: number
  blades_lifetime_earned: number
  level: UserLevel
  
  // Device
  device_id: string | null
  device_registered_at: string | null
  device_model: string | null
  device_platform: 'ios' | 'android' | 'web' | null
  
  // Stripe
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: SubscriptionStatus
  trial_ends_at: string | null
  subscription_started_at: string | null
  subscription_canceled_at: string | null
  
  // Features
  has_payment_method: boolean
  voice_calculator_enabled: boolean
  sync_enabled: boolean
  
  // Admin
  is_admin: boolean
  is_suspended: boolean
  
  // Timestamps
  created_at: string
  updated_at: string
  last_seen_at: string | null
}

export interface Local {
  id: string
  user_id: string
  nome: string
  endereco: string
  latitude: number
  longitude: number
  raio: number
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Registro {
  id: string
  user_id: string
  local_id: string | null
  entrada: string
  saida: string | null
  local_nome: string
  local_latitude: number
  local_longitude: number
  sync_status: string
  // Campos de edição
  edited_at: string | null
  edited_by: 'manual' | 'geofence' | null
  original_entrada: string | null
  original_saida: string | null
  edit_reason: string | null
  created_at: string
  updated_at: string
}

export interface BladesTransaction {
  id: string
  user_id: string
  amount: number
  type: BladesTransactionType
  reason: string
  order_id: string | null
  product_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface AdminMetrics {
  total_users: number
  trial_users: number
  active_paid_users: number
  canceled_users: number
  total_blades: number
  total_sessions: number
  mrr_cad: number
}

export interface FeatureUsage {
  feature: string
  usage_count: number
  unique_users: number
}
