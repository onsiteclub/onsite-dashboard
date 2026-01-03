import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TimekeeperDashboard from './TimekeeperDashboard'

export const metadata = {
  title: 'Timekeeper | OnSite Club',
}

export default async function TimekeeperPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // Buscar profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/')

  // Buscar locais do usuário
  const { data: locais } = await supabase
    .from('locais')
    .select('*')
    .eq('user_id', user.id)
    .order('nome')

  // Buscar registros (últimos 90 dias para ter dados suficientes)
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const { data: registros } = await supabase
    .from('registros')
    .select('*')
    .eq('user_id', user.id)
    .gte('entrada', ninetyDaysAgo.toISOString())
    .order('entrada', { ascending: false })

  return (
    <TimekeeperDashboard
      profile={profile}
      registros={registros || []}
      locais={locais || []}
    />
  )
}
