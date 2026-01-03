'use client'

import { useState, useMemo } from 'react'
import { 
  Clock, MapPin, Calendar, Download, FileSpreadsheet, 
  FileText, ChevronDown, Edit3, Check, X, Share2,
  BarChart3, Filter
} from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { HoursChart } from './components/HoursChart'
import { DateRangePicker } from './components/DateRangePicker'
import { EditableCell } from './components/EditableCell'
import { ReportHeader } from './components/ReportHeader'
import { formatMinutesToHours } from '@/lib/utils'
import type { Registro, Local, Profile } from '@/lib/supabase/types'

interface TimekeeperDashboardProps {
  profile: Profile
  registros: Registro[]
  locais: Local[]
}

export type DateRange = {
  start: Date
  end: Date
  label?: string
}

export default function TimekeeperDashboard({ 
  profile, 
  registros: initialRegistros, 
  locais 
}: TimekeeperDashboardProps) {
  const [registros, setRegistros] = useState(initialRegistros)
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 7)
    return { start, end, label: 'Last 7 days' }
  })
  const [showChart, setShowChart] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  // Filtrar registros pelo período selecionado
  const filteredRegistros = useMemo(() => {
    return registros.filter(r => {
      const entrada = new Date(r.entrada)
      return entrada >= dateRange.start && entrada <= dateRange.end
    })
  }, [registros, dateRange])

  // Calcular estatísticas
  const stats = useMemo(() => {
    let totalMinutos = 0
    const registrosCompletos = filteredRegistros.filter(r => r.saida)
    const diasTrabalhados = new Set<string>()
    const locaisUsados = new Set<string>()
    let registrosEditados = 0

    registrosCompletos.forEach(reg => {
      const entrada = new Date(reg.entrada)
      const saida = new Date(reg.saida!).getTime()
      totalMinutos += Math.round((saida - entrada.getTime()) / 60000)
      diasTrabalhados.add(entrada.toDateString())
      if (reg.local_nome) locaisUsados.add(reg.local_nome)
      if ((reg as any).edited_at) registrosEditados++
    })

    return {
      totalMinutos,
      totalSessoes: filteredRegistros.length,
      diasTrabalhados: diasTrabalhados.size,
      locaisUsados: Array.from(locaisUsados),
      registrosEditados
    }
  }, [filteredRegistros])

  // Dados para o gráfico (horas por dia)
  const chartData = useMemo(() => {
    const dayMap = new Map<string, number>()
    
    // Inicializar todos os dias do período com 0
    const current = new Date(dateRange.start)
    while (current <= dateRange.end) {
      const key = current.toISOString().split('T')[0]
      dayMap.set(key, 0)
      current.setDate(current.getDate() + 1)
    }

    // Somar horas por dia
    filteredRegistros.forEach(reg => {
      if (!reg.saida) return
      const entrada = new Date(reg.entrada)
      const saida = new Date(reg.saida)
      const key = entrada.toISOString().split('T')[0]
      const minutos = Math.round((saida.getTime() - entrada.getTime()) / 60000)
      dayMap.set(key, (dayMap.get(key) || 0) + minutos / 60)
    })

    return Array.from(dayMap.entries())
      .map(([date, hours]) => ({
        date,
        hours: Math.round(hours * 100) / 100,
        label: new Date(date + 'T12:00:00').toLocaleDateString('en-CA', { 
          weekday: 'short', 
          day: 'numeric' 
        })
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [filteredRegistros, dateRange])

  // Atualizar registro
  const handleUpdateRegistro = async (
    id: string, 
    field: 'entrada' | 'saida', 
    value: string
  ) => {
    try {
      const response = await fetch('/api/timekeeper/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, field, value })
      })

      if (!response.ok) throw new Error('Failed to update')

      const updated = await response.json()
      
      setRegistros(prev => 
        prev.map(r => r.id === id ? { ...r, ...updated } : r)
      )
      setEditingId(null)
    } catch (error) {
      console.error('Error updating registro:', error)
      alert('Erro ao atualizar registro')
    }
  }

  // Export Excel
  const handleExportExcel = async () => {
    setIsExporting(true)
    try {
      const response = await fetch('/api/timekeeper/export/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registros: filteredRegistros,
          profile,
          dateRange: {
            start: dateRange.start.toISOString(),
            end: dateRange.end.toISOString()
          },
          stats
        })
      })

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `timekeeper-${dateRange.start.toISOString().split('T')[0]}-${dateRange.end.toISOString().split('T')[0]}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
      alert('Erro ao exportar Excel')
    } finally {
      setIsExporting(false)
    }
  }

  // Export PDF
  const handleExportPDF = async () => {
    setIsExporting(true)
    try {
      const response = await fetch('/api/timekeeper/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registros: filteredRegistros,
          profile,
          dateRange: {
            start: dateRange.start.toISOString(),
            end: dateRange.end.toISOString()
          },
          stats
        })
      })

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `timekeeper-${dateRange.start.toISOString().split('T')[0]}-${dateRange.end.toISOString().split('T')[0]}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
      alert('Erro ao exportar PDF')
    } finally {
      setIsExporting(false)
    }
  }

  const userName = profile.first_name && profile.last_name 
    ? `${profile.first_name} ${profile.last_name}`
    : profile.email

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timekeeper</h1>
          <p className="text-gray-500 mt-1">
            Track your work hours and generate reports
          </p>
        </div>

        {/* Export buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowChart(!showChart)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
              showChart 
                ? 'bg-brand-50 border-brand-200 text-brand-700' 
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Chart</span>
          </button>

          <div className="h-6 w-px bg-gray-200" />

          <button
            onClick={handleExportExcel}
            disabled={isExporting || filteredRegistros.length === 0}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Excel</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isExporting || filteredRegistros.length === 0}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">PDF</span>
          </button>

          <button
            disabled
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed"
            title="Coming soon"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Video</span>
          </button>
        </div>
      </div>

      {/* Date Range Picker */}
      <DateRangePicker 
        dateRange={dateRange} 
        onChange={setDateRange} 
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={Clock}
          title="Total Hours"
          value={formatMinutesToHours(stats.totalMinutos)}
          color="amber"
        />
        <StatCard
          icon={Calendar}
          title="Days Worked"
          value={stats.diasTrabalhados}
          color="blue"
        />
        <StatCard
          icon={MapPin}
          title="Locations"
          value={stats.locaisUsados.length}
          color="green"
        />
        <StatCard
          icon={Edit3}
          title="Sessions"
          value={stats.totalSessoes}
          subtitle={stats.registrosEditados > 0 ? `${stats.registrosEditados} edited` : undefined}
          color="purple"
        />
      </div>

      {/* Chart */}
      {showChart && chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Hours by Day</h2>
          <HoursChart data={chartData} />
        </div>
      )}

      {/* Records Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Records
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({filteredRegistros.length})
            </span>
          </h2>
        </div>

        {filteredRegistros.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Clock In
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Clock Out
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRegistros.map((registro) => {
                    const entrada = new Date(registro.entrada)
                    const saida = registro.saida ? new Date(registro.saida) : null
                    const duracao = saida
                      ? Math.round((saida.getTime() - entrada.getTime()) / 60000)
                      : null
                    const isEdited = !!(registro as any).edited_at
                    const isEditing = editingId === registro.id

                    return (
                      <tr 
                        key={registro.id} 
                        className={`hover:bg-gray-50 transition-colors ${
                          isEdited ? 'bg-amber-50/50' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <span className="font-medium text-gray-900">
                            {registro.local_nome || 'Unknown'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {entrada.toLocaleDateString('en-CA', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <EditableCell
                            value={entrada}
                            type="time"
                            isEditing={isEditing}
                            isEdited={isEdited && !!(registro as any).original_entrada}
                            onSave={(value) => handleUpdateRegistro(registro.id, 'entrada', value)}
                            onCancel={() => setEditingId(null)}
                          />
                        </td>
                        <td className="py-3 px-4">
                          {saida ? (
                            <EditableCell
                              value={saida}
                              type="time"
                              isEditing={isEditing}
                              isEdited={isEdited && !!(registro as any).original_saida}
                              onSave={(value) => handleUpdateRegistro(registro.id, 'saida', value)}
                              onCancel={() => setEditingId(null)}
                            />
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              In progress
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {duracao ? (
                            <span className="font-semibold text-gray-900">
                              {formatMinutesToHours(duracao)}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {!isEditing && saida && (
                            <button
                              onClick={() => setEditingId(registro.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            {stats.registrosEditados > 0 && (
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-3 h-3 rounded bg-amber-100 border border-amber-200" />
                  <span>Manually edited records</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-8">
            <EmptyState
              icon={Clock}
              title="No records found"
              description="No records found for the selected period. Try adjusting the date range."
            />
          </div>
        )}
      </div>

      {/* Report Summary (for PDF/sharing) */}
      <ReportHeader
        userName={userName}
        dateRange={dateRange}
        stats={stats}
        hidden
      />
    </div>
  )
}
