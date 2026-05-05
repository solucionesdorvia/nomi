'use client'

// Extrae paleta dominante del logo cargado.
// Usa node-vibrant en el browser. Devuelve hex codes para los 3 roles del Branding.
import { Vibrant } from 'node-vibrant/browser'

export type ExtractedPalette = {
  primaryColor: string   // color dominante oscuro
  secondaryColor: string // color claro complementario (fondo)
  accentColor: string    // color vivo para CTAs
}

const FALLBACK: ExtractedPalette = {
  primaryColor: '#1a1a1a',
  secondaryColor: '#ffffff',
  accentColor: '#FF6B35',
}

function toHex(rgb: [number, number, number]): string {
  const [r, g, b] = rgb
  return '#' + [r, g, b].map(c => Math.round(c).toString(16).padStart(2, '0')).join('')
}

export async function extractPaletteFromUrl(url: string): Promise<ExtractedPalette> {
  try {
    const palette = await Vibrant.from(url).getPalette()
    // Mapeo de roles: priorizamos colores con buena saturacion para el accent,
    // oscuros para primary, claros para secondary.
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
