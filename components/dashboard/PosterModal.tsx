'use client'

import { useEffect, useMemo, useState } from 'react'
import { X, Download, Loader2, Sparkles, RefreshCw, LayoutGrid, FileImage } from 'lucide-react'

type ItemOption = {
  id: string
  name: string
  categoryName: string
  hasPhoto: boolean
}

type Props = {
  open: boolean
  onClose: () => void
  // Lista de items del menu (id + meta) para el dropdown de "Ficha de plato".
  // Pasada por el padre (menu/page.tsx) que ya tiene los datos cargados.
  items?: ItemOption[]
}

type Tab = 'menu' | 'dish'

export default function PosterModal({ open, onClose, items = [] }: Props) {
  const [tab, setTab] = useState<Tab>('menu')
  const [version, setVersion] = useState<number>(() => Date.now())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  // Cuando hay items, autoseleccionamos el primero con foto (si hay) sino el primero.
  useEffect(() => {
    if (selectedItemId || items.length === 0) return
    const withPhoto = items.find(i => i.hasPhoto)
    setSelectedItemId(withPhoto?.id ?? items[0].id)
  }, [items, selectedItemId])

  // Reset loading state cuando cambia tab/item/version.
  useEffect(() => {
    setLoading(true)
    setError(null)
  }, [tab, selectedItemId, version])

  const url = useMemo(() => {
    if (tab === 'menu') return `/api/menu-poster?v=${version}`
    if (tab === 'dish' && selectedItemId) return `/api/dish-card?itemId=${selectedItemId}&v=${version}`
    return null
  }, [tab, selectedItemId, version])

  const downloadName = tab === 'menu' ? 'menu-poster.png' : 'ficha-plato.png'
  const aspectRatio = tab === 'menu' ? '1080 / 1920' : '1080 / 1350'

  if (!open) return null

  function handleDownload() {
    if (!url) return
    const link = document.createElement('a')
    link.href = url
    link.download = downloadName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function handleRegenerate() {
    setVersion(Date.now())
  }

  const dishHelpText = tab === 'dish'
    ? 'Ficha de un solo plato (1080×1350, formato Instagram post 4:5). Usa la foto real del plato y enriquece el copy con IA: tagline, lista de ingredientes y descripción premium.'
    : 'Imagen vertical (1080×1920, ideal para Instagram Story / WhatsApp Status). Toma tu logo, colores y tipografías del branding. Muestra hasta 8 platos: primero los marcados como destacados ⭐, después los demás en orden.'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-neutral-900">Generar contenido</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 border-b border-neutral-100 flex gap-1">
          <TabButton active={tab === 'menu'} onClick={() => setTab('menu')} icon={<LayoutGrid className="w-4 h-4" />}>
            Póster del menú
          </TabButton>
          <TabButton active={tab === 'dish'} onClick={() => setTab('dish')} icon={<FileImage className="w-4 h-4" />}>
            Ficha de plato
          </TabButton>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-50">
          <p className="text-sm text-neutral-500 mb-4">{dishHelpText}</p>

          {/* Selector de plato (solo en tab "dish") */}
          {tab === 'dish' && (
            <div className="mb-4">
              {items.length === 0 ? (
                <div className="text-sm text-neutral-500 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3">
                  Cargá al menos un plato en tu menú para generar una ficha.
                </div>
              ) : (
                <select
                  value={selectedItemId ?? ''}
                  onChange={e => setSelectedItemId(e.target.value)}
                  className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-400"
                >
                  {items.map(it => (
                    <option key={it.id} value={it.id}>
                      {it.name} {it.hasPhoto ? '· con foto' : '· sin foto'} ({it.categoryName})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Preview */}
          <div className="relative bg-white rounded-xl border border-neutral-200 overflow-hidden flex items-center justify-center min-h-[400px]">
            {loading && url && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-neutral-400 bg-white z-10">
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                <span className="text-sm">Generando...</span>
                <span className="text-xs text-neutral-400">
                  {tab === 'dish' ? 'IA enriqueciendo copy y armando ficha (~5-10s)' : 'Carga las fuentes y arma el grid (~5s)'}
                </span>
              </div>
            )}
            {error && (
              <div className="p-8 text-center">
                <p className="text-sm text-red-600 mb-2">No se pudo generar.</p>
                <p className="text-xs text-neutral-500 mb-4">{error}</p>
                <button
                  onClick={handleRegenerate}
                  className="text-sm px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-neutral-700"
                >
                  Reintentar
                </button>
              </div>
            )}
            {url && !error && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt="Vista previa"
                className="max-w-full h-auto"
                style={{ aspectRatio, objectFit: 'contain' }}
                onLoad={() => { setLoading(false); setError(null) }}
                onError={() => { setLoading(false); setError('El servidor devolvió un error. Verificá tener al menos un plato cargado y, si es ficha, que el plato tenga foto.') }}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 bg-white gap-2">
          <button
            onClick={handleRegenerate}
            disabled={loading || !url}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Regenerar
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-neutral-500 hover:text-neutral-700"
            >
              Cerrar
            </button>
            <button
              onClick={handleDownload}
              disabled={loading || !!error || !url}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Descargar PNG
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
        active
          ? 'border-orange-500 text-orange-600'
          : 'border-transparent text-neutral-500 hover:text-neutral-700'
      }`}
    >
      {icon}
      {children}
    </button>
  )
}
