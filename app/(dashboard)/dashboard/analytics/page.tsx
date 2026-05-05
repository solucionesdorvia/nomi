'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Eye, MousePointer, Smartphone, Monitor, Star } from 'lucide-react'

type AnalyticsData = {
  totalViews: number
  byEvent: { event: string; _count: { _all: number } }[]
  byDay: { day: string; count: number }[]
  topItems: { id: string; name: string; price: any; views: number }[]
  byDevice: { device: string | null; _count: { _all: number } }[]
}

const PERIOD_OPTIONS = [
  { label: '7 días', value: 7 },
  { label: '30 días', value: 30 },
  { label: '90 días', value: 90 },
]

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/analytics?days=${days}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [days])

  const itemViews = data?.byEvent.find(e => e.event === 'item_view')?._count._all ?? 0
  const itemClicks = data?.byEvent.find(e => e.event === 'item_click')?._count._all ?? 0
  const mobileViews = data?.byDevice.find(d => d.device === 'mobile')?._count._all ?? 0
  const desktopViews = data?.byDevice.find(d => d.device === 'desktop')?._count._all ?? 0
  const totalDevices = mobileViews + desktopViews || 1

  // Gráfico de barras SVG
  const maxCount = Math.max(...(data?.byDay.map(d => d.count) ?? [1]), 1)
  const chartH = 120

  function formatPrice(p: any) {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(Number(p))
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900">Analytics</h1>
          <p className="text-sm text-neutral-500 mt-1">Cómo interactúan tus clientes con el menú.</p>
        </div>
        <div className="flex gap-1 bg-neutral-100 p-1 rounded-lg w-fit">
          {PERIOD_OPTIONS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setDays(value)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${days === value ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-neutral-400 py-12">
          <div className="w-4 h-4 rounded-full border-2 border-neutral-300 border-t-orange-500 animate-spin" />
          Cargando datos...
        </div>
      ) : (
        <div className="space-y-6">

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { icon: Eye, label: 'Vistas del menú', value: data?.totalViews ?? 0, color: 'text-orange-500' },
              { icon: MousePointer, label: 'Platos vistos', value: itemViews, color: 'text-blue-500' },
              { icon: Star, label: 'Clics en platos', value: itemClicks, color: 'text-amber-500' },
              { icon: TrendingUp, label: 'Móvil vs escritorio', value: `${Math.round((mobileViews / totalDevices) * 100)}%`, color: 'text-green-500', suffix: ' móvil' },
            ].map(({ icon: Icon, label, value, color, suffix }) => (
              <div key={label} className="bg-white rounded-xl border border-neutral-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <p className="text-xs text-neutral-500">{label}</p>
                </div>
                <p className="text-2xl font-semibold text-neutral-900">
                  {typeof value === 'number' ? value.toLocaleString('es-AR') : value}
                  {suffix && <span className="text-sm font-normal text-neutral-400">{suffix}</span>}
                </p>
              </div>
            ))}
          </div>

          {/* Gráfico de vistas por día */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <p className="text-sm font-medium text-neutral-700 mb-6">Vistas por día</p>
            {data?.byDay.length === 0 ? (
              <p className="text-sm text-neutral-400 text-center py-8">Sin datos aún. Compartí tu menú para empezar a ver estadísticas.</p>
            ) : (
              <div className="flex items-end gap-1.5" style={{ height: chartH + 24 }}>
                {data?.byDay.map(({ day, count }) => {
                  const barH = Math.max(4, Math.round((count / maxCount) * chartH))
                  const date = new Date(day)
                  const label = date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-1 group">
                      <div className="relative w-full flex justify-center">
                        <div
                          className="w-full max-w-8 bg-orange-500 rounded-sm opacity-80 group-hover:opacity-100 transition-opacity"
                          style={{ height: barH }}
                          title={`${count} vistas`}
                        />
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-neutral-800 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          {count}
                        </div>
                      </div>
                      {data.byDay.length <= 14 && (
                        <p className="text-xs text-neutral-400 whitespace-nowrap" style={{ fontSize: 10 }}>{label}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Top platos */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <p className="text-sm font-medium text-neutral-700 mb-4">Platos más vistos</p>
              {data?.topItems.length === 0 ? (
                <p className="text-sm text-neutral-400">Sin datos aún.</p>
              ) : (
                <div className="space-y-3">
                  {data?.topItems.map((item, i) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-neutral-300 w-4">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-800 truncate">{item.name}</p>
                        <p className="text-xs text-neutral-400">{formatPrice(item.price)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-orange-500">{item.views}</p>
                        <p className="text-xs text-neutral-400">vistas</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dispositivos */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <p className="text-sm font-medium text-neutral-700 mb-4">Dispositivos</p>
              <div className="space-y-4">
                {[
                  { label: 'Móvil', icon: Smartphone, count: mobileViews, color: 'bg-orange-500' },
                  { label: 'Escritorio', icon: Monitor, count: desktopViews, color: 'bg-blue-500' },
                ].map(({ label, icon: Icon, count, color }) => {
                  const pct = Math.round((count / totalDevices) * 100)
                  return (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-neutral-400" />
                          <p className="text-sm text-neutral-700">{label}</p>
                        </div>
                        <p className="text-sm font-medium text-neutral-900">{pct}%</p>
                      </div>
                      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-100">
                <p className="text-xs text-neutral-400 mb-2">Consejo</p>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  {mobileViews > desktopViews
                    ? 'La mayoría de tus clientes usa el menú desde el celular. Asegurate de que las fotos se vean bien en pantallas chicas.'
                    : 'Tus clientes usan bastante el escritorio. Puede ser clientes revisando antes de ir al local.'}
                </p>
              </div>
            </div>
          </div>

          {/* Sin datos — empty state */}
          {(data?.totalViews ?? 0) === 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 text-center">
              <p className="text-2xl mb-2">📊</p>
              <p className="text-sm font-medium text-orange-800">Todavía no hay datos</p>
              <p className="text-xs text-orange-600 mt-1">Compartí el link o QR de tu menú para empezar a ver estadísticas en tiempo real.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
