'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const FONTS = ['Inter', 'Playfair Display', 'Lato', 'Montserrat', 'Merriweather', 'Nunito', 'Raleway', 'Poppins']
const STYLES = [
  { id: 'modern', label: 'Moderno', desc: 'Limpio y contemporáneo' },
  { id: 'elegant', label: 'Elegante', desc: 'Sofisticado y refinado' },
  { id: 'casual', label: 'Casual', desc: 'Amigable y cercano' },
  { id: 'minimal', label: 'Minimal', desc: 'Simple y directo' },
]

export default function BrandingPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    slug: '',
    primaryColor: '#1a1a1a',
    accentColor: '#FF6B35',
    secondaryColor: '#ffffff',
    fontHeading: 'Playfair Display',
    fontBody: 'Inter',
    style: 'modern',
  })

  function set(key: string, val: string) {
    setForm(f => ({ ...f, [key]: val }))
    if (key === 'name') {
      setForm(f => ({
        ...f,
        name: val,
        slug: val.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      }))
    }
  }

  async function save() {
    setSaving(true)
    try {
      await fetch('/api/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      router.push('/dashboard/menu')
    } finally {
      setSaving(false)
    }
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

          <button
            onClick={save}
            disabled={!form.name || saving}
            className="w-full py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Guardando...' : 'Guardar y continuar →'}
          </button>
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
              <div
                className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl"
                style={{ backgroundColor: form.accentColor }}
              >
                🍽️
              </div>
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
