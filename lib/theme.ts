// Sistema de tokens derivados del Branding del business.
// Garantiza legibilidad y contraste sin importar que colores haya elegido
// el dueño del local: detecta claros/oscuros por luminancia y los mapea a
// roles semanticos (surface, ink, hero, accent).

type BrandingInput = {
  primaryColor?: string | null
  secondaryColor?: string | null
  accentColor?: string | null
  fontHeading?: string | null
  fontBody?: string | null
  style?: string | null
}

export type MenuTheme = {
  // Roles principales
  surface: string       // fondo principal del menu (claro)
  surfaceAlt: string    // fondo de tarjetas, ligeramente distinto al surface
  ink: string           // texto principal (oscuro sobre surface)
  subtleInk: string     // texto secundario (70% del ink)

  // Hero / banda superior
  heroBg: string        // fondo del hero (oscuro)
  heroInk: string       // texto sobre hero (claro, alto contraste)

  // Brand
  brand: string         // el color "fuerte" de la marca (puede ser primary, secondary o accent)
  accent: string        // CTAs y precios

  // Bordes y separadores derivados de ink con baja opacidad
  border: string        // 12% del ink
  borderStrong: string  // 22% del ink

  // Tipografias
  fontHeading: string
  fontBody: string

  // Estilo
  style: string

  // Util para mezclar el ink/heroInk con cualquier alpha
  withInkAlpha: (a: number) => string
  withHeroInkAlpha: (a: number) => string
}

function clamp01(n: number): number { return Math.max(0, Math.min(1, n)) }

function parseHex(hex: string | null | undefined, fallback: string): { r: number; g: number; b: number; hex: string } {
  const v = (hex && hex.trim()) ? hex.trim() : fallback
  const h = v.replace('#', '')
  const norm = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  const r = parseInt(norm.slice(0, 2), 16)
  const g = parseInt(norm.slice(2, 4), 16)
  const b = parseInt(norm.slice(4, 6), 16)
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    const f = parseHex(fallback, '#000000')
    return f
  }
  return { r, g, b, hex: '#' + norm.toLowerCase() }
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = parseHex(hex, '#000000')
  const channel = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function isDark(hex: string): boolean {
  return relativeLuminance(hex) < 0.5
}

function withAlpha(hex: string, alpha: number): string {
  const { hex: clean } = parseHex(hex, '#000000')
  const a = Math.round(clamp01(alpha) * 255).toString(16).padStart(2, '0')
  return clean + a
}

// Mezcla un color hex contra blanco o negro un porcentaje (0-1).
// Para derivar el surfaceAlt sutilmente distinto al surface.
function mix(hex: string, target: string, t: number): string {
  const a = parseHex(hex, '#000000')
  const b = parseHex(target, '#ffffff')
  const r = Math.round(a.r + (b.r - a.r) * clamp01(t))
  const g = Math.round(a.g + (b.g - a.g) * clamp01(t))
  const bch = Math.round(a.b + (b.b - a.b) * clamp01(t))
  const toHex = (n: number) => n.toString(16).padStart(2, '0')
  return '#' + toHex(r) + toHex(g) + toHex(bch)
}

export function getMenuTheme(branding: BrandingInput | null | undefined): MenuTheme {
  // Defaults seguros: si todo viene null usamos un set sobrio (blanco + grafito + naranja Nomi).
  const defaults = {
    primary: '#1a1a1a',
    secondary: '#fafaf7',
    accent: '#FF6B35',
  }
  const primary = parseHex(branding?.primaryColor, defaults.primary).hex
  const secondary = parseHex(branding?.secondaryColor, defaults.secondary).hex
  const accent = parseHex(branding?.accentColor, defaults.accent).hex

  // Determinamos cual de los 3 es el mas claro y el mas oscuro.
  // El surface debe ser el mas claro (mejor para fondo principal del menu).
  // El ink debe ser el mas oscuro (mejor para texto sobre el surface).
  const palette = [primary, secondary, accent]
  const sortedByLum = [...palette].sort((a, b) => relativeLuminance(b) - relativeLuminance(a))
  const lightest = sortedByLum[0]
  const darkest = sortedByLum[sortedByLum.length - 1]

  // Si el surface o el ink quedan iguales (caso edge: todos los colores son oscuros
  // o todos claros), agregamos blanco/negro para garantizar contraste.
  const surface = relativeLuminance(lightest) > 0.85 ? lightest : (isDark(lightest) ? '#ffffff' : lightest)
  const ink = relativeLuminance(darkest) < 0.2 ? darkest : (isDark(darkest) ? darkest : '#0a0a0a')

  // El "brand" es el color con mas saturacion intrinseca (primary o accent en general).
  // Para simplificar elegimos el accent porque es el color de "acento" definido por el user.
  const brand = accent

  // El hero tiene fondo oscuro para impacto y texto claro para legibilidad.
  // Si el ink es muy oscuro (mejor caso), uso ink como heroBg.
  // Si todos los colores son claros, uso negro neutral.
  const heroBg = relativeLuminance(ink) < 0.3 ? ink : '#0a0a0a'
  const heroInk = isDark(heroBg) ? '#ffffff' : '#0a0a0a'

  // surfaceAlt: surface mezclado con el ink un toque (4%) para diferenciar tarjetas.
  const surfaceAlt = mix(surface, ink, 0.04)

  // subtleInk: ink con 65% opacidad sobre el surface
  const subtleInk = withAlpha(ink, 0.65)

  return {
    surface,
    surfaceAlt,
    ink,
    subtleInk,
    heroBg,
    heroInk,
    brand,
    accent,
    border: withAlpha(ink, 0.12),
    borderStrong: withAlpha(ink, 0.22),
    fontHeading: branding?.fontHeading ?? 'Playfair Display',
    fontBody: branding?.fontBody ?? 'Inter',
    style: branding?.style ?? 'modern',
    withInkAlpha: (a: number) => withAlpha(ink, a),
    withHeroInkAlpha: (a: number) => withAlpha(heroInk, a),
  }
}
