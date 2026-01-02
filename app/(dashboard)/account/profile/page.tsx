import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDate, getInitials, getLevelColor } from '@/lib/utils'
import { User, Mail, Phone, Building2, Briefcase, Calendar, Award } from 'lucide-react'
import { EditProfileForm } from './EditProfileForm'

export const metadata = {
  title: 'Perfil',
}

export default async function ProfilePage() {
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
        <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="text-gray-600 mt-1">
          Gerencie suas informações pessoais
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-brand-500 to-brand-600" />
        
        {/* Avatar & Basic Info */}
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg bg-brand-100 flex items-center justify-center">
                <span className="text-3xl font-bold text-brand-700">
                  {getInitials(profile?.nome)}
                </span>
              </div>
            )}
            <div className="flex-1 sm:mb-2">
              <h2 className="text-2xl font-bold text-gray-900">
                {profile?.nome}
              </h2>
              <p className="text-gray-500">{user.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(profile?.level || 'rookie')}`}>
                <Award className="w-4 h-4 inline mr-1" />
                {profile?.level?.charAt(0).toUpperCase()}{profile?.level?.slice(1) || 'Rookie'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <EditProfileForm profile={profile} />

      {/* Account Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-5">
          Informações da Conta
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoItem
            icon={Mail}
            label="Email"
            value={user.email || '-'}
          />
          <InfoItem
            icon={Calendar}
            label="Membro desde"
            value={formatDate(profile?.created_at || user.created_at || '')}
          />
          <InfoItem
            icon={Award}
            label="Blades Acumulados"
            value={`${profile?.blades_lifetime_earned || 0} Blades`}
          />
          <InfoItem
            icon={Calendar}
            label="Último Acesso"
            value={profile?.last_seen_at ? formatDate(profile.last_seen_at) : 'Agora'}
          />
        </div>
      </div>
    </div>
  )
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: any
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
