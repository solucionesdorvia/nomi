'use client'

import { useMemo, useRef, useState } from 'react'
import {
  Sparkles,
  Upload,
  Download,
  RefreshCw,
  Layers,
  Camera,
  Palette,
  Wand2,
  X,
  Zap,
  ArrowRight,
  Cpu,
} from 'lucide-react'

type Mode = 'nitido' | 'upgrade' | 'explotar' | 'generar' | 'branded'

type ModeDef = {
  id: Mode
  icon: typeof Camera
  label: string
  tag: string
  desc: string
  needsPhoto: boolean
  needsIngredients: boolean
  color: 'amber' | 'orange' | 'blue' | 'purple' | 'green'
  /** 0 = fidelidad, 1 = efectos, 2 = sin foto ref */
  section: 0 | 1 | 2
  estTime: string
}

const SECTIONS: { title: string; subtitle: string }[] = [
  {
    title: 'Fidelidad máxima',
    subtitle: 'La comida se ve como en tu cocina; solo ayudamos la cámara.',
  },
  {
    title: 'Efectos creativos',
    subtitle: 'Diagramas y vistas que venden el plato.',
  },
  {
    title: 'Sin foto de referencia',
    subtitle: 'Generá imagen desde texto y el estilo de tu local.',
  },
]

const MODES: ModeDef[] = [
  {
    id: 'nitido',
    icon: Zap,
    label: 'Solo nitidez',
    tag: 'Cero IA generativa',
    desc: 'Real-ESRGAN ×2: más nítida y limpia. Misma composición, mismos colores — nada inventado.',
    needsPhoto: true,
    needsIngredients: false,
    color: 'amber',
    section: 0,
    estTime: '~5–25 s',
  },
  {
    id: 'upgrade',
    icon: Camera,
    label: 'Estudio + marca',
    tag: 'IA de alta fidelidad',
    desc: 'Primero nitidez opcional, después retoque suave y fondo alineado a tu branding.',
    needsPhoto: true,
    needsIngredients: false,
    color: 'orange',
    section: 0,
    estTime: '~30–90 s',
  },
  {
    id: 'explotar',
    icon: Layers,
    label: 'Explotar ingredientes',
    tag: 'Desde tu foto',
    desc: 'Vista en capas con etiquetas, partiendo de la textura real del plato.',
    needsPhoto: true,
    needsIngredients: true,
    color: 'blue',
    section: 1,
    estTime: '~30–90 s',
  },
  {
    id: 'generar',
    icon: Wand2,
    label: 'Generar plato',
    tag: 'Texto → imagen',
    desc: 'Nombre e ingredientes; estilo fotorreal con Flux u OpenAI.',
    needsPhoto: false,
    needsIngredients: true,
    color: 'purple',
    section: 2,
    estTime: '~20–60 s',
  },
  {
    id: 'branded',
    icon: Palette,
    label: 'Pieza de marca',
    tag: 'Instagram-ready',
    desc: 'Hero shot con ambiente acorde a los colores y estilo de tu local. Foto opcional.',
    needsPhoto: false,
    needsIngredients: false,
    color: 'green',
    section: 2,
    estTime: '~20–60 s',
  },
]

const COLOR_MAP = {
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-400',
    text: 'text-amber-800',
    icon: 'text-amber-600',
    ring: 'ring-amber-400/30',
    dot: 'bg-amber-500',
  },
  orange: {
    bg: 'bg-orange-50',
    border: 'border-orange-400',
    text: 'text-orange-700',
    icon: 'text-orange-600',
    ring: 'ring-orange-400/30',
    dot: 'bg-orange-500',
  },
  blue: {
    bg: 'bg-sky-50',
    border: 'border-sky-400',
    text: 'text-sky-800',
    icon: 'text-sky-600',
    ring: 'ring-sky-400/30',
    dot: 'bg-sky-500',
  },
  purple: {
    bg: 'bg-violet-50',
    border: 'border-violet-400',
    text: 'text-violet-800',
    icon: 'text-violet-600',
    ring: 'ring-violet-400/30',
    dot: 'bg-violet-500',
  },
  green: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-400',
    text: 'text-emerald-800',
    icon: 'text-emerald-600',
    ring: 'ring-emerald-400/30',
    dot: 'bg-emerald-500',
  },
} as const

const MAX_FILE_SIZE_MB = 20

export default function ImagenesPage() {
  const [mode, setMode] = useState<Mode>('nitido')
  const [itemName, setItemName] = useState('')
  const [ingredients, setIngredients] = useState('')
  const [photoBase64, setPhotoBase64] = useState<string | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [modelUsed, setModelUsed] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const currentMode = useMemo(() => MODES.find(m => m.id === mode)!, [mode])

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(
        `La imagen pesa ${(file.size / 1024 / 1024).toFixed(1)} MB. Probá una más liviana (máx. ${MAX_FILE_SIZE_MB} MB).`,
      )
      return
    }
    setError(null)
    const reader = new FileReader()
    reader.onload = ev => {
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
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const showPhotoUi = currentMode.needsPhoto || mode === 'branded'
  const showIngredientsOptional = mode === 'upgrade'
  const showIngredientsRequired = mode === 'explotar' || mode === 'generar'
  const showBeforeAfter =
    !!(result && photoPreview && (mode === 'nitido' || mode === 'upgrade'))

  const canGenerate =
    !loading &&
    itemName.trim().length > 0 &&
    (!currentMode.needsPhoto || !!photoBase64) &&
    (!currentMode.needsIngredients || ingredients.trim().length > 0)

  return (
    <div className="min-h-full bg-[linear-gradient(165deg,#fafaf9_0%,#fff_45%,rgba(255,107,53,0.04)_100%)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-12">
        {/* Hero */}
        <header className="mb-8 sm:mb-10 relative">
          <div className="flex flex-wrap items-start gap-4 justify-between">
            <div className="flex gap-4">
              <div
                className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-500/25"
                aria-hidden
              >
                <Sparkles className="w-7 h-7" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600/90 mb-1.5">
                  Studio visual
                </p>
                <h1 className="font-display text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
                  Imágenes con IA
                </h1>
                <p className="text-sm sm:text-[15px] text-neutral-500 mt-1.5 max-w-xl leading-relaxed">
                  Elegí el flujo según cuánto querés tocar tu foto original. Todo está pensado para que el menú no
                  se vea “plástico”.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] font-medium">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-neutral-600 border border-neutral-200 shadow-sm">
                <Cpu className="w-3.5 h-3.5 text-orange-500" />
                OpenAI · Replicate
              </span>
            </div>
          </div>

          {/* Mini pipeline */}
          <div className="mt-6 flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-neutral-500">
            <span className="rounded-lg bg-neutral-900 text-white px-2.5 py-1 font-medium">1 · Elegís modo</span>
            <ArrowRight className="w-3.5 h-3.5 text-neutral-400 hidden sm:inline shrink-0" />
            <span className="rounded-lg bg-neutral-100 border border-neutral-200 px-2.5 py-1 font-medium">
              2 · Nombre del plato
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-neutral-400 hidden sm:inline shrink-0" />
            <span className="rounded-lg bg-neutral-100 border border-neutral-200 px-2.5 py-1 font-medium">
              3 · Foto / ingredientes
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-neutral-400 hidden sm:inline shrink-0" />
            <span className="rounded-lg bg-orange-100 text-orange-800 border border-orange-200 px-2.5 py-1 font-semibold">
              4 · Generar
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] gap-8 xl:gap-10 items-start">
          {/* Columna formulario */}
          <div className="space-y-8">
            {SECTIONS.map((sec, idx) => {
              const modesInSection = MODES.filter(m => m.section === idx)
              return (
                <section
                  key={sec.title}
                  className="rounded-2xl border border-neutral-200/80 bg-white/80 backdrop-blur-sm p-5 sm:p-6 shadow-sm shadow-neutral-900/[0.03]"
                >
                  <div className="flex items-baseline gap-2 flex-wrap mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600/90">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <h2 className="font-display text-lg sm:text-xl font-semibold text-neutral-900">{sec.title}</h2>
                  </div>
                  <p className="text-sm text-neutral-500 mb-5 max-w-prose">{sec.subtitle}</p>

                  <div
                    className={
                      modesInSection.length === 1
                        ? 'grid grid-cols-1'
                        : 'grid grid-cols-1 sm:grid-cols-2 gap-3'
                    }
                  >
                    {modesInSection.map(m => {
                      const Icon = m.icon
                      const colors = COLOR_MAP[m.color]
                      const active = mode === m.id
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setMode(m.id)
                            setResult(null)
                            setError(null)
                          }}
                          className={`text-left rounded-2xl border-2 transition-all duration-200 p-4 outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 ${
                            active
                              ? `${colors.bg} ${colors.border} ring-4 ${colors.ring} shadow-md`
                              : 'border-neutral-100 bg-neutral-50/60 hover:bg-white hover:border-neutral-200 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                active ? 'bg-white/80 shadow-sm' : 'bg-white border border-neutral-100'
                              }`}
                            >
                              <Icon className={`w-[18px] h-[18px] ${active ? colors.icon : 'text-neutral-400'}`} />
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`text-[13px] sm:text-sm font-semibold leading-tight ${
                                    active ? colors.text : 'text-neutral-800'
                                  }`}
                                >
                                  {m.label}
                                </span>
                                <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
                                  {m.estTime}
                                </span>
                              </div>
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-700/85 mt-0.5 mb-1">
                                {m.tag}
                              </p>
                              <p className="text-[12px] sm:text-[13px] text-neutral-500 leading-snug">{m.desc}</p>
                              {active && <span className={`inline-block mt-2 h-1 w-10 rounded-full ${colors.dot}`} />}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </section>
              )
            })}

            {/* Datos */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-sm space-y-5">
              <h3 className="font-display text-base font-semibold text-neutral-900">Datos del plato</h3>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2 block">
                  Nombre · obligatorio
                </label>
                <input
                  type="text"
                  value={itemName}
                  onChange={e => setItemName(e.target.value)}
                  placeholder="Ej. Milanesa con fettuccini a la salsa rosa"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50/50 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-shadow"
                />
              </div>

              {showPhotoUi && (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2 block">
                    Foto · {currentMode.needsPhoto ? 'obligatoria' : 'opcional (mejora branded)'}
                  </label>
                  {photoPreview ? (
                    <div className="relative rounded-2xl overflow-hidden border border-neutral-200 shadow-inner">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photoPreview} alt="Vista previa" className="w-full h-52 sm:h-56 object-cover" />
                      <button
                        type="button"
                        onClick={clearPhoto}
                        className="absolute top-3 right-3 p-2 rounded-full bg-black/55 text-white hover:bg-black/75 transition-colors"
                        aria-label="Quitar foto"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center min-h-[200px] rounded-2xl border-2 border-dashed border-neutral-200 bg-gradient-to-b from-neutral-50/80 to-white cursor-pointer hover:border-orange-300 hover:bg-orange-50/20 transition-all group">
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-neutral-100 shadow-sm mb-3 group-hover:scale-105 transition-transform">
                        <Upload className="w-6 h-6 text-orange-500" />
                      </div>
                      <p className="text-sm font-medium text-neutral-700">Arrastrá o tocá para subir</p>
                      <p className="text-xs text-neutral-400 mt-1">JPG · PNG · WebP · hasta {MAX_FILE_SIZE_MB} MB</p>
                    </label>
                  )}
                </div>
              )}

              {(showIngredientsRequired || showIngredientsOptional) && (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2 block">
                    Ingredientes
                    {showIngredientsRequired && (
                      <span className="text-orange-700 normal-case ml-1">
                        · {mode === 'explotar' ? ' orden vertical · obligatorio' : ' obligatorio'}
                      </span>
                    )}
                    {showIngredientsOptional && (
                      <span className="text-neutral-400 font-normal normal-case ml-1">· opcional, recomendado</span>
                    )}
                  </label>
                  <textarea
                    value={ingredients}
                    onChange={e => setIngredients(e.target.value)}
                    placeholder={
                      mode === 'explotar'
                        ? 'Pan brioche\nCheddar\nMedallón\nLechuga\nTomate'
                        : mode === 'upgrade'
                          ? 'Ayuda a que la IA no invente ingredientes ocultos'
                          : 'Listá todo lo visible en el plato final'
                    }
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none min-h-[100px]"
                    rows={mode === 'explotar' ? 5 : 3}
                  />
                  {mode === 'explotar' && (
                    <p className="text-[11px] text-neutral-400 mt-2 leading-relaxed">
                      Un ítem por línea, de arriba hacia abajo en el stack. Es el número exacto de capas en la imagen.
                    </p>
                  )}
                  {mode === 'upgrade' && (
                    <p className="text-[11px] text-neutral-400 mt-2 leading-relaxed">
                      Vacío está bien: miramos la foto con visión artificial. Si listás ingredientes, bajamos al mínimo
                      las alucinaciones.
                    </p>
                  )}
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-800 leading-relaxed">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={generate}
                disabled={!canGenerate}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-neutral-900 text-white text-[15px] font-semibold shadow-lg shadow-neutral-900/15 hover:bg-neutral-800 disabled:opacity-45 disabled:pointer-events-none transition-all"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-[18px] h-[18px] animate-spin" />
                    Procesando…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-[18px] h-[18px] text-orange-300" />
                    {mode === 'nitido' ? 'Aplicar nitidez' : 'Generar imagen'}
                  </>
                )}
              </button>

              <p className="text-[11px] text-neutral-400 text-center leading-relaxed px-2">
                {mode === 'nitido' ? (
                  <>Solo se usa Real-ESRGAN (Replicate): sin OpenAI ni repintado. Ideal si querés máxima verosimilitud.</>
                ) : (
                  <>
                    Los modos con IA pueden consumir créditos OpenAI · las marcas más pesadas pueden tardar más.
                    Tip: si algo se ve muy “dibujito”, probá Solo nitidez o Estudio + marca.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Resultado */}
          <aside className="xl:sticky xl:top-24 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-base font-semibold text-neutral-900">Resultado</h3>
              {currentMode && (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                  ETA {currentMode.estTime}
                </span>
              )}
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white shadow-lg shadow-neutral-900/[0.06] overflow-hidden">
              {loading && (
                <div className="aspect-square flex flex-col items-center justify-center gap-5 p-10 bg-neutral-50">
                  <div className="relative w-14 h-14">
                    <div className="absolute inset-0 rounded-full border-4 border-neutral-200" />
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-orange-500 animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-neutral-700">
                      {mode === 'nitido' ? 'Mejorando píxeles…' : 'La IA está cocinando píxeles…'}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1 max-w-[220px] mx-auto leading-relaxed">
                      {mode === 'nitido' ? 'Upscale rápido, sin fantasía ni inventos.' : 'Buena luz tarda más que un filtro instantáneo.'}
                    </p>
                  </div>
                </div>
              )}

              {!loading && result && (
                <div className="p-4 sm:p-5 space-y-4">
                  {showBeforeAfter ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-1">Antes</p>
                        <div className="aspect-square rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photoPreview!} alt="" className="w-full h-full object-cover" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-orange-600 px-1">Después</p>
                        <div className="aspect-square rounded-xl overflow-hidden border-2 border-orange-200 shadow-md bg-neutral-950/5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={result} alt="Resultado" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-square rounded-xl overflow-hidden border border-neutral-100 bg-neutral-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={result} alt="Resultado" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {modelUsed && (
                    <div className="rounded-xl bg-neutral-50 border border-neutral-100 px-3 py-2.5">
                      <p className="text-[10px] font-semibold uppercase text-neutral-400 mb-1">Pipeline</p>
                      <p className="text-[11px] font-mono text-neutral-600 break-all leading-snug">{modelUsed}</p>
                      {modelUsed.includes('fallback') || modelUsed.includes('dall-e-2') ? (
                        <p className="text-[11px] text-amber-800 mt-2 leading-relaxed">
                          Fallback activo: el resultado puede diferir más de tu foto original. Conviene tener acceso a
                          GPT Image en OpenAI cuando trabajás con fotos propias.
                        </p>
                      ) : null}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={download}
                      className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Descargar PNG
                    </button>
                    <button
                      type="button"
                      onClick={generate}
                      disabled={loading}
                      className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-neutral-200 text-neutral-600 text-sm font-medium hover:bg-neutral-50 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Otra vez
                    </button>
                  </div>
                </div>
              )}

              {!loading && !result && (
                <div className="aspect-square flex flex-col items-center justify-center p-10 text-center bg-[radial-gradient(ellipse_at_center,_rgba(255,107,53,0.06)_0%,_transparent_65%)]">
                  <div className="w-16 h-16 rounded-3xl bg-white border border-neutral-100 shadow-sm flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-orange-400/70" strokeWidth={1.25} />
                  </div>
                  <p className="font-display text-neutral-700 font-semibold text-[15px]">Listo cuando vos lo estés</p>
                  <p className="text-xs text-neutral-400 mt-2 max-w-[240px] leading-relaxed">
                    {mode === 'nitido' && 'Subí tu foto y pulsá aplicar nitidez. Sin texturas inventadas ni repintados.'}
                    {mode === 'upgrade' &&
                      'Vas a ver comparación lado a lado con la versión mejorada y el pipeline usado.'}
                    {mode === 'explotar' && 'Un diagrama con capas etiquetadas, generado desde la misma foto del plato.'}
                    {mode === 'generar' && 'Foto fotorreal del plato a partir del nombre y la lista.'}
                    {mode === 'branded' && 'Pieza con tus colores y estilo para redes o impresiones.'}
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
