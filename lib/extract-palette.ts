'use client'

// Extrae paleta dominante de imagenes cargadas.
// Usa node-vibrant en el browser. Devuelve hex codes para los 3 roles del Branding.
import { Vibrant } from 'node-vibrant/browser'

export type ExtractedPalette = {
  primaryColor: string   // color dominante oscuro
  secondaryColor: string // color claro complementario (fondo)
  accentColor: string    // color vivo para CTAs
}

type RGB = [number, number, number]

const FALLBACK: ExtractedPalette = {
  primaryColor: '#1a1a1a',
  secondaryColor: '#ffffff',
  accentColor: '#FF6B35',
}

function toHex(rgb: RGB): string {
  const [r, g, b] = rgb
  return '#' + [r, g, b].map(c => Math.round(c).toString(16).padStart(2, '0')).join('')
}

function luminance(rgb: RGB): number {
  const [r, g, b] = rgb
  const ch = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)
}

function saturation(rgb: RGB): number {
  const [r, g, b] = rgb
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  return max === 0 ? 0 : (max - min) / max
}

// Distancia Euclidiana en RGB para clusterizacion simple.
function rgbDist(a: RGB, b: RGB): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2)
}

export async function extractPaletteFromUrl(url: string): Promise<ExtractedPalette> {
  try {
    const palette = await Vibrant.from(url).getPalette()
    const dark = palette.DarkVibrant?.rgb ?? palette.DarkMuted?.rgb
    const light = palette.LightVibrant?.rgb ?? palette.LightMuted?.rgb ?? [255, 255, 255]
    const vibrant = palette.Vibrant?.rgb ?? palette.Muted?.rgb ?? palette.DarkVibrant?.rgb

    return {
      primaryColor: dark ? toHex(dark) : FALLBACK.primaryColor,
      secondaryColor: light ? toHex(light) : FALLBACK.secondaryColor,
      accentColor: vibrant ? toHex(vibrant) : FALLBACK.accentColor,
    }
  } catch (err) {
    console.error('[extract-palette] error:', err)
    return FALLBACK
  }
}

// Combina paletas de N imagenes en una sola. Estrategia:
// 1. Para cada imagen, extraemos los 6 swatches de Vibrant (todos roles).
// 2. Acumulamos pesos por similitud: colores que se repiten en varias imagenes
//    pesan mas. Asi filtramos colores casuales (un cielo aislado, etc.) y nos
//    quedamos con la identidad visual recurrente del feed.
// 3. Mapeamos los 3 colores ganadores a roles segun luminancia/saturacion.
export async function extractCombinedPaletteFromUrls(urls: string[]): Promise<ExtractedPalette> {
  if (urls.length === 0) return FALLBACK

  type Bucket = { rgb: RGB; weight: number }
  const buckets: Bucket[] = []
  const SIMILARITY_THRESHOLD = 50 // distancia rgb max para considerar "el mismo color"

  for (const url of urls) {
    try {
      const palette = await Vibrant.from(url).getPalette()
      const swatches = [
        palette.Vibrant, palette.DarkVibrant, palette.LightVibrant,
        palette.Muted, palette.DarkMuted, palette.LightMuted,
      ]
      for (const sw of swatches) {
        if (!sw) continue
        const rgb = sw.rgb as RGB
        // Buscamos un bucket existente cercano. Si hay, sumamos peso.
        const near = buckets.find(b => rgbDist(b.rgb, rgb) < SIMILARITY_THRESHOLD)
        if (near) {
          // Promedio ponderado para refinar el color del bucket.
          near.rgb = [
            (near.rgb[0] * near.weight + rgb[0]) / (near.weight + 1),
            (near.rgb[1] * near.weight + rgb[1]) / (near.weight + 1),
            (near.rgb[2] * near.weight + rgb[2]) / (near.weight + 1),
          ] as RGB
          near.weight += 1
        } else {
          buckets.push({ rgb, weight: 1 })
        }
      }
    } catch (err) {
      console.warn('[extract-palette] skip url por error:', url, err)
    }
  }

  if (buckets.length === 0) return FALLBACK

  // Ordenamos por peso (recurrencia entre imagenes) descendente.
  buckets.sort((a, b) => b.weight - a.weight)

  // Tomamos los top 8 buckets por recurrencia y de ahi pickeamos por rol.
  const top = buckets.slice(0, 8)

  // primary: el mas oscuro entre los recurrentes
  const dark = [...top].sort((a, b) => luminance(a.rgb) - luminance(b.rgb))[0]
  // secondary: el mas claro entre los recurrentes
  const light = [...top].sort((a, b) => luminance(b.rgb) - luminance(a.rgb))[0]
  // accent: el mas saturado entre los recurrentes (descartando muy oscuros y muy claros)
  const midRange = top.filter(b => {
    const l = luminance(b.rgb)
    return l > 0.15 && l < 0.85
  })
  const accent = (midRange.length > 0 ? midRange : top)
    .sort((a, b) => saturation(b.rgb) - saturation(a.rgb))[0]

  return {
    primaryColor: dark ? toHex(dark.rgb) : FALLBACK.primaryColor,
    secondaryColor: light ? toHex(light.rgb) : FALLBACK.secondaryColor,
    accentColor: accent ? toHex(accent.rgb) : FALLBACK.accentColor,
  }
}
