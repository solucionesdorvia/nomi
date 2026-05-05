'use client'

import { useState } from 'react'
import { X, Sparkles, Loader2, Trash2 } from 'lucide-react'
import ImageUpload from './ImageUpload'
import { extractCombinedPaletteFromUrls, type ExtractedPalette } from '@/lib/extract-palette'

const MAX_INSPIRATIONS = 5

type Props = {
  open: boolean
  onClose: () => void
  // Cuando el user aprueba, devolvemos la paleta combinada al padre.
  onApply: (palette: ExtractedPalette) => void
}

export default function InspirationPaletteModal({ open, onClose, onApply }: Props) {
  const [urls, setUrls] = useState<string[]>([])
  const [extracting, setExtracting] = useState(false)
  const [previewPalette, setPreviewPalette] = useState<ExtractedPalette | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  function addUrl(url: string) {
    if (!url) return
    setUrls(prev => [...prev, url].slice(0, MAX_INSPIRATIONS))
    setPreviewPalette(null) // invalidar paleta previa al cambiar inputs
  }

  function removeUrl(idx: number) {
    setUrls(prev => prev.filter((_, i) => i !== idx))
    setPreviewPalette(null)
  }

  async function generate() {
    if (urls.length === 0) return
    setExtracting(true)
    setError(null)
    try {
      const palette = await extractCombinedPaletteFromUrls(urls)
      setPreviewPalette(palette)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al analizar las imágenes')
    } finally {
      setExtracting(false)
    }
  }

  function applyAndClose() {
    if (!previewPalette) return
    onApply(previewPalette)
    // Reset interno para la próxima vez
    setUrls([])
    setPreviewPalette(null)
    onClose()
  }

  function close() {
    setUrls([])
    setPreviewPalette(null)
    setError(null)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={close}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-neutral-900">Inspirar paleta desde imágenes</h2>
          </div>
          <button
            onClick={close}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-50">
          <p className="text-sm text-neutral-600 mb-1">
            Subí hasta {MAX_INSPIRATIONS} imágenes de tu marca (publicaciones de Instagram, fotos del local, etc.).
          </p>
          <p className="text-xs text-neutral-400 mb-5">
            Analizamos los colores que más se repiten entre todas y los aplicamos a tu branding.
            <br />
            <strong className="text-neutral-500">Tip:</strong> elegí imágenes que representen tu identidad visual habitual, no fotos de viaje ni screenshots.
          </p>

          {/* Grid de slots de imagenes */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {urls.map((url, idx) => (
              // eslint-disable-next-line @next/next/no-img-element
              <div key={url + idx} className="relative aspect-square rounded-xl overflow-hidden border border-neutral-200 group">
                <img src={url} alt={`Inspiración ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => removeUrl(idx)}
                  className="absolute top-2 right-2 p-1.5 bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Quitar"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* Slot de upload (visible solo si no llegamos al max) */}
            {urls.length < MAX_INSPIRATIONS && (
              <div className="aspect-square">
                <ImageUploadSlot onUploaded={addUrl} hasItems={urls.length > 0} />
              </div>
            )}
          </div>

          {/* Boton generar */}
          {urls.length > 0 && (
            <button
              onClick={generate}
              disabled={extracting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-neutral-900 text-white text-sm font-medium rounded-xl hover:bg-neutral-700 disabled:opacity-50 mb-4"
            >
              {extracting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Analizando colores...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generar paleta combinada</>
              )}
            </button>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4">
              {error}
            </div>
          )}

          {/* Preview de la paleta generada */}
          {previewPalette && (
            <div className="p-5 bg-white rounded-xl border border-neutral-200 space-y-4">
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-widest">Paleta detectada</p>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { key: 'primaryColor', label: 'Color de marca (oscuro)' },
                  { key: 'secondaryColor', label: 'Color de fondo (claro)' },
                  { key: 'accentColor', label: 'Acento (vivo)' },
                ] as const).map(({ key, label }) => (
                  <div key={key} className="flex flex-col items-start gap-2">
                    <div
                      className="w-full h-20 rounded-lg border border-neutral-200"
                      style={{ backgroundColor: previewPalette[key] }}
                    />
                    <div>
                      <p className="text-xs font-medium text-neutral-700">{label}</p>
                      <p className="text-xs text-neutral-400 font-mono">{previewPalette[key]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 bg-white">
          <p className="text-xs text-neutral-400">{urls.length} / {MAX_INSPIRATIONS} imágenes</p>
          <div className="flex gap-2">
            <button
              onClick={close}
              className="px-4 py-2 text-sm text-neutral-500 hover:text-neutral-700"
            >
              Cancelar
            </button>
            <button
              onClick={applyAndClose}
              disabled={!previewPalette}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Aplicar al branding
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Slot individual de upload — wraps ImageUpload con remount via key cambiante
// para que cada subida exitosa "limpie" el slot y permita la siguiente.
function ImageUploadSlot({ onUploaded, hasItems }: { onUploaded: (url: string) => void; hasItems: boolean }) {
  const [resetKey, setResetKey] = useState(0)
  return (
    <ImageUpload
      key={resetKey}
      value={null}
      onChange={(url) => {
        if (!url) return
        onUploaded(url)
        setResetKey(k => k + 1) // remontamos el componente con value=null
      }}
      label={hasItems ? 'Sumar otra' : 'Subir imágenes'}
      aspectRatio="square"
      endpoint="businessLogo"
    />
  )
}
