'use client'

import { useState } from 'react'
import { X, Download, Loader2, Sparkles, RefreshCw } from 'lucide-react'

export default function PosterModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Cache buster para forzar regenerar el poster cuando el user clickea "regenerar"
  // o cuando se abre el modal por primera vez en esta sesion.
  const [version, setVersion] = useState<number>(() => Date.now())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const posterUrl = `/api/menu-poster?v=${version}`

  function handleDownload() {
    const link = document.createElement('a')
    link.href = posterUrl
    link.download = 'menu-poster.png'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function handleRegenerate() {
    setLoading(true)
    setError(null)
    setVersion(Date.now())
  }

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
            <h2 className="text-lg font-semibold text-neutral-900">Póster del menú</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-50">
          <p className="text-sm text-neutral-500 mb-4">
            Imagen vertical (1080×1920, ideal para Instagram Story / WhatsApp Status). Toma tu logo, colores y
            tipografías del branding. Muestra hasta 8 platos: primero los marcados como destacados ⭐, después
            los demás en orden.
          </p>

          <div className="relative bg-white rounded-xl border border-neutral-200 overflow-hidden flex items-center justify-center min-h-[400px]">
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-neutral-400 bg-white z-10">
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                <span className="text-sm">Generando póster...</span>
                <span className="text-xs text-neutral-400">Carga las fuentes desde Google y arma el grid (~5s)</span>
              </div>
            )}
            {error && (
              <div className="p-8 text-center">
                <p className="text-sm text-red-600 mb-2">No se pudo generar el póster.</p>
                <p className="text-xs text-neutral-500 mb-4">{error}</p>
                <button
                  onClick={handleRegenerate}
                  className="text-sm px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-neutral-700"
                >
                  Reintentar
                </button>
              </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={version}
              src={posterUrl}
              alt="Vista previa del póster"
              className="max-w-full h-auto"
              style={{ aspectRatio: '1080 / 1920', objectFit: 'contain' }}
              onLoad={() => { setLoading(false); setError(null) }}
              onError={() => { setLoading(false); setError('El servidor devolvió un error. Probá agregar al menos un plato con foto y reintentar.') }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 bg-white gap-2">
          <button
            onClick={handleRegenerate}
            disabled={loading}
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
              disabled={loading || !!error}
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
