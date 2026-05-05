'use client'

import { useRef, useState } from 'react'
import { Sparkles, Upload, Download, RefreshCw, Layers, Camera, Palette, Wand2, X } from 'lucide-react'

type Mode = 'upgrade' | 'explotar' | 'generar' | 'branded'

const MODES: {
  id: Mode
  icon: typeof Camera
  label: string
  desc: string
  needsPhoto: boolean
  needsIngredients: boolean
  color: 'orange' | 'blue' | 'purple' | 'green'
}[] = [
  { id: 'upgrade', icon: Camera, label: 'Mejorar foto', desc: 'Foto del celular → versión profesional', needsPhoto: true, needsIngredients: false, color: 'orange' },
  { id: 'explotar', icon: Layers, label: 'Explotar ingredientes', desc: 'Foto del plato → vista de capas etiquetadas', needsPhoto: true, needsIngredients: true, color: 'blue' },
  { id: 'generar', icon: Wand2, label: 'Generar desde cero', desc: 'Sin foto — desde nombre e ingredientes', needsPhoto: false, needsIngredients: true, color: 'purple' },
  { id: 'branded', icon: Palette, label: 'Branded ad', desc: 'Imagen con los colores y estilo de tu local', needsPhoto: false, needsIngredients: false, color: 'green' },
]

const COLOR_MAP = {
  orange: { bg: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-600', icon: 'text-orange-500' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-600', icon: 'text-blue-500' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-400', text: 'text-purple-600', icon: 'text-purple-500' },
  green: { bg: 'bg-green-50', border: 'border-green-400', text: 'text-green-600', icon: 'text-green-500' },
} as const

const MAX_FILE_SIZE_MB = 20

export default function ImagenesPage() {
  const [mode, setMode] = useState<Mode>('upgrade')
  const [itemName, setItemName] = useState('')
  const [ingredients, setIngredients] = useState('')
  const [photoBase64, setPhotoBase64] = useState<string | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [modelUsed, setModelUsed] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const currentMode = MODES.find(m => m.id === mode)!

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`La imagen pesa ${(file.size / 1024 / 1024).toFixed(1)}MB. Subi una mas chica (max ${MAX_FILE_SIZE_MB}MB).`)
      return
    }
    setError(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      setPhotoPreview(dataUrl)
      setPhotoBase64(dataUrl.split(',')[1])
    }
    reader.readAsDataURL(file)
  }

  function clearPhoto() {
    setPhotoBase64(null)
    setPhotoPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function generate() {
    if (!itemName.trim()) return
    if (currentMode.needsPhoto && !photoBase64) return
    if (currentMode.needsIngredients && !ingredients.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)
    setModelUsed(null)

    try {
      const res = await fetch('/api/ai/imagenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          itemName,
          ingredients: ingredients.trim() || undefined,
          imageBase64: photoBase64 ?? undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `Error HTTP ${res.status}`)
      setResult(data.url)
      setModelUsed(data.modelUsed ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar')
    } finally {
      setLoading(false)
    }
  }

  function download() {
    if (!result) return
    const a = document.createElement('a')
    a.href = result
    a.download = `nomi-${mode}-${itemName.replace(/\s+/g, '-')}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900">Imágenes con IA</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Convertí fotos del celular en campañas profesionales. Generá imágenes de platos desde cero.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Panel izquierdo */}
        <div className="space-y-6">
          {/* Selector de modo */}
          <div>
            <p className="text-sm font-medium text-neutral-700 mb-3">¿Qué querés hacer?</p>
            <div className="grid grid-cols-2 gap-2">
              {MODES.map(m => {
                const Icon = m.icon
                const colors = COLOR_MAP[m.color]
                const active = mode === m.id
                return (
                  <button
                    key={m.id}
                    onClick={() => { setMode(m.id); setResult(null); setError(null) }}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      active ? `${colors.bg} ${colors.border}` : 'border-neutral-200 bg-white hover:border-neutral-300'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-1.5 ${active ? colors.icon : 'text-neutral-400'}`} />
                    <p className={`text-xs font-semibold ${active ? colors.text : 'text-neutral-700'}`}>{m.label}</p>
                    <p className="text-xs text-neutral-400 mt-0.5 leading-tight">{m.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Nombre del plato */}
          <div>
            <label className="text-sm font-medium text-neutral-700 mb-1.5 block">
              Nombre del plato *
            </label>
            <input
              type="text"
              value={itemName}
              onChange={e => setItemName(e.target.value)}
              placeholder="Ej: Milanesa napolitana, Pizza margherita..."
              className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {/* Upload de foto (todos menos "generar desde cero") */}
          {(currentMode.needsPhoto || mode === 'branded') && (
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-1.5 block">
                Foto del plato {currentMode.needsPhoto ? '*' : '(opcional)'}
              </label>
              {photoPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-neutral-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoPreview} alt="Preview" className="w-full h-48 object-cover" />
                  <button
                    onClick={clearPhoto}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-36 rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors">
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                  <Upload className="w-6 h-6 text-neutral-400 mb-2" />
                  <p className="text-sm text-neutral-500">Subí la foto del celular</p>
                  <p className="text-xs text-neutral-400 mt-1">PNG, JPG hasta {MAX_FILE_SIZE_MB}MB</p>
                </label>
              )}
            </div>
          )}

          {/* Ingredientes (requerido en explotar/generar; OPCIONAL en upgrade para evitar alucinaciones) */}
          {(currentMode.needsIngredients || mode === 'upgrade') && (
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-1.5 block">
                Ingredientes {currentMode.needsIngredients ? '*' : <span className="text-neutral-400 font-normal">(opcional, recomendado)</span>}
                {mode === 'explotar' && <span className="text-neutral-400 font-normal"> · uno por línea, top → bottom</span>}
              </label>
              <textarea
                value={ingredients}
                onChange={e => setIngredients(e.target.value)}
                placeholder={
                  mode === 'explotar'
                    ? 'Pan brioche\nQueso cheddar\nMedallon de carne\nLechuga\nTomate\nCebolla'
                    : mode === 'upgrade'
                    ? 'Ej: bondiola, queso provoleta, jamón cocido, pan de papa'
                    : 'Milanesa de ternera, salsa napolitana, jamón cocido, queso mozzarella, aceitunas verdes'
                }
                className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                rows={mode === 'explotar' ? 5 : mode === 'upgrade' ? 2 : 3}
              />
              {mode === 'explotar' && (
                <p className="text-xs text-neutral-400 mt-1.5">
                  Tip: la IA usa la foto del plato como referencia y separa cada ingrediente en su propia capa.
                </p>
              )}
              {mode === 'upgrade' && (
                <p className="text-xs text-neutral-400 mt-1.5">
                  Si dejás esto vacío, la IA detecta los ingredientes de la foto. Cargarlos vos ayuda a que el resultado no invente nada.
                </p>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Botón generar */}
          <button
            onClick={generate}
            disabled={
              loading ||
              !itemName.trim() ||
              (currentMode.needsPhoto && !photoBase64) ||
              (currentMode.needsIngredients && !ingredients.trim())
            }
            className="w-full flex items-center justify-center gap-2 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Generando con IA... (30-60 seg)</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Generar imagen</>
            )}
          </button>

          <p className="text-xs text-neutral-400 text-center">
            Cada generación cuesta créditos de OpenAI (~$0.04 USD por imagen en alta calidad).
          </p>
        </div>

        {/* Panel derecho */}
        <div>
          <p className="text-sm font-medium text-neutral-700 mb-3">Resultado</p>

          {loading && (
            <div className="aspect-square rounded-2xl bg-neutral-100 border border-neutral-200 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-neutral-200 border-t-orange-500 animate-spin" />
              <div className="text-center">
                <p className="text-sm font-medium text-neutral-600">Generando imagen...</p>
                <p className="text-xs text-neutral-400 mt-1">Puede tardar hasta 60 segundos</p>
              </div>
            </div>
          )}

          {!loading && result && (
            <div className="space-y-3">
              <div className="aspect-square rounded-2xl overflow-hidden border border-neutral-200 shadow-sm relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={result} alt="Imagen generada" className="w-full h-full object-cover" />
              </div>
              {modelUsed && (
                <p className="text-xs text-neutral-400 text-center">
                  Modelo: <span className="font-mono text-neutral-500">{modelUsed}</span>
                  {modelUsed.includes('fallback') && (
                    <span className="block mt-1 text-amber-600">
                      Tu cuenta de OpenAI no tiene acceso a gpt-image-1. El fallback es menos fiel a la foto original.
                    </span>
                  )}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={download}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-xl hover:bg-neutral-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Descargar
                </button>
                <button
                  onClick={generate}
                  className="flex items-center gap-2 px-4 py-2.5 border border-neutral-200 text-neutral-600 text-sm font-medium rounded-xl hover:bg-neutral-50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerar
                </button>
              </div>
            </div>
          )}

          {!loading && !result && (
            <div className="aspect-square rounded-2xl bg-neutral-50 border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center text-center px-8">
              <Sparkles className="w-10 h-10 text-neutral-300 mb-3" />
              <p className="text-sm font-medium text-neutral-400">Tu imagen aparece acá</p>
              <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                {mode === 'upgrade' && 'Subí la foto del plato y generamos una versión retocada fotorrealista, conservando el plato exacto'}
                {mode === 'explotar' && 'Subí la foto del plato y los ingredientes — armamos la vista exploded con cada capa etiquetada'}
                {mode === 'generar' && 'Describí el plato y los ingredientes y generamos la foto desde cero'}
                {mode === 'branded' && 'Generamos una imagen con los colores y estilo de tu local'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
