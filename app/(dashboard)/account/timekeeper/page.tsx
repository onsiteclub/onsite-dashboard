import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatMinutesToHours } from '@/lib/utils'
import { StatCard } from '@/components/ui/StatCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Clock, MapPin, Calendar } from 'lucide-react'

export const metadata = {
  title: 'Timekeeper',
}

export default async function TimekeeperPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // Buscar locais do usuário
  const { data: locais } = await supabase
    .from('locais')
    .select('*')
    .eq('user_id', user.id)
    .order('nome')

  // Buscar registros (últimos 30 dias)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: registros } = await supabase
    .from('registros')
    .select('*')
    .eq('user_id', user.id)
    .gte('entrada', thirtyDaysAgo.toISOString())
    .order('entrada', { ascending: false })

  // Calcular estatísticas
  let totalMinutos = 0
  const registrosCompletos = registros?.filter(r => r.saida) || []

  registrosCompletos.forEach(reg => {
    const entrada = new Date(reg.entrada).getTime()
    const saida = new Date(reg.saida).getTime()
    totalMinutos += Math.round((saida - entrada) / 60000)
  })

  const locaisAtivos = locais?.filter(l => l.ativo) || []

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Timekeeper</h1>
        <p className="text-gray-600 mt-1">
          Gerencie seus locais e registros de trabalho
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard
          icon={Clock}
          title="Total de Horas"
          value={formatMinutesToHours(totalMinutos)}
          subtitle="Últimos 30 dias"
          color="blue"
        />
        <StatCard
          icon={Calendar}
          title="Sessões"
          value={registros?.length || 0}
          subtitle="Últimos 30 dias"
          color="green"
        />
        <StatCard
          icon={MapPin}
          title="Locais Ativos"
          value={locaisAtivos.length}
          color="purple"
        />
      </div>

      {/* Locais */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Meus Locais</h2>
          <span className="text-sm text-gray-500">
            {locais?.length || 0} locais cadastrados
          </span>
        </div>

        {locais && locais.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locais.map((local) => (
              <div
                key={local.id}
                className="border border-gray-200 rounded-xl p-4 hover:border-brand-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    local.ativo
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {local.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{local.nome}</h3>
                <p className="text-sm text-gray-500 line-clamp-2">{local.endereco}</p>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400">
                    Raio de geofence: {local.raio}m
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={MapPin}
            title="Nenhum local cadastrado"
            description="Adicione locais no app mobile para começar a registrar suas horas automaticamente."
          />
        )}
      </div>

      {/* Registros */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Registros Recentes
        </h2>

        {registros && registros.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Local
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Entrada
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Saída
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Duração
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {registros.slice(0, 20).map((registro) => {
                  const entrada = new Date(registro.entrada)
                  const saida = registro.saida ? new Date(registro.saida) : null
                  const duracao = saida
                    ? Math.round((saida.getTime() - entrada.getTime()) / 60000)
                    : null

                  return (
                    <tr key={registro.id} className="hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <span className="font-medium text-gray-900">
                          {registro.local_nome}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {entrada.toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {entrada.toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-4 px-4">
                        {saida ? (
                          <span className="text-gray-600">
                            {saida.toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Em andamento
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {duracao ? (
                          <span className="font-semibold text-gray-900">
                            {formatMinutesToHours(duracao)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Clock}
            title="Nenhum registro encontrado"
            description="Use o app mobile para registrar suas horas de trabalho automaticamente."
          />
        )}
      </div>
    </div>
  )
}
