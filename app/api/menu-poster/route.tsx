import { ImageResponse } from 'next/og'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

const POSTER_W = 1080
const POSTER_H = 1920

// Fetcheo de Google Fonts on-demand. La response queda cacheada por el server
// entre invocaciones — no es ideal para escala extrema pero alcanza para MVP.
async function loadGoogleFont(family: string, weight: number, text: string): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&text=${encodeURIComponent(text)}`
  const css = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
  }).then(r => r.text())
  const match = css.match(/src: url\(([^)]+)\) format\('(?:opentype|truetype)'\)/)
  if (!match) throw new Error(`No se pudo cargar fuente ${family}@${weight}`)
  const fontRes = await fetch(match[1])
  return fontRes.arrayBuffer()
}

function formatPriceARS(value: number | string): string {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const business = await prisma.business.findUnique({
    where: { clerkId: userId },
    include: {
      branding: true,
      menus: {
        where: { isActive: true },
        take: 1,
        include: {
          categories: {
            where: { isActive: true },
            include: {
              items: {
                where: { isActive: true },
              },
            },
          },
        },
      },
    },
  })

  if (!business) return new Response('Business not found', { status: 404 })
  if (!business.menus[0]) return new Response('Sin menu activo', { status: 404 })

  const branding = business.branding
  const primary = branding?.primaryColor ?? '#1a1a1a'
  const secondary = branding?.secondaryColor ?? '#ffffff'
  const accent = branding?.accentColor ?? '#FF6B35'
  const fontHeading = branding?.fontHeading ?? 'Playfair Display'
  const fontBody = branding?.fontBody ?? 'Inter'

  // Aplastamos todos los items y armamos el orden: destacados primero, despues por orden natural.
  const allItems = business.menus[0].categories.flatMap(cat =>
    cat.items.map(it => ({
      id: it.id,
      name: it.name,
      description: it.description ?? '',
      price: it.price.toString(),
      imageUrl: it.imageAiUrl ?? it.imageUrl ?? null,
      isFeatured: it.isFeatured,
      categoryName: cat.name,
    }))
  )

  const featured = allItems.filter(i => i.isFeatured)
  const others = allItems.filter(i => !i.isFeatured)
  const items = [...featured, ...others].slice(0, 8)

  // Texto que necesitamos para subset de fonts (Google Fonts permite cargar solo los chars usados).
  const headingText = (business.name + ' Nuestro menu Destacados').toUpperCase()
  const bodyText = items.map(i => `${i.name} ${i.description} ${formatPriceARS(i.price)}`).join(' ') + business.name

  let headingFont: ArrayBuffer | undefined
  let bodyFontRegular: ArrayBuffer | undefined
  let bodyFontBold: ArrayBuffer | undefined
  try {
    [headingFont, bodyFontRegular, bodyFontBold] = await Promise.all([
      loadGoogleFont(fontHeading, 700, headingText + bodyText.slice(0, 200)),
      loadGoogleFont(fontBody, 400, bodyText),
      loadGoogleFont(fontBody, 700, bodyText),
    ])
  } catch (err) {
    console.error('Font load error:', err)
  }

  const fonts = [
    headingFont && { name: 'Heading', data: headingFont, weight: 700 as const, style: 'normal' as const },
    bodyFontRegular && { name: 'Body', data: bodyFontRegular, weight: 400 as const, style: 'normal' as const },
    bodyFontBold && { name: 'Body', data: bodyFontBold, weight: 700 as const, style: 'normal' as const },
  ].filter(Boolean) as { name: string; data: ArrayBuffer; weight: 400 | 700; style: 'normal' }[]

  // Fila vacia para placeholder cuando hay menos de 8 items: completamos con items "fantasma"
  // hasta 8 para mantener el grid uniforme. Se renderean translucidos.
  const slots = [...items]
  while (slots.length < 8) {
    slots.push({
      id: `empty-${slots.length}`,
      name: '',
      description: '',
      price: '',
      imageUrl: null,
      isFeatured: false,
      categoryName: '',
    })
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: POSTER_W,
          height: POSTER_H,
          backgroundColor: secondary,
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Body',
          color: primary,
          position: 'relative',
        }}
      >
        {/* Banda superior con color primario */}
        <div
          style={{
            backgroundColor: primary,
            color: secondary,
            paddingTop: 60,
            paddingBottom: 50,
            paddingLeft: 60,
            paddingRight: 60,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          {branding?.logoUrl ? (
            <img
              src={branding.logoUrl}
              width={120}
              height={120}
              style={{ borderRadius: 999, objectFit: 'cover', border: `4px solid ${accent}` }}
            />
          ) : (
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: 999,
                backgroundColor: accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 64,
                color: secondary,
              }}
            >
              🍽
            </div>
          )}
          <div
            style={{
              fontFamily: 'Heading',
              fontWeight: 700,
              fontSize: 64,
              letterSpacing: -1,
              textAlign: 'center',
              lineHeight: 1.1,
            }}
          >
            {business.name}
          </div>
          <div
            style={{
              fontSize: 24,
              opacity: 0.7,
              textTransform: 'uppercase',
              letterSpacing: 4,
            }}
          >
            Nuestro menu
          </div>
        </div>

        {/* Banda decorativa con accent */}
        <div style={{ height: 8, backgroundColor: accent, display: 'flex' }} />

        {/* Grid 2 x 4 con los 8 platos */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexWrap: 'wrap',
            padding: 40,
            gap: 24,
            backgroundColor: secondary,
          }}
        >
          {slots.map((item, idx) => {
            const isEmpty = !item.name
            const cardWidth = (POSTER_W - 40 * 2 - 24) / 2
            return (
              <div
                key={item.id ?? idx}
                style={{
                  width: cardWidth,
                  height: 320,
                  backgroundColor: isEmpty ? 'transparent' : '#ffffff',
                  border: `1px solid ${primary}15`,
                  borderRadius: 18,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  opacity: isEmpty ? 0 : 1,
                }}
              >
                {/* Foto */}
                <div
                  style={{
                    width: '100%',
                    height: 180,
                    backgroundColor: accent + '15',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      width={cardWidth}
                      height={180}
                      style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                      alt=""
                    />
                  ) : (
                    <div style={{ fontSize: 64, color: accent, display: 'flex' }}>🍽</div>
                  )}
                </div>

                {/* Info */}
                <div
                  style={{
                    flex: 1,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div
                      style={{
                        fontFamily: 'Heading',
                        fontWeight: 700,
                        fontSize: 22,
                        color: primary,
                        lineHeight: 1.15,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {item.name}
                    </div>
                    {item.description && (
                      <div
                        style={{
                          fontSize: 14,
                          color: primary + 'aa',
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {item.description}
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 24,
                      color: accent,
                      marginTop: 8,
                    }}
                  >
                    {item.price ? formatPriceARS(item.price) : ''}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            backgroundColor: primary,
            color: secondary,
            padding: '36px 60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 18, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 3 }}>
              Escanea para ver la carta
            </div>
            <div style={{ fontFamily: 'Heading', fontWeight: 700, fontSize: 32, color: accent }}>
              nomi.app/m/{business.slug}
            </div>
          </div>
          <div
            style={{
              fontSize: 16,
              opacity: 0.5,
              display: 'flex',
              alignItems: 'flex-end',
            }}
          >
            menu by nomi
          </div>
        </div>
      </div>
    ),
    {
      width: POSTER_W,
      height: POSTER_H,
      fonts,
    }
  )
}
