'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Star, Eye, EyeOff, Sparkles } from 'lucide-react'
import PosterModal from '@/components/dashboard/PosterModal'

type Item = {
  id: string
  name: string
  description: string
  price: string
  imageUrl: string
  isFeatured: boolean
  isActive: boolean
  tags: string[]
}

type Category = {
  id: string
  name: string
  emoji: string
  isActive: boolean
  items: Item[]
  open: boolean
}

const TAGS = ['Vegetariano', 'Sin TACC', 'Picante', 'Nuevo', 'Más pedido', 'Sin lactosa']

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [menuId, setMenuId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [newCatName, setNewCatName] = useState('')
  const [addingCat, setAddingCat] = useState(false)
  const [posterOpen, setPosterOpen] = useState(false)

  useEffect(() => { loadMenu() }, [])

  async function loadMenu() {
    const res = await fetch('/api/menu')
    const data = await res.json()
    if (data?.id) {
      setMenuId(data.id)
      setCategories((data.categories ?? []).map((c: any) => ({ ...c, open: true, items: c.items ?? [] })))
    }
    setLoading(false)
  }

  async function addCategory() {
    if (!newCatName.trim() || !menuId) return
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ menuId, name: newCatName, emoji: '🍽️' }),
    })
    const cat = await res.json()
    setCategories(prev => [...prev, { ...cat, open: true, items: [] }])
    setNewCatName('')
    setAddingCat(false)
  }

  async function deleteCategory(id: string) {
    await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  async function addItem(categoryId: string) {
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categoryId,
        name: 'Nuevo plato',
        description: '',
        price: '0',
        tags: [],
      }),
    })
    const item = await res.json()
    setCategories(prev =>
      prev.map(c => c.id === categoryId ? { ...c, items: [...c.items, { ...item, description: '', tags: [] }] } : c)
    )
  }

  async function updateItem(categoryId: string, itemId: string, updates: Partial<Item>) {
    setCategories(prev =>
      prev.map(c => c.id === categoryId
        ? { ...c, items: c.items.map(i => i.id === itemId ? { ...i, ...updates } : i) }
        : c
      )
    )
    await fetch(`/api/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
  }

  async function deleteItem(categoryId: string, itemId: string) {
    await fetch(`/api/items/${itemId}`, { method: 'DELETE' })
    setCategories(prev =>
      prev.map(c => c.id === categoryId ? { ...c, items: c.items.filter(i => i.id !== itemId) } : c)
    )
  }

  if (loading) return (
    <div className="p-8 flex items-center gap-2 text-neutral-400">
      <div className="w-4 h-4 rounded-full border-2 border-neutral-300 border-t-orange-500 animate-spin" />
      Cargando carta...
    </div>
  )

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Mi carta</h1>
          <p className="text-neutral-500 mt-1">
            {categories.length} categorías · {categories.reduce((a, c) => a + c.items.length, 0)} platos
          </p>
        </div>
        <button
          onClick={() => setPosterOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm font-medium rounded-xl hover:opacity-90 shadow-sm shadow-orange-500/30 transition-opacity"
        >
          <Sparkles className="w-4 h-4" />
          Generar póster
        </button>
      </div>

      <PosterModal open={posterOpen} onClose={() => setPosterOpen(false)} />

      {/* Categorías */}
      <div className="space-y-4">
        {categories.map(cat => (
          <div key={cat.id} className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            {/* Header categoría */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100">
              <GripVertical className="w-4 h-4 text-neutral-300" />
              <input
                className="text-sm font-medium text-neutral-700 bg-transparent flex-1 focus:outline-none"
                value={cat.emoji + ' ' + cat.name}
                onChange={e => setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, name: e.target.value } : c))}
              />
              <div className="flex items-center gap-1 ml-auto">
                <button
                  onClick={() => setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, open: !c.open } : c))}
                  className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded"
                >
                  {cat.open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => deleteCategory(cat.id)}
                  className="p-1.5 text-neutral-400 hover:text-red-500 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Items */}
            {cat.open && (
              <div>
                {cat.items.map(item => (
                  <div key={item.id} className="flex gap-3 p-4 border-b border-neutral-50 hover:bg-neutral-50 group">
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <input
                          className="flex-1 text-sm font-medium text-neutral-800 bg-transparent border-b border-transparent focus:border-orange-400 focus:outline-none pb-0.5"
                          value={item.name}
                          onChange={e => updateItem(cat.id, item.id, { name: e.target.value })}
                          placeholder="Nombre del plato"
                        />
                        <div className="flex items-center">
                          <span className="text-sm text-neutral-400 mr-1">$</span>
                          <input
                            className="w-24 text-sm font-semibold text-orange-600 bg-transparent border-b border-transparent focus:border-orange-400 focus:outline-none pb-0.5 text-right"
                            value={item.price}
                            onChange={e => updateItem(cat.id, item.id, { price: e.target.value })}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <input
                        className="w-full text-xs text-neutral-500 bg-transparent focus:outline-none"
                        value={item.description ?? ''}
                        onChange={e => updateItem(cat.id, item.id, { description: e.target.value })}
                        placeholder="Descripción (opcional)"
                      />
                      <div className="flex flex-wrap gap-1 mt-1">
                        {TAGS.map(tag => (
                          <button
                            key={tag}
                            onClick={() => {
                              const tags = item.tags?.includes(tag)
                                ? item.tags.filter(t => t !== tag)
                                : [...(item.tags ?? []), tag]
                              updateItem(cat.id, item.id, { tags })
                            }}
                            className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                              item.tags?.includes(tag)
                                ? 'bg-orange-100 border-orange-300 text-orange-700'
                                : 'border-neutral-200 text-neutral-400 hover:border-neutral-300'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => updateItem(cat.id, item.id, { isFeatured: !item.isFeatured })}
                        className={`p-1.5 rounded ${item.isFeatured ? 'text-amber-500' : 'text-neutral-300 hover:text-neutral-500'}`}
                        title="Destacar"
                      >
                        <Star className="w-4 h-4" fill={item.isFeatured ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        onClick={() => updateItem(cat.id, item.id, { isActive: !item.isActive })}
                        className={`p-1.5 rounded ${item.isActive ? 'text-neutral-400' : 'text-neutral-200'}`}
                        title={item.isActive ? 'Ocultar' : 'Mostrar'}
                      >
                        {item.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => deleteItem(cat.id, item.id)}
                        className="p-1.5 rounded text-neutral-300 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Agregar item */}
                <button
                  onClick={() => addItem(cat.id)}
                  className="flex items-center gap-2 w-full px-4 py-3 text-sm text-neutral-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Agregar plato
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Agregar categoría */}
        {addingCat ? (
          <div className="bg-white rounded-xl border border-orange-300 p-4 flex gap-2">
            <input
              autoFocus
              className="flex-1 text-sm focus:outline-none"
              placeholder="Nombre de la categoría (ej: Entradas, Pizzas, Bebidas...)"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addCategory(); if (e.key === 'Escape') setAddingCat(false) }}
            />
            <button onClick={addCategory} className="px-3 py-1.5 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600">
              Agregar
            </button>
            <button onClick={() => setAddingCat(false)} className="px-3 py-1.5 text-neutral-400 text-sm hover:text-neutral-600">
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAddingCat(true)}
            className="flex items-center gap-2 w-full p-4 rounded-xl border border-dashed border-neutral-300 text-sm text-neutral-400 hover:border-orange-400 hover:text-orange-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva categoría
          </button>
        )}
      </div>
    </div>
  )
}
