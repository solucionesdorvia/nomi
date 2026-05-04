import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import OpenAI, { toFile } from 'openai'
import { z } from 'zod'

export const runtime = 'nodejs'
// gpt-image-1 puede tardar ~60s; subimos el limite del handler.
export const maxDuration = 120

const schema = z.object({
  mode: z.enum(['upgrade', 'explotar', 'generar', 'branded']),
  imageBase64: z.string().optional(),
  itemName: z.string().min(1).max(120),
  ingredients: z.string().max(800).optional(),
})

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const PROMPTS = {
  upgrade: (name: string) => `
You are a professional food photographer and retoucher.
Use the attached food image as the exact product reference.
Preserve the dish, ingredients, plating, colors, textures, and presentation exactly as they are.
Create a premium restaurant advertising scene with the food as the hero centerpiece.
Add: appetizing studio lighting, cinematic steam if suitable, glossy texture on sauces, realistic shadows, refined styling, and a premium neutral background.
Make the final result crave-inducing, photoreal, ultra-detailed, HDR, ultra sharp.
Suitable for restaurant menus, delivery apps, and social media marketing.
Food item: ${name}
`.trim(),

  explotar: (name: string, ingredients: string) => `
Create a premium exploded-view food infographic illustration of "${name}".
Show each ingredient as a separate floating layer, stacked vertically with slight spacing between layers.
Each layer should have a clean label with the ingredient name in a minimal sans-serif font.
White or very light neutral background.
Style: clean, modern, editorial food illustration.
Premium quality, suitable for a high-end restaurant menu or brand campaign.
Ingredients to show as layers: ${ingredients}
Make it look like a professional food brand advertisement.
`.trim(),

  generar: (name: string, ingredients: string) => `
Create a stunning, photorealistic food photography image of "${name}".
Ingredients: ${ingredients}
Style: premium restaurant menu photography.
Lighting: soft studio lighting with warm tones, gentle shadows.
Plating: elegant, modern restaurant presentation on a clean white or dark plate.
Background: blurred neutral background (dark wood or marble texture).
Ultra sharp, HDR, appetizing, crave-inducing.
No text, no watermarks. Just the food.
`.trim(),

  branded: (
    name: string,
    businessName: string,
    primaryColor: string,
    accentColor: string,
    style: string,
  ) => `
Create a premium branded food advertising image for "${businessName}" restaurant.
Food item: "${name}"
Brand colors: primary ${primaryColor}, accent ${accentColor}.
Brand style: ${style}.
Create a complete social media advertisement: the food as the hero, styled with the brand's color palette as background accents or overlays, minimal elegant typography area (leave space for text overlay).
The image should feel like a professional Instagram post or story for this specific restaurant brand.
Ultra-detailed, photoreal food in the center. Premium advertising quality.
Cinematic lighting. Make it look irresistible and on-brand.
`.trim(),
}

// Limite duro de 25MB por imagen base64 (mas que eso OpenAI lo rechaza).
const MAX_BASE64_BYTES = 25 * 1024 * 1024 * (4 / 3)

type ImageItem = { url?: string | null; b64_json?: string | null }

function pickUrl(item: ImageItem | undefined): string | null {
  if (!item) return null
  if (item.url) return item.url
  if (item.b64_json) return `data:image/png;base64,${item.b64_json}`
  return null
}

async function generateWithFallback(prompt: string): Promise<string | null> {
  // Primero intento gpt-image-1 (mejor calidad, gated en muchas cuentas).
  try {
    const res = await openai.images.generate({
      model: 'gpt-image-1',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'high',
    })
    return pickUrl(res.data?.[0])
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    // Si la cuenta no tiene acceso al modelo, fallback a dall-e-3.
    if (/model_not_found|do not have access|not_found/i.test(msg)) {
      console.warn('[imagenes] gpt-image-1 no disponible, fallback a dall-e-3')
      const res = await openai.images.generate({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
        quality: 'hd',
      })
      return pickUrl(res.data?.[0])
    }
    throw err
  }
}

async function editWithFallback(prompt: string, imageBase64: string): Promise<string | null> {
  // OpenAI espera Uploadable; convertimos el base64 a un File via toFile().
  const buf = Buffer.from(imageBase64, 'base64')
  if (buf.byteLength > 25 * 1024 * 1024) {
    throw new Error('La imagen supera 25MB. Subi una version mas chica.')
  }
  const file = await toFile(buf, 'input.png', { type: 'image/png' })

  try {
    const res = await openai.images.edit({
      model: 'gpt-image-1',
      image: file,
      prompt,
      n: 1,
      size: '1024x1024',
    })
    return pickUrl(res.data?.[0])
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (/model_not_found|do not have access|not_found/i.test(msg)) {
      console.warn('[imagenes] gpt-image-1 edit no disponible, fallback a dall-e-2')
      const fileFallback = await toFile(buf, 'input.png', { type: 'image/png' })
      const res = await openai.images.edit({
        model: 'dall-e-2',
        image: fileFallback,
        prompt,
        n: 1,
        size: '1024x1024',
      })
      return pickUrl(res.data?.[0])
    }
    throw err
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY no configurada en el servidor' }, { status: 500 })
    }

    const body = await req.json()
    const data = schema.parse(body)

    if ((data.mode === 'upgrade' || data.mode === 'branded') && data.imageBase64) {
      if (data.imageBase64.length > MAX_BASE64_BYTES) {
        return NextResponse.json({ error: 'La imagen supera 25MB. Subi una version mas chica.' }, { status: 413 })
      }
    }
    if (data.mode === 'upgrade' && !data.imageBase64) {
      return NextResponse.json({ error: 'Subi una foto para usar el modo "Mejorar foto"' }, { status: 400 })
    }
    if ((data.mode === 'explotar' || data.mode === 'generar') && !data.ingredients?.trim()) {
      return NextResponse.json({ error: 'Cargá los ingredientes para este modo' }, { status: 400 })
    }

    const business = await prisma.business.findUnique({
      where: { clerkId: userId },
      include: { branding: true },
    })
    if (!business) return NextResponse.json({ error: 'Business no encontrado' }, { status: 404 })

    const branding = business.branding
    const itemName = data.itemName
    const ingredients = data.ingredients ?? ''

    let prompt = ''
    switch (data.mode) {
      case 'upgrade':
        prompt = PROMPTS.upgrade(itemName)
        break
      case 'explotar':
        prompt = PROMPTS.explotar(itemName, ingredients)
        break
      case 'generar':
        prompt = PROMPTS.generar(itemName, ingredients)
        break
      case 'branded':
        prompt = PROMPTS.branded(
          itemName,
          business.name,
          branding?.primaryColor ?? '#1a1a1a',
          branding?.accentColor ?? '#FF6B35',
          branding?.style ?? 'modern',
        )
        break
    }

    let url: string | null = null
    if ((data.mode === 'upgrade' || data.mode === 'branded') && data.imageBase64) {
      url = await editWithFallback(prompt, data.imageBase64)
    } else {
      url = await generateWithFallback(prompt)
    }

    if (!url) return NextResponse.json({ error: 'OpenAI devolvio respuesta vacia' }, { status: 502 })
    return NextResponse.json({ url })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[imagenes] error:', msg)
    // Mensajes amigables a errores comunes de OpenAI.
    if (/insufficient_quota|exceeded.*quota/i.test(msg)) {
      return NextResponse.json({ error: 'Sin saldo en OpenAI. Cargá créditos en platform.openai.com/billing' }, { status: 402 })
    }
    if (/billing.*hard.*limit/i.test(msg)) {
      return NextResponse.json({ error: 'Límite de gasto de OpenAI alcanzado. Subilo en platform.openai.com/billing/limits' }, { status: 402 })
    }
    if (/safety|content.*policy/i.test(msg)) {
      return NextResponse.json({ error: 'OpenAI rechazó el prompt por política de contenido. Probá reformular.' }, { status: 400 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
