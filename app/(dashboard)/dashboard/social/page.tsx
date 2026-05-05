'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Copy, Check, RefreshCw, Camera, MessageCircle, Megaphone, FileText } from 'lucide-react'

type Item = { id: string; name: string; price: any }
type ContentType = 'instagram_post' | 'instagram_story' | 'whatsapp_status' | 'promo'
type Tone = 'formal' | 'casual' | 'entusiasta' | 'minimalista'

const CONTENT_TYPES = [
  { id: 'instagram_post', label: 'Post Instagram', icon: Camera, desc: 'Caption + hashtags' },
  { id: 'instagram_story', label: 'Story', icon: FileText, desc: 'Texto para story' },
  { id: 'whatsapp_status', label: 'WhatsApp', icon: MessageCircle, desc: 'Estado de negocio' },
  { id: 'promo', label: 'Promoción', icon: Megaphone, desc: 'Oferta especial' },
] as const

const TONES = [
  { id: 'casual', label: 'Casual' },
  { id: 'entusiasta', label: 'Entusiasta' },
  { id: 'formal', label: 'Formal' },
  { id: 'minimalista', label: 'Minimalista' },
] as const

export default function SocialPage() {
  const [items, setItems] = useState<Item[]>([])
  const [type, setType] = useState<ContentType>('instagram_post')
  const [tone, setTone] = useState<Tone>('casual')
  const [selectedItem, setSelectedItem] = useState<string>('')
  const [customText, setCustomText] = useState('')
  const [loading, setLoading] = useState(false)
  const [variations, setVariations] = useState<string[]>([])
  const [activeVar, setActiveVar] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/menu').then(r => r.json()).then(menu => {
      if (menu?.categories) {
        const allItems = menu.categories.flatMap((c: any) => c.items ?? [])
        setItems(allItems)
      }
    })
  }, [])

  async function generate() {
    setLoading(true)
    setVariations([])
    try {
      const res = await fetch('/api/ai/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          tone,
          itemId: selectedItem || undefined,
          customText: customText || undefined,
        }),
      })
      const data = await res.json()
      if (data.variations) {
        setVariations(data.variations)
        setActiveVar(0)
      }
    } finally {
      setLoading(false)
    }
  }

  function copy() {
    navigator.clipboard.writeText(variations[activeVar] ?? '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900">Contenido para redes</h1>
        <p className="text-sm text-neutral-500 mt-1">Generá posts, stories y estados con IA, con el tono de tu local.</p>
      </div>

      <div className="space-y-6">
        {/* Tipo de contenido */}
        <div>
          <p className="text-sm font-medium text-neutral-700 mb-3">¿Qué querés generar?</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CONTENT_TYPES.map(({ id, label, icon: Icon, desc }) => (
              <button
                key={id}
                onClick={() => setType(id)}
                className={`p-3 rounded-xl border text-left transition-colors ${type === id ? 'border-orange-500 bg-orange-50' : 'border-neutral-200 bg-white hover:border-neutral-300'}`}
              >
                <Icon className={`w-4 h-4 mb-2 ${type === id ? 'text-orange-500' : 'text-neutral-400'}`} />
                <p className={`text-xs font-medium ${type === id ? 'text-orange-700' : 'text-neutral-700'}`}>{label}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Tono */}
        <div>
          <p className="text-sm font-medium text-neutral-700 mb-3">Tono</p>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            {TONES.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTone(id)}
                className={`px-4 py-2 rounded-lg text-sm border transition-colors whitespace-nowrap shrink-0 ${tone === id ? 'bg-neutral-900 text-white border-neutral-900' : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Plato específico (opcional) */}
        <div>
          <p className="text-sm font-medium text-neutral-700 mb-3">Plato destacar <span className="text-neutral-400 font-normal">(opcional)</span></p>
          <select
            value={selectedItem}
            onChange={e => setSelectedItem(e.target.value)}
            className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
          >
            <option value="">Sin plato específico — general del local</option>
            {items.map(item => (
              <option key={item.id} value={item.id}>
                {item.name} — ${Number(item.price).toLocaleString('es-AR')}
              </option>
            ))}
          </select>
        </div>

        {/* Contexto adicional */}
        <div>
          <p className="text-sm font-medium text-neutral-700 mb-3">Contexto adicional <span className="text-neutral-400 font-normal">(opcional)</span></p>
          <textarea
            value={customText}
            onChange={e => setCustomText(e.target.value)}
            placeholder="Ej: Es fin de semana, estamos con 10% de descuento en pizzas, o Queremos comunicar que abrimos los lunes..."
            className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            rows={3}
          />
        </div>

        {/* Botón generar */}
        <button
          onClick={generate}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 disabled:opacity-60 transition-colors"
        >
          {loading ? (
            <><RefreshCw className="w-4 h-4 animate-spin" /> Generando con IA...</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Generar contenido</>
          )}
        </button>

        {/* Resultados */}
        {variations.length > 0 && (
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            {/* Tabs de variaciones */}
            <div className="flex border-b border-neutral-100">
              {variations.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveVar(i)}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${activeVar === i ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50' : 'text-neutral-400 hover:text-neutral-600'}`}
                >
                  Opción {i + 1}
                </button>
              ))}
            </div>

            {/* Contenido */}
            <div className="p-5">
              <p className="text-sm text-neutral-800 leading-relaxed whitespace-pre-wrap">{variations[activeVar]}</p>
            </div>

            {/* Acciones */}
            <div className="flex gap-2 px-5 pb-5">
              <button
                onClick={copy}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-700 transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
              <button
                onClick={generate}
                className="flex items-center gap-2 px-4 py-2 border border-neutral-200 text-neutral-600 text-sm font-medium rounded-lg hover:bg-neutral-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Regenerar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
