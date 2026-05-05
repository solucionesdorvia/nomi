import { ImageResponse } from 'next/og'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'
import { getMenuTheme } from '@/lib/theme'

export const runtime = 'nodejs'

const CARD_W = 1080
const CARD_H = 1350

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function loadGoogleFont(family: string, weight: number, text: string): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&text=${encodeURIComponent(text)}`
  const css = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
  }).then(r => r.text())
  const match = css.match(/src: url\(([^)]+)\) format\('(?:opentype|truetype)'\)/)
  if (!match) throw new Error(`No se pudo cargar fuente ${family}@${weight}`)
  return fetch(match[1]).then(r => r.arrayBuffer())
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

type DishEnrichment = {
  tagline: string
  ingredients: string[]
  description: string
}

const FALLBACK_ENRICHMENT: DishEnrichment = {
  tagline: '',
  ingredients: [],
  description: '',
}

async function enrichDishWithAI(args: {
  name: string
  description: string | null
  category: string | null
  tags: string[]
}): Promise<DishEnrichment> {
  if (!process.env.OPENAI_API_KEY) return FALLBACK_ENRICHMENT
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Sos un copywriter gastronomico premium para restaurantes argentinos. Devolves SIEMPRE JSON valido con esta forma exacta:
{
  "tagline": "frase corta poetica de 4-7 palabras, sin punto final, sin emojis",
  "ingredients": ["ingrediente 1", "ingrediente 2", "..."],
  "description": "descripcion editorial premium de 2 oraciones, maximo 30 palabras totales, sin emojis"
}
Reglas: español rioplatense, sin clichés, sin "delicioso/exquisito", sin signos de exclamación. La lista de ingredientes son 4-6 elementos visibles del plato (no condimentos), capitalizados estilo titulo.`,
        },
        {
          role: 'user',
          content: `Plato: "${args.name}"
Categoria: ${args.category ?? 'sin categoria'}
Descripcion existente: ${args.description ?? '(no hay)'}
Tags: ${args.tags.join(', ') || '(no hay)'}`,
        },
      ],
      max_tokens: 250,
      temperature: 0.7,
    })

    const raw = completion.choices[0].message.content?.trim() ?? '{}'
    const parsed = JSON.parse(raw)
    return {
      tagline: typeof parsed.tagline === 'string' ? parsed.tagline.slice(0, 80) : '',
      ingredients: Array.isArray(parsed.ingredients)
        ? parsed.ingredients.filter((i: unknown): i is string => typeof i === 'string').slice(0, 6)
        : [],
      description: typeof parsed.description === 'string' ? parsed.description.slice(0, 220) : '',
    }
  } catch (err) {
    console.error('AI enrich error:', err)
    return FALLBACK_ENRICHMENT
  }
}

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const url = new URL(req.url)
  const itemId = url.searchParams.get('itemId')
  if (!itemId) return new Response('itemId requerido', { status: 400 })

  // Validamos pertenencia: el item tiene que ser de un menu del business del user logueado.
  const item = await prisma.item.findFirst({
    where: {
      id: itemId,
      category: { menu: { business: { clerkId: userId } } },
    },
    include: {
      category: {
        include: {
          menu: {
            include: {
              business: { include: { branding: true } },
            },
          },
        },
      },
    },
  })

  if (!item) return new Response('Item no encontrado', { status: 404 })

  const business = item.category.menu.business
  const branding = business.branding
  const theme = getMenuTheme(branding)
  // La ficha de plato usa surface como fondo principal (claro), ink como
  // texto y accent para precio/destacado. Garantiza legibilidad.
  const surface = theme.surface
  const ink = theme.ink
  const accent = theme.accent
  const fontHeading = theme.fontHeading
  const fontBody = theme.fontBody
  const photo = item.imageAiUrl ?? item.imageUrl

  const enrichment = await enrichDishWithAI({
    name: item.name,
    description: item.description,
    category: item.category.name,
    tags: item.tags,
  })

  // Si OpenAI fallo o no hay key, usamos defaults pero igual mostramos el plato.
  const tagline = enrichment.tagline || (item.description?.split('.')[0] ?? '')
  const ingredients = enrichment.ingredients.length > 0
    ? enrichment.ingredients
    : (item.tags.length > 0 ? item.tags : [])
  const description = enrichment.description || item.description || ''
  const priceLabel = formatPriceARS(item.price.toString())

  // Subset de fonts: cargamos solo lo necesario para esta card.
  const headingChars = (business.name + item.name + tagline + 'INGREDIENTES').toUpperCase()
  const bodyChars = (description + ingredients.join(' ') + priceLabel + business.slug + item.category.name + 'INGREDIENTES nomi.app/m/ destacado')

  let headingFont: ArrayBuffer | undefined
  let bodyRegular: ArrayBuffer | undefined
  let bodyBold: ArrayBuffer | undefined
  try {
    [headingFont, bodyRegular, bodyBold] = await Promise.all([
      loadGoogleFont(fontHeading, 700, headingChars),
      loadGoogleFont(fontBody, 400, bodyChars),
      loadGoogleFont(fontBody, 700, bodyChars),
    ])
  } catch (err) {
    console.error('Font load error:', err)
  }

  const fonts = [
    headingFont && { name: 'Heading', data: headingFont, weight: 700 as const, style: 'normal' as const },
    bodyRegular && { name: 'Body', data: bodyRegular, weight: 400 as const, style: 'normal' as const },
    bodyBold && { name: 'Body', data: bodyBold, weight: 700 as const, style: 'normal' as const },
  ].filter(Boolean) as { name: string; data: ArrayBuffer; weight: 400 | 700; style: 'normal' }[]

  return new ImageResponse(
    (
      <div
        style={{
          width: CARD_W,
          height: CARD_H,
          backgroundColor: surface,
          color: ink,
          fontFamily: 'Body',
          display: 'flex',
          flexDirection: 'column',
          padding: 64,
          position: 'relative',
        }}
      >
        {/* Microlabel arriba: categoria + flag de destacado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div
            style={{
              fontSize: 16,
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: ink + 'aa',
              fontWeight: 700,
            }}
          >
            {item.category.name}
          </div>
          {item.isFeatured && (
            <>
              <div style={{ width: 4, height: 4, borderRadius: 999, backgroundColor: accent }} />
              <div
                style={{
                  fontSize: 16,
                  letterSpacing: 4,
                  textTransform: 'uppercase',
                  color: accent,
                  fontWeight: 700,
                }}
              >
                Destacado
              </div>
            </>
          )}
        </div>

        {/* Nombre del plato */}
        <div
          style={{
            fontFamily: 'Heading',
            fontWeight: 700,
            fontSize: 92,
            color: ink,
            lineHeight: 1.0,
            letterSpacing: -2,
            marginBottom: 16,
            display: 'flex',
          }}
        >
          {item.name}
        </div>

        {/* Tagline IA */}
        {tagline && (
          <div
            style={{
              fontFamily: 'Heading',
              fontSize: 32,
              color: accent,
              fontStyle: 'italic',
              lineHeight: 1.2,
              marginBottom: 32,
              display: 'flex',
            }}
          >
            {tagline}
          </div>
        )}

        {/* Foto del plato */}
        <div
          style={{
            width: '100%',
            height: 520,
            backgroundColor: accent + '15',
            borderRadius: 24,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
          }}
        >
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              width={CARD_W - 128}
              height={520}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              alt=""
            />
          ) : (
            <div style={{ fontSize: 120, color: accent, display: 'flex' }}>🍽</div>
          )}
        </div>

        {/* Bloque de info: ingredientes + precio */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            paddingTop: 24,
            paddingBottom: 24,
            borderTop: `1px solid ${ink}20`,
            borderBottom: `1px solid ${ink}20`,
            marginBottom: 24,
            gap: 32,
          }}
        >
          {/* Ingredientes */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              style={{
                fontSize: 14,
                letterSpacing: 3,
                textTransform: 'uppercase',
                color: ink + '88',
                fontWeight: 700,
              }}
            >
              Ingredientes
            </div>
            <div
              style={{
                fontSize: 22,
                color: ink,
                lineHeight: 1.4,
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0 8px',
              }}
            >
              {ingredients.length > 0
                ? ingredients.join(' · ')
                : (item.description ? item.description.slice(0, 120) : '—')}
            </div>
          </div>

          {/* Precio */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <div
              style={{
                fontSize: 14,
                letterSpacing: 3,
                textTransform: 'uppercase',
                color: ink + '88',
                fontWeight: 700,
              }}
            >
              Precio
            </div>
            <div
              style={{
                fontFamily: 'Heading',
                fontWeight: 700,
                fontSize: 56,
                color: accent,
                display: 'flex',
              }}
            >
              {priceLabel}
            </div>
          </div>
        </div>

        {/* Descripcion premium */}
        {description && (
          <div
            style={{
              fontSize: 22,
              color: ink + 'cc',
              lineHeight: 1.5,
              marginBottom: 'auto',
              display: 'flex',
            }}
          >
            {description}
          </div>
        )}

        {/* Footer con marca del local + url Nomi */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            left: 64,
            right: 64,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            paddingTop: 24,
            borderTop: `1px solid ${ink}15`,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div
              style={{
                fontFamily: 'Heading',
                fontWeight: 700,
                fontSize: 24,
                color: ink,
                display: 'flex',
              }}
            >
              {business.name}
            </div>
            <div
              style={{
                fontSize: 14,
                color: ink + '88',
                letterSpacing: 1,
                display: 'flex',
              }}
            >
              nomi.app/m/{business.slug}
            </div>
          </div>
          <div
            style={{
              fontSize: 12,
              letterSpacing: 2,
              color: ink + '55',
              textTransform: 'uppercase',
              display: 'flex',
            }}
          >
            menu by nomi
          </div>
        </div>
      </div>
    ),
    {
      width: CARD_W,
      height: CARD_H,
      fonts,
    }
  )
}
