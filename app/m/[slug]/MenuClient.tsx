'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Search, Star, Leaf, Wheat, Flame, Zap, ArrowDown, X } from 'lucide-react'
import { useMenuTracking } from '@/hooks/useMenuTracking'
import { getMenuTheme } from '@/lib/theme'

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
  price: unknown
  imageUrl: string | null
  imageAiUrl: string | null
  isFeatured: boolean
  tags: string[]
  allergens: string[]
}

type Category = { id: string; name: string; emoji: string | null; items: Item[] }
type Menu = { categories: Category[] }
type Business = { name: string; branding: Branding | null }

const TAG_ICONS: Record<string, typeof Leaf> = {
  'Vegetariano': Leaf,
  'Sin TACC': Wheat,
  'Picante': Flame,
  'Nuevo': Zap,
}

type StylePreset = {
  name: string
  cardRadius: number
  buttonRadius: number
  photoFilter: string
  divider: string
  bigDisplaySize: number
  numberStyle: 'roman' | 'arabic' | 'hash'
  hasOrnaments: boolean
  pillStyle: 'rounded' | 'square'
  letterSpacing: string
}

function getStylePreset(style: string): StylePreset {
  switch (style) {
    case 'elegant':
      return {
        name: 'elegant',
        cardRadius: 2,
        buttonRadius: 2,
        photoFilter: 'contrast(1.05) saturate(0.92)',
        divider: '✦',
        bigDisplaySize: 80,
        numberStyle: 'roman',
        hasOrnaments: true,
        pillStyle: 'square',
        letterSpacing: '0.18em',
      }
    case 'casual':
      return {
        name: 'casual',
        cardRadius: 24,
        buttonRadius: 999,
        photoFilter: 'saturate(1.08)',
        divider: '●',
        bigDisplaySize: 64,
        numberStyle: 'arabic',
        hasOrnaments: false,
        pillStyle: 'rounded',
        letterSpacing: '0.04em',
      }
    case 'minimal':
      return {
        name: 'minimal',
        cardRadius: 0,
        buttonRadius: 0,
        photoFilter: 'none',
        divider: '/',
        bigDisplaySize: 96,
        numberStyle: 'hash',
        hasOrnaments: false,
        pillStyle: 'square',
        letterSpacing: '0.10em',
      }
    case 'modern':
    default:
      return {
        name: 'modern',
        cardRadius: 16,
        buttonRadius: 999,
        photoFilter: 'none',
        divider: '—',
        bigDisplaySize: 72,
        numberStyle: 'arabic',
        hasOrnaments: false,
        pillStyle: 'rounded',
        letterSpacing: '0.06em',
      }
  }
}

function formatPrice(price: unknown): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(Number(price))
}

function formatCategoryNumber(n: number, style: StylePreset['numberStyle']): string {
  if (style === 'roman') {
    const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
    return roman[n - 1] ?? String(n)
  }
  if (style === 'hash') return `#${String(n).padStart(2, '0')}`
  return String(n).padStart(2, '0')
}

// Helper local con cualquier hex (usado para alphas sobre el accent).
function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255).toString(16).padStart(2, '0')
  return `${hex}${a}`
}

export default function MenuClient({
  slug,
  business,
  menu,
}: {
  slug: string
  business: Business
  menu: Menu
}) {
  const b = business.branding
  // Theme con roles semanticos derivados del branding del local. Garantiza
  // contraste y legibilidad sin importar que combinacion ponga el dueño.
  const theme = useMemo(() => getMenuTheme(b), [b])
  const {
    surface, surfaceAlt, ink, subtleInk,
    heroBg, heroInk, accent,
    border, borderStrong,
    fontHeading, fontBody,
    withInkAlpha, withHeroInkAlpha,
  } = theme
  const preset = useMemo(() => getStylePreset(b?.style ?? 'modern'), [b?.style])

  useMenuTracking(slug)

  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 360)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const allTags = useMemo(
    () => [...new Set(menu.categories.flatMap(c => c.items.flatMap(i => i.tags)))],
    [menu.categories]
  )

  const filtered = useMemo(
    () => menu.categories
      .map(cat => ({
        ...cat,
        items: cat.items.filter(item => {
          const q = search.trim().toLowerCase()
          const matchSearch = !q
            || item.name.toLowerCase().includes(q)
            || (item.description?.toLowerCase().includes(q) ?? false)
          const matchTag = !activeTag || item.tags.includes(activeTag)
          const matchCat = !activeCategory || cat.id === activeCategory
          return matchSearch && matchTag && matchCat
        }),
      }))
      .filter(cat => cat.items.length > 0),
    [menu.categories, search, activeTag, activeCategory]
  )

  const featured = useMemo(
    () => menu.categories.flatMap(c => c.items).filter(i => i.isFeatured),
    [menu.categories]
  )

  const hasFilters = search.trim() || activeTag || activeCategory

  function clearFilters() {
    setSearch('')
    setActiveTag(null)
    setActiveCategory(null)
  }

  // Carga las fonts del branding desde Google Fonts al montar.
  useEffect(() => {
    const fonts = [fontHeading, fontBody].filter((v, i, a) => a.indexOf(v) === i)
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?${fonts.map(f => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@400;500;600;700`).join('&')}&display=swap`
    document.head.appendChild(link)
    return () => { document.head.removeChild(link) }
  }, [fontHeading, fontBody])

  return (
    <div
      style={{
        backgroundColor: surface,
        color: ink,
        fontFamily: fontBody,
        minHeight: '100vh',
      }}
    >
      {/* Sticky bar */}
      <div
        className="fixed top-0 left-0 right-0 z-40 transition-all duration-500"
        style={{
          transform: scrolled ? 'translateY(0)' : 'translateY(-100%)',
          backgroundColor: surface,
          borderBottom: `1px solid ${border}`,
        }}
      >
        <div className="max-w-3xl mx-auto px-5 py-3 flex items-center gap-3">
          {b?.logoUrl ? (
            <div
              className="w-9 h-9 overflow-hidden shrink-0"
              style={{ borderRadius: preset.buttonRadius / 2, border: `1px solid ${border}` }}
            >
              <Image src={b.logoUrl} alt={business.name} width={36} height={36} className="object-cover w-full h-full" />
            </div>
          ) : (
            <div
              className="w-9 h-9 flex items-center justify-center shrink-0 font-semibold"
              style={{
                backgroundColor: accent,
                color: surface,
                borderRadius: preset.buttonRadius / 2,
                fontFamily: fontHeading,
              }}
            >
              {business.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div
            className="text-sm font-semibold flex-1 truncate"
            style={{ fontFamily: fontHeading, color: ink }}
          >
            {business.name}
          </div>
          <a
            href="#menu"
            className="text-xs px-3 py-1.5 transition-colors"
            style={{
              backgroundColor: accent,
              color: surface,
              borderRadius: preset.buttonRadius,
              fontFamily: fontBody,
            }}
          >
            Ver menú
          </a>
        </div>
      </div>

      {/* HERO */}
      <section
        className="relative overflow-hidden"
        style={{
          backgroundColor: heroBg,
          color: heroInk,
          minHeight: '92vh',
          paddingTop: 64,
          paddingBottom: 40,
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(120% 80% at 50% 0%, ${withAlpha(accent, 0.22)} 0%, transparent 60%)`,
          }}
        />

        <div className="relative max-w-3xl mx-auto px-6 flex flex-col items-center text-center pt-12 pb-16">
          {b?.logoUrl ? (
            <div
              className="overflow-hidden mb-8"
              style={{
                width: 132,
                height: 132,
                borderRadius: preset.name === 'elegant' || preset.name === 'minimal' ? 0 : 999,
                border: `2px solid ${withHeroInkAlpha(0.18)}`,
                backgroundColor: withHeroInkAlpha(0.05),
              }}
            >
              <Image
                src={b.logoUrl}
                alt={business.name}
                width={132}
                height={132}
                className="object-cover w-full h-full"
              />
            </div>
          ) : (
            <div
              className="flex items-center justify-center mb-8"
              style={{
                width: 132,
                height: 132,
                borderRadius: preset.name === 'elegant' || preset.name === 'minimal' ? 0 : 999,
                border: `1.5px solid ${withHeroInkAlpha(0.25)}`,
                color: heroInk,
                fontFamily: fontHeading,
                fontSize: 56,
                letterSpacing: '-0.04em',
              }}
            >
              {business.name.slice(0, 1).toUpperCase()}
            </div>
          )}

          <div
            className="mb-4 uppercase text-xs"
            style={{
              color: withHeroInkAlpha(0.6),
              letterSpacing: preset.letterSpacing,
              fontFamily: fontBody,
            }}
          >
            {preset.divider} Menú · {new Date().getFullYear()} {preset.divider}
          </div>

          <h1
            className="font-bold leading-[1.02] tracking-tight"
            style={{
              fontFamily: fontHeading,
              fontSize: preset.bigDisplaySize,
              color: heroInk,
              letterSpacing: preset.name === 'minimal' ? '-0.02em' : preset.name === 'elegant' ? '0' : '-0.03em',
            }}
          >
            {business.name}
          </h1>

          <div
            className="mt-8"
            style={{ width: 64, height: 1, backgroundColor: accent }}
          />

          <p
            className="mt-8 text-sm max-w-md"
            style={{ color: withHeroInkAlpha(0.68), fontFamily: fontBody, lineHeight: 1.65 }}
          >
            {menu.categories.length} {menu.categories.length === 1 ? 'categoría' : 'categorías'} ·
            {' '}
            {menu.categories.reduce((a, c) => a + c.items.length, 0)} platos
            {featured.length > 0 && ` · ${featured.length} ${featured.length === 1 ? 'recomendación' : 'recomendaciones'}`}
          </p>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <a
            href="#menu"
            className="flex flex-col items-center gap-2 transition-opacity hover:opacity-100"
            style={{ color: withHeroInkAlpha(0.6) }}
          >
            <span className="text-[10px] uppercase tracking-[0.3em]" style={{ fontFamily: fontBody }}>
              Carta
            </span>
            <ArrowDown className="w-4 h-4 animate-bounce" style={{ animationDuration: '2.5s' }} />
          </a>
        </div>
      </section>

      {/* SECCION MENU */}
      <main id="menu" className="max-w-3xl mx-auto px-5 sm:px-6 pt-10 pb-24">
        {/* Search bar */}
        <div className="relative mb-5">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: withInkAlpha(0.4) }}
          />
          <input
            type="text"
            placeholder="Buscar en la carta..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-10 py-3.5 text-sm focus:outline-none transition-colors"
            style={{
              backgroundColor: surface,
              color: ink,
              border: `1px solid ${border}`,
              borderRadius: preset.cardRadius,
              fontFamily: fontBody,
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
              style={{ color: subtleInk }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Tags */}
        {allTags.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-hide -mx-1 px-1">
            {allTags.map(tag => {
              const Icon = TAG_ICONS[tag]
              const active = activeTag === tag
              return (
                <button
                  key={tag}
                  onClick={() => setActiveTag(active ? null : tag)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs whitespace-nowrap transition-all shrink-0"
                  style={{
                    backgroundColor: active ? ink : 'transparent',
                    color: active ? surface : ink,
                    border: `1px solid ${active ? ink : borderStrong}`,
                    borderRadius: preset.pillStyle === 'rounded' ? 999 : 0,
                    fontFamily: fontBody,
                    fontWeight: 500,
                  }}
                >
                  {Icon && <Icon className="w-3 h-3" />}
                  {tag}
                </button>
              )
            })}
          </div>
        )}

        {/* Categories nav */}
        {menu.categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 mb-8 scrollbar-hide -mx-1 px-1">
            <button
              onClick={() => setActiveCategory(null)}
              className="px-4 py-2 text-xs whitespace-nowrap transition-all shrink-0"
              style={{
                backgroundColor: !activeCategory ? accent : 'transparent',
                color: !activeCategory ? surface : ink,
                border: `1px solid ${!activeCategory ? accent : borderStrong}`,
                borderRadius: preset.pillStyle === 'rounded' ? 999 : 0,
                fontFamily: fontBody,
                fontWeight: 500,
              }}
            >
              Todo
            </button>
            {menu.categories.map(cat => {
              const active = activeCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(active ? null : cat.id)}
                  className="px-4 py-2 text-xs whitespace-nowrap transition-all shrink-0"
                  style={{
                    backgroundColor: active ? accent : 'transparent',
                    color: active ? surface : ink,
                    border: `1px solid ${active ? accent : borderStrong}`,
                    borderRadius: preset.pillStyle === 'rounded' ? 999 : 0,
                    fontFamily: fontBody,
                    fontWeight: 500,
                  }}
                >
                  {cat.emoji && <span className="mr-1.5">{cat.emoji}</span>}
                  {cat.name}
                </button>
              )
            })}
          </div>
        )}

        {/* Destacados */}
        {featured.length > 0 && !hasFilters && (
          <section className="mb-12">
            <div className="flex items-baseline justify-between mb-5">
              <div>
                <p
                  className="text-[10px] uppercase mb-1"
                  style={{ color: accent, letterSpacing: preset.letterSpacing, fontFamily: fontBody, fontWeight: 600 }}
                >
                  {preset.divider} Recomendados
                </p>
                <h2
                  className="text-2xl"
                  style={{ fontFamily: fontHeading, color: ink, fontWeight: 600, letterSpacing: '-0.01em' }}
                >
                  Lo que más se pide
                </h2>
              </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide snap-x snap-mandatory">
              {featured.slice(0, 8).map(item => (
                <article
                  key={item.id}
                  className="shrink-0 w-64 overflow-hidden snap-start transition-transform"
                  style={{
                    backgroundColor: surfaceAlt,
                    border: `1px solid ${border}`,
                    borderRadius: preset.cardRadius,
                  }}
                >
                  <div
                    className="aspect-[4/3] overflow-hidden flex items-center justify-center"
                    style={{ backgroundColor: withAlpha(accent, 0.08) }}
                  >
                    {(item.imageAiUrl || item.imageUrl) ? (
                      <Image
                        src={item.imageAiUrl || item.imageUrl!}
                        alt={item.name}
                        width={256}
                        height={192}
                        className="object-cover w-full h-full"
                        style={{ filter: preset.photoFilter }}
                      />
                    ) : (
                      <span style={{ fontSize: 40 }}>🍽</span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Star className="w-3 h-3" style={{ color: accent }} fill={accent} />
                      <span className="text-[10px] uppercase tracking-widest" style={{ color: accent, fontWeight: 600 }}>
                        Destacado
                      </span>
                    </div>
                    <h3
                      className="text-base font-semibold leading-tight line-clamp-1 mb-1"
                      style={{ fontFamily: fontHeading, color: ink }}
                    >
                      {item.name}
                    </h3>
                    {item.description && (
                      <p
                        className="text-xs line-clamp-2 mb-2"
                        style={{ color: subtleInk, lineHeight: 1.5 }}
                      >
                        {item.description}
                      </p>
                    )}
                    <p className="text-base font-bold" style={{ color: accent, fontFamily: fontBody }}>
                      {formatPrice(item.price)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Categorias y items */}
        <div className="space-y-14">
          {filtered.map((cat, catIdx) => (
            <section key={cat.id}>
              <header className="flex items-end justify-between mb-6 pb-3" style={{ borderBottom: `1px solid ${border}` }}>
                <div>
                  <p
                    className="text-[10px] uppercase mb-1.5"
                    style={{
                      color: subtleInk,
                      letterSpacing: preset.letterSpacing,
                      fontFamily: fontBody,
                      fontWeight: 500,
                    }}
                  >
                    {formatCategoryNumber(catIdx + 1, preset.numberStyle)} · {cat.items.length} {cat.items.length === 1 ? 'plato' : 'platos'}
                  </p>
                  <h2
                    className="flex items-center gap-2"
                    style={{
                      fontFamily: fontHeading,
                      color: ink,
                      fontSize: 28,
                      fontWeight: 600,
                      letterSpacing: preset.name === 'elegant' ? '0.01em' : '-0.01em',
                      lineHeight: 1,
                    }}
                  >
                    {cat.emoji && <span style={{ fontSize: 22 }}>{cat.emoji}</span>}
                    {cat.name}
                  </h2>
                </div>
                {preset.hasOrnaments && (
                  <span style={{ color: accent, fontSize: 18 }}>{preset.divider}</span>
                )}
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {cat.items.map(item => {
                  const photo = item.imageAiUrl || item.imageUrl
                  return (
                    <article
                      key={item.id}
                      className="group overflow-hidden transition-all hover:translate-y-[-2px]"
                      style={{
                        backgroundColor: surfaceAlt,
                        border: `1px solid ${border}`,
                        borderRadius: preset.cardRadius,
                      }}
                    >
                      <div
                        className="relative aspect-[4/3] overflow-hidden"
                        style={{ backgroundColor: withAlpha(accent, 0.06) }}
                      >
                        {photo ? (
                          <Image
                            src={photo}
                            alt={item.name}
                            fill
                            sizes="(max-width: 640px) 100vw, 50vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                            style={{ filter: preset.photoFilter }}
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full" style={{ fontSize: 56 }}>
                            🍽
                          </div>
                        )}
                        {item.isFeatured && (
                          <div
                            className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 backdrop-blur-md"
                            style={{
                              backgroundColor: withAlpha(surface, 0.92),
                              borderRadius: preset.buttonRadius,
                            }}
                          >
                            <Star className="w-3 h-3" style={{ color: accent }} fill={accent} />
                            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: accent }}>
                              Destacado
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-4 sm:p-5">
                        <div className="flex items-baseline justify-between gap-3 mb-1.5">
                          <h3
                            className="text-base sm:text-lg font-semibold leading-tight"
                            style={{ fontFamily: fontHeading, color: ink, letterSpacing: '-0.005em' }}
                          >
                            {item.name}
                          </h3>
                          <p
                            className="text-base sm:text-lg font-bold whitespace-nowrap"
                            style={{ color: accent, fontFamily: fontBody, letterSpacing: '-0.01em' }}
                          >
                            {formatPrice(item.price)}
                          </p>
                        </div>

                        {item.description && (
                          <p
                            className="text-sm leading-relaxed line-clamp-2 mb-3"
                            style={{ color: subtleInk, fontFamily: fontBody }}
                          >
                            {item.description}
                          </p>
                        )}

                        {item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {item.tags.slice(0, 4).map(tag => (
                              <span
                                key={tag}
                                className="text-[10px] px-2 py-0.5 uppercase tracking-wider"
                                style={{
                                  backgroundColor: withAlpha(accent, 0.12),
                                  color: accent,
                                  borderRadius: preset.pillStyle === 'rounded' ? 999 : 2,
                                  fontFamily: fontBody,
                                  fontWeight: 600,
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-20">
              <p style={{ fontSize: 48, marginBottom: 12 }}>🔍</p>
              <p
                className="text-base mb-4"
                style={{ color: subtleInk, fontFamily: fontBody }}
              >
                No encontramos platos con ese filtro
              </p>
              <button
                onClick={clearFilters}
                className="text-xs px-4 py-2 transition-colors"
                style={{
                  backgroundColor: accent,
                  color: surface,
                  borderRadius: preset.buttonRadius,
                  fontFamily: fontBody,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                }}
              >
                Ver toda la carta
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer
        className="border-t mt-8"
        style={{
          borderColor: border,
          paddingTop: 32,
          paddingBottom: 32,
        }}
      >
        <div className="max-w-3xl mx-auto px-5 sm:px-6 flex flex-col items-center gap-4 text-center">
          {b?.logoUrl && (
            <div
              className="overflow-hidden"
              style={{
                width: 48,
                height: 48,
                borderRadius: preset.name === 'elegant' || preset.name === 'minimal' ? 0 : 999,
                border: `1px solid ${border}`,
              }}
            >
              <Image src={b.logoUrl} alt={business.name} width={48} height={48} className="object-cover w-full h-full" />
            </div>
          )}
          <div
            className="text-base font-semibold"
            style={{ fontFamily: fontHeading, color: ink }}
          >
            {business.name}
          </div>
          <div
            className="text-[10px] uppercase tracking-[0.4em]"
            style={{ color: subtleInk, fontFamily: fontBody }}
          >
            Menú digital
          </div>
          <div
            className="mt-2 text-[10px] uppercase"
            style={{
              color: withInkAlpha(0.35),
              letterSpacing: '0.3em',
              fontFamily: fontBody,
            }}
          >
            powered by{' '}
            <span style={{ color: accent, fontWeight: 600 }}>nomi</span>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
