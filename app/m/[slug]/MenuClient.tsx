'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Search, Star, Leaf, Wheat, Flame, Zap } from 'lucide-react'

type Branding = {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  fontHeading: string
  fontBody: string
  style: string
  logoUrl?: string | null
}

type Item = {
  id: string
  name: string
  description: string | null
  price: any
  imageUrl: string | null
  imageAiUrl: string | null
  isFeatured: boolean
  tags: string[]
  allergens: string[]
}

type Category = { id: string; name: string; emoji: string | null; items: Item[] }
type Menu = { categories: Category[] }
type Business = { name: string; branding: Branding | null }

const TAG_ICONS: Record<string, any> = {
  'Vegetariano': Leaf,
  'Sin TACC': Wheat,
  'Picante': Flame,
  'Nuevo': Zap,
}

export default function MenuClient({ business, menu }: { business: Business; menu: Menu }) {
  const b = business.branding
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const primary = b?.primaryColor ?? '#1a1a1a'
  const accent = b?.accentColor ?? '#FF6B35'
  const bg = b?.secondaryColor ?? '#ffffff'
  const fontH = b?.fontHeading ?? 'Playfair Display'
  const fontB = b?.fontBody ?? 'Inter'

  // Todos los tags del menú
  const allTags = [...new Set(menu.categories.flatMap(c => c.items.flatMap(i => i.tags)))]

  // Filtrado
  const filtered = menu.categories
    .map(cat => ({
      ...cat,
      items: cat.items.filter(item => {
        const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.description?.toLowerCase().includes(search.toLowerCase())
        const matchTag = !activeTag || item.tags.includes(activeTag)
        const matchCat = !activeCategory || cat.id === activeCategory
        return matchSearch && matchTag && matchCat
      }),
    }))
    .filter(cat => cat.items.length > 0)

  const featured = menu.categories.flatMap(c => c.items).filter(i => i.isFeatured)

  function formatPrice(price: any) {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(Number(price))
  }

  return (
    <div style={{ backgroundColor: bg, minHeight: '100vh', fontFamily: fontB }}>
      {/* Header */}
      <div style={{ backgroundColor: primary }} className="px-5 pt-10 pb-6">
        {b?.logoUrl ? (
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-white/10">
              <Image src={b.logoUrl} alt={business.name} width={80} height={80} className="object-cover" />
            </div>
          </div>
        ) : (
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"
            style={{ backgroundColor: accent + '30' }}
          >
            🍽️
          </div>
        )}
        <h1
          className="text-2xl font-bold text-center"
          style={{ color: bg, fontFamily: fontH }}
        >
          {business.name}
        </h1>
      </div>

      {/* Búsqueda */}
      <div className="px-4 -mt-5 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar platos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-3 rounded-xl border border-neutral-200 bg-white text-sm shadow-sm focus:outline-none"
            style={{ fontFamily: fontB }}
          />
        </div>
      </div>

      {/* Tags filtro */}
      {allTags.length > 0 && (
        <div className="px-4 mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {allTags.map(tag => {
            const Icon = TAG_ICONS[tag]
            const active = activeTag === tag
            return (
              <button
                key={tag}
                onClick={() => setActiveTag(active ? null : tag)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap transition-colors shrink-0"
                style={{
                  backgroundColor: active ? accent : 'transparent',
                  color: active ? '#fff' : primary,
                  borderColor: active ? accent : primary + '30',
                  fontFamily: fontB,
                }}
              >
                {Icon && <Icon className="w-3 h-3" />}
                {tag}
              </button>
            )
          })}
        </div>
      )}

      {/* Nav de categorías */}
      {menu.categories.length > 2 && (
        <div className="px-4 mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setActiveCategory(null)}
            className="px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0"
            style={{
              backgroundColor: !activeCategory ? accent : 'transparent',
              color: !activeCategory ? '#fff' : primary,
              border: `1px solid ${!activeCategory ? accent : primary + '20'}`,
              fontFamily: fontB,
            }}
          >
            Todo
          </button>
          {menu.categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              className="px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0"
              style={{
                backgroundColor: activeCategory === cat.id ? accent : 'transparent',
                color: activeCategory === cat.id ? '#fff' : primary,
                border: `1px solid ${activeCategory === cat.id ? accent : primary + '20'}`,
                fontFamily: fontB,
              }}
            >
              {cat.emoji && <span className="mr-1">{cat.emoji}</span>}
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Destacados */}
      {featured.length > 0 && !search && !activeTag && !activeCategory && (
        <div className="px-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4" style={{ color: accent }} fill={accent} />
            <p className="text-sm font-semibold" style={{ color: primary, fontFamily: fontH }}>Destacados</p>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {featured.map(item => (
              <div
                key={item.id}
                className="shrink-0 w-44 rounded-xl overflow-hidden border"
                style={{ borderColor: primary + '15', backgroundColor: '#fff' }}
              >
                <div
                  className="h-28 flex items-center justify-center text-3xl"
                  style={{ backgroundColor: accent + '15' }}
                >
                  {item.imageUrl ? (
                    <Image src={item.imageAiUrl || item.imageUrl} alt={item.name} width={176} height={112} className="object-cover w-full h-full" />
                  ) : '🍽️'}
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold line-clamp-1" style={{ color: primary, fontFamily: fontH }}>{item.name}</p>
                  <p className="text-xs font-bold mt-1" style={{ color: accent, fontFamily: fontB }}>{formatPrice(item.price)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Menú por categorías */}
      <div className="px-4 pb-24 space-y-6">
        {filtered.map(cat => (
          <div key={cat.id}>
            <div className="flex items-center gap-2 mb-3">
              {cat.emoji && <span className="text-lg">{cat.emoji}</span>}
              <h2
                className="text-base font-bold uppercase tracking-wide"
                style={{ color: accent, fontFamily: fontH, fontSize: 13 }}
              >
                {cat.name}
              </h2>
              <div className="flex-1 h-px" style={{ backgroundColor: accent + '25' }} />
            </div>

            <div className="space-y-2">
              {cat.items.map(item => (
                <div
                  key={item.id}
                  className="flex gap-3 p-3 rounded-xl"
                  style={{ backgroundColor: primary + '05', border: `1px solid ${primary}10` }}
                >
                  {(item.imageUrl || item.imageAiUrl) ? (
                    <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                      <Image
                        src={item.imageAiUrl || item.imageUrl!}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ) : (
                    <div
                      className="w-16 h-16 rounded-lg shrink-0 flex items-center justify-center text-2xl"
                      style={{ backgroundColor: accent + '15' }}
                    >
                      🍽️
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className="text-sm font-semibold leading-tight"
                        style={{ color: primary, fontFamily: fontH }}
                      >
                        {item.isFeatured && <Star className="inline w-3 h-3 mr-1 mb-0.5" style={{ color: accent }} fill={accent} />}
                        {item.name}
                      </p>
                      <p
                        className="text-sm font-bold shrink-0"
                        style={{ color: accent, fontFamily: fontB }}
                      >
                        {formatPrice(item.price)}
                      </p>
                    </div>
                    {item.description && (
                      <p className="text-xs mt-0.5 line-clamp-2" style={{ color: primary + '70', fontFamily: fontB }}>
                        {item.description}
                      </p>
                    )}
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {item.tags.map(tag => (
                          <span
                            key={tag}
                            className="text-xs px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: accent + '15', color: accent, fontFamily: fontB }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-sm" style={{ color: primary + '60', fontFamily: fontB }}>No encontramos platos con ese filtro</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 py-3 text-center" style={{ backgroundColor: bg + 'ee', backdropFilter: 'blur(8px)' }}>
        <p className="text-xs" style={{ color: primary + '40', fontFamily: fontB }}>
          Menú digital por <span style={{ color: accent }}>Nomi</span>
        </p>
      </div>
    </div>
  )
}

// Tracking helper (agregar al inicio del componente)
// useEffect(() => {
//   const device = window.innerWidth < 768 ? 'mobile' : 'desktop'
//   fetch('/api/analytics', { method: 'POST', headers: {'Content-Type':'application/json'},
//     body: JSON.stringify({ slug, event: 'menu_view', device }) })
// }, [])
