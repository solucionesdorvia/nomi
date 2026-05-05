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
  // Mejora REALISTA con ground truth inyectada (descripcion factual del plato).
  // Recibe `groundTruth` con lo que la imagen REALMENTE contiene para evitar alucinaciones.
  upgrade: (name: string, groundTruth: string) => `
This is a real photograph of food taken with a phone camera. Your task: produce a PHOTOREALISTIC color/light/background retouch of this EXACT same dish. Treat this as professional photo retouching, NOT image generation.

THIS DISH IS (use as ground truth, do NOT deviate):
${groundTruth}

WHAT YOU MUST PRESERVE EXACTLY (any deviation = failed result):
1. SAUCE: identical color, identical type, identical creaminess. If the ground truth says "rosé / pink sauce", keep it pink/orange-cream. Never convert pink sauce to red tomato sauce. Never convert tomato sauce to pink. Never make it more or less creamy.
2. PASTA / GRAINS / BASE: keep the EXACT same type. If it's spaghetti, keep spaghetti — do NOT swap to penne, rice, noodles. If it's rice, keep rice. Same shape, same color, same length.
3. PROTEIN: same cut, same color, same size, same cooking state.
4. TOPPINGS: only the toppings already on the plate. Do NOT add cheese unless it was already there. Do NOT add herbs (parsley, basil, microgreens) unless visible in the photo.
5. FRAME / COMPOSITION: just THIS one dish on the table. NEVER add a second bowl, second plate, side dish, garnish ramekin, salt shaker, glass, cutlery, napkin, or any other object that is not in the original photo. Background must be EMPTY (just the table surface).
6. PLATE / VAJILLA: same color, same shape, same material. Do NOT swap a white plate for a black one or vice versa.

ABSOLUTE NO-GO LIST (these are common AI mistakes — do not make them):
- Adding a second bowl/plate/object to the background
- Adding parsley, microgreens, basil, edible flowers, lemon wedges, sauce drips on the plate rim
- Changing pink/rosé sauce to plain tomato sauce
- Changing the pasta type (spaghetti ↔ penne ↔ rigatoni etc.)
- Adding extra grated cheese or extra ingredients on top
- Making sauces look glossier/wetter/more saturated than they really are
- HDR halos, oversharpening, plastic shine, fake steam, dramatic lighting

WHAT YOU MAY CHANGE (only these, subtly):
- Lighting: soft natural directional light (like near a window). Gentle highlights, soft shadows.
- Background CLEAN-UP: remove fingers, phone cables, brand wrappers, plastic bags, paper towels visible behind the dish. Replace with empty wood/marble/linen surface.
- Color: realistic true-to-life. Slight warmth correction OK, no oversaturation.
- Focus: slight background blur (DOF), crisp food.

GOAL: the result should look like an UNEDITED photo a pro photographer took of THIS EXACT dish. Better light, cleaner background, same food.

Food item declared by the restaurant: ${name}
`.trim(),

  // Explotar con foto como referencia: identifica los ingredientes visibles del plato real
  // y los separa en capas flotantes con etiquetas. El plato sigue siendo el del usuario.
  explotarWithPhoto: (name: string, ingredients: string) => `
This is a real photograph of "${name}". Create a premium exploded-view food infographic where each visible ingredient of THIS exact dish is separated into a floating layer, stacked vertically with even spacing between layers.

ABSOLUTE RULES:
- Use the attached photo as the literal reference. Identify the actual ingredients present in the photo and separate them as layers in the order they appear in the dish (top layer = topping, bottom layer = base).
- Each layer must look photorealistic, made of the SAME ingredient as in the photo (same color, same texture, same cut, same cooking state). Do NOT invent ingredients that are not in the original photo.
- White or very light neutral background. Soft realistic shadows under each layer to give depth.
- Each layer has a small clean text label to the side or below, in a minimal sans-serif font, naming the ingredient in Spanish (rioplatense Argentinian).
- Style: editorial food infographic, premium clean look, like a high-end restaurant brand campaign.
- Photoreal ingredients, NOT illustration or 3D render.

User-provided ingredient list (use as guide; if some are not visible in the photo, omit them; if visible ingredients are missing from the list, include them anyway with proper Spanish names): ${ingredients || '(no provista — usa solo lo que veas en la foto)'}

Output a single composition, vertical stack of floating layers with labels.
`.trim(),

  // Explotar SIN foto (fallback si el user no sube imagen): generacion pura como antes.
  explotar: (name: string, ingredients: string) => `
Create a premium exploded-view food infographic illustration of "${name}".
Show each ingredient as a separate floating layer, stacked vertically with slight spacing between layers.
Each layer should have a clean label with the ingredient name in a minimal sans-serif font (Spanish, rioplatense).
White or very light neutral background. Soft realistic shadows.
Style: clean, modern, editorial food infographic. Photoreal ingredients, not illustration.
Premium quality, suitable for a high-end restaurant menu.
Ingredients to show as layers (in order from top to bottom): ${ingredients}
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

// Inspecciona la foto con Vision (gpt-4o-mini) y devuelve una descripcion FACTUAL
// del plato (ingredientes visibles, vajilla, fondo). Usada como ground truth para
// evitar que el modelo de imagen alucine al retocar.
async function inspectDishWithVision(imageBase64: string, declaredName: string, userIngredients?: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Sos un asistente que describe SOLO los hechos visibles en una foto de comida, en español rioplatense, en formato de bullet list compacto. NO opines, NO inventes, NO uses adjetivos publicitarios. Si algo no se ve con claridad, omitilo o decí "no visible".

Formato exacto de respuesta (lista con guiones, una linea por item, máximo 8 items):
- Comida: [el plato + ingredientes principales que ves separados por comas]
- Topping/garnish: [solo lo que efectivamente está sobre el plato; si no hay, "ninguno visible"]
- Plato/vajilla: [color, forma, material si se distingue]
- Fondo: [superficie sobre la que está apoyado el plato]
- Distracciones a remover: [manos, telefono, cables, etiquetas, otros objetos. Si no hay, "ninguna"]`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `El restaurante declara que este plato es: "${declaredName}".${userIngredients?.trim() ? `\nIngredientes que el dueño confirma: ${userIngredients}` : ''}\n\nDescribí los hechos visibles en la foto.`,
            },
            {
              type: 'image_url',
              image_url: { url: `data:image/png;base64,${imageBase64}`, detail: 'low' },
            },
          ],
        },
      ],
      max_tokens: 250,
      temperature: 0.2,
    })
    return completion.choices[0].message.content?.trim() ?? ''
  } catch (err) {
    console.error('[imagenes] vision inspection error:', err)
    // Si Vision falla, devolvemos al menos el dato declarado por el dueño.
    const parts = [`- Comida: ${declaredName}`]
    if (userIngredients?.trim()) parts.push(`- Ingredientes confirmados por el dueño: ${userIngredients}`)
    return parts.join('\n')
  }
}

type ImageItem = { url?: string | null; b64_json?: string | null }

function pickUrl(item: ImageItem | undefined): string | null {
  if (!item) return null
  if (item.url) return item.url
  if (item.b64_json) return `data:image/png;base64,${item.b64_json}`
  return null
}

type GenResult = { url: string | null; modelUsed: string }

async function generateWithFallback(prompt: string): Promise<GenResult> {
  // Primero intento gpt-image-1 (mejor calidad, gated en muchas cuentas).
  try {
    const res = await openai.images.generate({
      model: 'gpt-image-1',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'high',
    })
    console.log('[imagenes] generate model: gpt-image-1')
    return { url: pickUrl(res.data?.[0]), modelUsed: 'gpt-image-1' }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (/model_not_found|do not have access|not_found/i.test(msg)) {
      console.warn('[imagenes] gpt-image-1 no disponible, fallback a dall-e-3:', msg)
      const res = await openai.images.generate({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
        quality: 'hd',
      })
      return { url: pickUrl(res.data?.[0]), modelUsed: 'dall-e-3 (fallback)' }
    }
    throw err
  }
}

async function editWithFallback(prompt: string, imageBase64: string): Promise<GenResult> {
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
    console.log('[imagenes] edit model: gpt-image-1')
    return { url: pickUrl(res.data?.[0]), modelUsed: 'gpt-image-1' }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (/model_not_found|do not have access|not_found/i.test(msg)) {
      console.warn('[imagenes] gpt-image-1 edit no disponible, fallback a dall-e-2:', msg)
      const fileFallback = await toFile(buf, 'input.png', { type: 'image/png' })
      const res = await openai.images.edit({
        model: 'dall-e-2',
        image: fileFallback,
        prompt,
        n: 1,
        size: '1024x1024',
      })
      return { url: pickUrl(res.data?.[0]), modelUsed: 'dall-e-2 (fallback - calidad limitada, reimagina mas)' }
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

    // Validacion de tamaño max para todas las imagenes que vienen del cliente.
    if (data.imageBase64 && data.imageBase64.length > MAX_BASE64_BYTES) {
      return NextResponse.json({ error: 'La imagen supera 25MB. Subi una version mas chica.' }, { status: 413 })
    }
    if (data.mode === 'upgrade' && !data.imageBase64) {
      return NextResponse.json({ error: 'Subi una foto para usar el modo "Mejorar foto"' }, { status: 400 })
    }
    if (data.mode === 'explotar' && !data.imageBase64) {
      return NextResponse.json({ error: 'Subi una foto del plato para usar el modo "Explotar ingredientes"' }, { status: 400 })
    }
    if (data.mode === 'generar' && !data.ingredients?.trim()) {
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
      case 'upgrade': {
        // Vision pass: describe lo que la foto realmente contiene, asi al
        // pasar a images.edit el modelo no alucina ni agrega cosas.
        const groundTruth = data.imageBase64
          ? await inspectDishWithVision(data.imageBase64, itemName, ingredients)
          : `- Comida: ${itemName}${ingredients ? `\n- Ingredientes confirmados por el dueño: ${ingredients}` : ''}`
        prompt = PROMPTS.upgrade(itemName, groundTruth)
        break
      }
      case 'explotar':
        prompt = data.imageBase64
          ? PROMPTS.explotarWithPhoto(itemName, ingredients)
          : PROMPTS.explotar(itemName, ingredients)
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

    // Cualquier modo con foto adjunta usa images.edit (foto como referencia).
    // Sin foto cae a images.generate.
    let result: GenResult
    if (data.imageBase64 && (data.mode === 'upgrade' || data.mode === 'branded' || data.mode === 'explotar')) {
      result = await editWithFallback(prompt, data.imageBase64)
    } else {
      result = await generateWithFallback(prompt)
    }

    if (!result.url) return NextResponse.json({ error: 'OpenAI devolvio respuesta vacia' }, { status: 502 })
    return NextResponse.json({ url: result.url, modelUsed: result.modelUsed })
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
