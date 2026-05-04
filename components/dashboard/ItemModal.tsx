'use client'

import { useState } from 'react'
import { Sparkles, X, Loader2 } from 'lucide-react'
import Image from 'next/image'

type Item = {
  id: string
  name: string
  description: string
  price: string
  imageUrl: string
  imageAiUrl: string
  isFeatured: boolean
  isActive: boolean
  tags: string[]
}

const TAGS = ['Vegetariano', 'Sin TACC', 'Picante', 'Nuevo', 'Más pedido', 'Sin lactosa']

interface ItemModalProps {
  item: Item
  categoryName: string
  onSave: (updates: Partial<Item>) => void
  onClose: () => void
}

export default function ItemModal({ item, categoryName, onSave, onClose }: ItemModalProps) {
  const [form, setForm] = useState(item)
  const [generatingDesc, setGeneratingDesc] = useState(false)
  const [enhancing, setEnhancing] = useState(false)
  const [showAi, setShowAi] = useState(false)
  const [uploading, setUploading] = useState(false)

  function set(key: string, val: any) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function generateDescription() {
    if (!form.name) return
    setGeneratingDesc(true)
    try {
      const res = await fetch('/api/ai/describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, category: categoryName }),
      })
      const data = await res.json()
      if (data.description) set('description', data.description)
    } finally {
      setGeneratingDesc(false)
    }
  }

  async function enhanceImage() {
    if (!form.imageUrl) return
    setEnhancing(true)
    try {
      const res = await fetch('/api/ai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: form.imageUrl, itemId: item.id }),
      })
      const data = await res.json()
      if (data.url) {
        set('imageAiUrl', data.url)
        setShowAi(true)
      }
    } finally {
      setEnhancing(false)
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      // Preview inmediato
      const objectUrl = URL.createObjectURL(file)
      set('imageUrl', objectUrl)
      set('imageAiUrl', '') // resetear IA al cambiar foto
      setShowAi(false)

      // En producción: subir a uploadthing y guardar URL real
      // const formData = new FormData()
      // formData.append('file', file)
      // const res = await fetch('/api/upload/item', { method: 'POST', body: formData })
      // const { url } = await res.json()
      // set('imageUrl', url)
    } finally {
      setUploading(false)
    }
  }

  function toggleTag(tag: string) {
    const tags = form.tags?.includes(tag)
      ? form.tags.filter(t => t !== tag)
      : [...(form.tags ?? []), tag]
    set('tags', tags)
  }

  function save() {
    onSave(form)
    onClose()
  }

  const displayImage = showAi && form.imageAiUrl ? form.imageAiUrl : form.imageUrl

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <h2 className="font-semibold text-neutral-900">Editar plato</h2>
          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">

          {/* Imagen */}
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-2 block">Foto del plato</label>
            <div className="flex gap-3">
              {/* Preview */}
              <div className="w-24 h-24 rounded-xl overflow-hidden border border-neutral-200 shrink-0 bg-neutral-50 flex items-center justify-center relative">
                {displayImage ? (
                  <Image src={displayImage} alt={form.name} fill className="object-cover" />
                ) : (
                  <span className="text-2xl">🍽️</span>
                )}
                {(uploading || enhancing) && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2">
                {/* Upload */}
                <label className="flex items-center justify-center gap-2 w-full py-2 border border-dashed border-neutral-300 rounded-lg text-xs text-neutral-500 cursor-pointer hover:border-orange-400 hover:text-orange-500 transition-colors">
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  {uploading ? 'Subiendo...' : '+ Subir foto'}
                </label>

                {/* Toggle original / IA */}
                {form.imageAiUrl && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => setShowAi(false)}
                      className={`flex-1 text-xs py-1.5 rounded-lg transition-colors ${!showAi ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-neutral-500'}`}
                    >
                      Original
                    </button>
                    <button
                      onClick={() => setShowAi(true)}
                      className={`flex-1 text-xs py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 ${showAi ? 'bg-orange-500 text-white' : 'bg-neutral-100 text-neutral-500'}`}
                    >
                      <Sparkles className="w-3 h-3" /> IA
                    </button>
                  </div>
                )}

                {/* Botón mejorar IA */}
                {form.imageUrl && !form.imageAiUrl && (
                  <button
                    onClick={enhanceImage}
                    disabled={enhancing}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:opacity-90 disabled:opacity-60 transition-opacity"
                  >
                    <Sparkles className="w-3 h-3" />
                    {enhancing ? 'Mejorando...' : 'Mejorar con IA'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1.5 block">Nombre *</label>
            <input
              className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Nombre del plato"
            />
          </div>

          {/* Descripción + IA */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-neutral-500">Descripción</label>
              <button
                onClick={generateDescription}
                disabled={!form.name || generatingDesc}
                className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 disabled:opacity-40 transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                {generatingDesc ? 'Generando...' : 'Generar con IA'}
              </button>
            </div>
            <textarea
              className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              rows={2}
              value={form.description ?? ''}
              onChange={e => set('description', e.target.value)}
              placeholder="Descripción breve del plato..."
            />
          </div>

          {/* Precio */}
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1.5 block">Precio *</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-400 font-medium">$</span>
              <input
                type="number"
                className="flex-1 px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                value={form.price}
                onChange={e => set('price', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-2 block">Etiquetas</label>
            <div className="flex flex-wrap gap-1.5">
              {TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    form.tags?.includes(tag)
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'border-neutral-300 text-neutral-600 hover:border-orange-400'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Opciones */}
          <div className="flex gap-3 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={e => set('isFeatured', e.target.checked)}
                className="rounded"
              />
              <span className="text-xs text-neutral-600">Destacado ⭐</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={e => set('isActive', e.target.checked)}
                className="rounded"
              />
              <span className="text-xs text-neutral-600">Visible en el menú</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 border-t border-neutral-100 bg-neutral-50">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm text-neutral-600 border border-neutral-300 rounded-xl hover:bg-neutral-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={!form.name}
            className="flex-1 py-2.5 text-sm font-medium bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
