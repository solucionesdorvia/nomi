'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Check, Loader2, AlertCircle } from 'lucide-react'
import ImageUpload from '@/components/dashboard/ImageUpload'

const FONTS = ['Inter', 'Playfair Display', 'Lato', 'Montserrat', 'Merriweather', 'Nunito', 'Raleway', 'Poppins']
const STYLES = [
  { id: 'modern', label: 'Moderno', desc: 'Limpio y contemporáneo' },
  { id: 'elegant', label: 'Elegante', desc: 'Sofisticado y refinado' },
  { id: 'casual', label: 'Casual', desc: 'Amigable y cercano' },
  { id: 'minimal', label: 'Minimal', desc: 'Simple y directo' },
]

const DEFAULT_FORM = {
  name: '',
  slug: '',
  logoUrl: '' as string,
  primaryColor: '#1a1a1a',
  accentColor: '#FF6B35',
  secondaryColor: '#ffffff',
  fontHeading: 'Playfair Display',
  fontBody: 'Inter',
  style: 'modern',
}

type Status = 'idle' | 'saving' | 'saved' | 'error'

export default function BrandingPage() {
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [form, setForm] = useState(DEFAULT_FORM)

  // Precarga los datos existentes desde la DB. Sin esto, el form arrancaba
  // con defaults y al guardar pisaba lo que el user ya tenia configurado.
  useEffect(() => {
    let cancelled = false
    fetch('/api/business')
      .then(r => r.json())
      .then(data => {
        if (cancelled || !data?.id) return
        setForm({
          name: data.name ?? '',
          slug: data.slug ?? '',
          logoUrl: data.branding?.logoUrl ?? '',
          primaryColor: data.branding?.primaryColor ?? DEFAULT_FORM.primaryColor,
          accentColor: data.branding?.accentColor ?? DEFAULT_FORM.accentColor,
          secondaryColor: data.branding?.secondaryColor ?? DEFAULT_FORM.secondaryColor,
          fontHeading: data.branding?.fontHeading ?? DEFAULT_FORM.fontHeading,
          fontBody: data.branding?.fontBody ?? DEFAULT_FORM.fontBody,
          style: data.branding?.style ?? DEFAULT_FORM.style,
        })
      })
      .catch(err => console.error('[branding] error precargando datos:', err))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  function set(key: string, val: string) {
    setStatus('idle')
    setForm(f => ({ ...f, [key]: val }))
    // Actualizamos slug solo cuando se edita el nombre y el business es nuevo
    // (slug vacio). Para businesses existentes NO regeneramos el slug porque
    // las URLs publicas /m/[slug] ya pueden estar circulando.
    if (key === 'name' && !form.slug) {
      setForm(f => ({
        ...f,
        name: val,
        slug: val.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      }))
    }
  }

  async function save() {
    setStatus('saving')
    setErrorMsg(null)
    try {
      // Si el logoUrl es string vacio, lo mandamos como null (el schema espera URL valida o null).
      const payload = { ...form, logoUrl: form.logoUrl?.trim() ? form.logoUrl : null }
      const res = await fetch('/api/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `Error HTTP ${res.status}`)
      }
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2500)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-neutral-400">
        <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
        Cargando branding...
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900">Branding de tu local</h1>
        <p className="text-neutral-500 mt-1">Tu menú va a verse exactamente como tu local.</p>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Formulario */}
        <div className="space-y-6">
          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Logo</label>
            <p className="text-xs text-neutral-400 mb-3">
              Aparece en el menú público y en el póster generado. PNG con fondo transparente queda mejor.
            </p>
            <div className="max-w-[180px]">
              <ImageUpload
                value={form.logoUrl || null}
                onChange={(url) => set('logoUrl', url)}
                label="Subir logo"
                aspectRatio="square"
                endpoint="businessLogo"
              />
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Nombre del local *</label>
            <input
              type="text"
              placeholder="Ej: La Trattoria"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            {form.slug && (
              <p className="text-xs text-neutral-400 mt-1.5">URL: /m/{form.slug}</p>
            )}
          </div>

          {/* Colores */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3">Colores</label>
            <div className="space-y-3">
              {[
                { key: 'primaryColor', label: 'Color principal' },
                { key: 'accentColor', label: 'Color de acento' },
                { key: 'secondaryColor', label: 'Color de fondo' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form[key as keyof typeof form]}
                    onChange={e => set(key, e.target.value)}
                    className="w-10 h-10 rounded-lg border border-neutral-300 cursor-pointer p-0.5"
                  />
                  <div>
                    <p className="text-sm text-neutral-700">{label}</p>
                    <p className="text-xs text-neutral-400">{form[key as keyof typeof form]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tipografía */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3">Tipografía</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-neutral-500 mb-1.5">Títulos</p>
                <select
                  value={form.fontHeading}
                  onChange={e => set('fontHeading', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <p className="text-xs text-neutral-500 mb-1.5">Cuerpo</p>
                <select
                  value={form.fontBody}
                  onChange={e => set('fontBody', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Estilo */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3">Estilo visual</label>
            <div className="grid grid-cols-2 gap-2">
              {STYLES.map(s => (
                <button
                  key={s.id}
                  onClick={() => set('style', s.id)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    form.style === s.id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <p className={`text-sm font-medium ${form.style === s.id ? 'text-orange-700' : 'text-neutral-700'}`}>{s.label}</p>
                  <p className="text-xs text-neutral-400">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={save}
              disabled={!form.name || status === 'saving'}
              className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                status === 'saved'
                  ? 'bg-green-500 text-white'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
            >
              {status === 'saving' && <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>}
              {status === 'saved' && <><Check className="w-4 h-4" /> Guardado</>}
              {(status === 'idle' || status === 'error') && 'Guardar branding'}
            </button>
            {status === 'error' && errorMsg && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        </div>

        {/* Preview del menú */}
        <div className="sticky top-8">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">Preview</p>
          <div
            className="rounded-2xl overflow-hidden border border-neutral-200 shadow-sm"
            style={{ backgroundColor: form.secondaryColor }}
          >
            {/* Header del menú */}
            <div
              className="p-6 text-center"
              style={{ backgroundColor: form.primaryColor }}
            >
              {form.logoUrl ? (
                <div
                  className="w-16 h-16 mx-auto mb-3 overflow-hidden"
                  style={{
                    borderRadius: form.style === 'elegant' || form.style === 'minimal' ? 0 : 9999,
                    border: `2px solid ${form.secondaryColor}33`,
                    backgroundColor: form.secondaryColor + '0d',
                  }}
                >
                  <Image
                    src={form.logoUrl}
                    alt={form.name || 'Logo'}
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                  />
                </div>
              ) : (
                <div
                  className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold"
                  style={{
                    backgroundColor: form.accentColor,
                    color: form.secondaryColor,
                    fontFamily: form.fontHeading,
                  }}
                >
                  {form.name?.slice(0, 1).toUpperCase() || 'N'}
                </div>
              )}
              <h2
                className="text-xl font-bold"
                style={{
                  color: form.secondaryColor,
                  fontFamily: form.fontHeading,
                }}
              >
                {form.name || 'Tu restaurante'}
              </h2>
            </div>

            {/* Categoría de ejemplo */}
            <div className="p-4">
              <div
                className="text-xs font-bold uppercase tracking-widest mb-3"
                style={{ color: form.accentColor, fontFamily: form.fontBody }}
              >
                Entradas
              </div>

              {/* Item de ejemplo */}
              {[
                { name: 'Empanadas de carne', price: '$2.800', desc: 'Relleno casero con cebolla y aceitunas' },
                { name: 'Tabla de quesos', price: '$5.500', desc: 'Selección de quesos con dulce de membrillo' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex gap-3 py-3 border-b last:border-0"
                  style={{
                    borderColor: form.primaryColor + '20',
                  }}
                >
                  <div
                    className="w-14 h-14 rounded-lg shrink-0 flex items-center justify-center text-xl"
                    style={{ backgroundColor: form.accentColor + '20' }}
                  >
                    🥟
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold"
                      style={{ color: form.primaryColor, fontFamily: form.fontHeading }}
                    >
                      {item.name}
                    </p>
                    <p
                      className="text-xs mt-0.5 line-clamp-1"
                      style={{ color: form.primaryColor + '80', fontFamily: form.fontBody }}
                    >
                      {item.desc}
                    </p>
                    <p
                      className="text-sm font-bold mt-1"
                      style={{ color: form.accentColor, fontFamily: form.fontBody }}
                    >
                      {item.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
