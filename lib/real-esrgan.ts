/**
 * Real-ESRGAN vía Replicate: mejora nitidez/ruido sin reimaginar el plato (fidelidad a la foto original).
 * Devuelve null si falta token o falla la API.
 */

import Replicate from 'replicate'

const REAL_ESRGAN_MODEL =
  'nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b' as const

export function isRealEsrganAvailable(): boolean {
  return Boolean(process.env.REPLICATE_API_TOKEN)
}

function normalizeReplicateUrl(output: unknown): string | null {
  if (typeof output === 'string') return output
  if (Array.isArray(output) && typeof output[0] === 'string') return output[0]
  return null
}

function detectDataUrlMime(buf: Buffer): `image/${string}` {
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xd8) return 'image/jpeg'
  if (buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png'
  if (buf.length >= 6 && buf.toString('ascii', 0, 4) === 'GIF8') return 'image/gif'
  if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP')
    return 'image/webp'
  return 'image/png'
}

/** Recibe base64 sin prefijo data: — devuelve otro base64 (PNG) o null si no aplica. */
export async function enhanceBase64WithRealEsrgan(imageBase64: string): Promise<string | null> {
  if (!isRealEsrganAvailable()) return null
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! })
  const raw = Buffer.from(imageBase64, 'base64')
  const mime = detectDataUrlMime(raw)
  const dataUrl = `data:${mime};base64,${imageBase64}`
  try {
    const output = await replicate.run(REAL_ESRGAN_MODEL, {
      input: {
        image: dataUrl,
        scale: 2,
        face_enhance: false,
      },
    })
    const url = normalizeReplicateUrl(output)
    if (!url) return null
    const res = await fetch(url)
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    return buf.toString('base64')
  } catch (e) {
    console.warn('[real-esrgan] skip:', e instanceof Error ? e.message : e)
    return null
  }
}

/** Igual que enhance pero devuelve la URL del CDN de Replicate (menos payload que base64 en JSON). */
export async function enhanceToCdnUrlWithRealEsrgan(imageBase64: string): Promise<string | null> {
  if (!isRealEsrganAvailable()) return null
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! })
  const raw = Buffer.from(imageBase64, 'base64')
  const mime = detectDataUrlMime(raw)
  const dataUrl = `data:${mime};base64,${imageBase64}`
  try {
    const output = await replicate.run(REAL_ESRGAN_MODEL, {
      input: {
        image: dataUrl,
        scale: 2,
        face_enhance: false,
      },
    })
    return normalizeReplicateUrl(output)
  } catch (e) {
    console.warn('[real-esrgan] cdn url failed:', e instanceof Error ? e.message : e)
    return null
  }
}

/** data: URL correcta para Vision / APIs que requieren MIME (JPEG vs PNG). */
export function dataUrlFromRawBase64(imageBase64: string): string {
  const buf = Buffer.from(imageBase64, 'base64')
  return `data:${detectDataUrlMime(buf)};base64,${imageBase64}`
}

/** Nombre y content-type para enviar la imagen al Image API. */
export function uploadMetaFromRawBase64(imageBase64: string): { filename: string; type: string } {
  const buf = Buffer.from(imageBase64, 'base64')
  const mime = detectDataUrlMime(buf)
  if (mime === 'image/jpeg') return { filename: 'input.jpg', type: 'image/jpeg' }
  if (mime === 'image/webp') return { filename: 'input.webp', type: 'image/webp' }
  if (mime === 'image/gif') return { filename: 'input.gif', type: 'image/gif' }
  return { filename: 'input.png', type: 'image/png' }
}
