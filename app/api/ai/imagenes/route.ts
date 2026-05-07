import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import OpenAI, { toFile } from 'openai'
import { z } from 'zod'
import { generateImageWithFlux, isFluxAvailable } from '@/lib/flux'
import {
  dataUrlFromRawBase64,
  enhanceBase64WithRealEsrgan,
  enhanceToCdnUrlWithRealEsrgan,
  isRealEsrganAvailable,
  uploadMetaFromRawBase64,
} from '@/lib/real-esrgan'

export const runtime = 'nodejs'
// gpt-image-1 puede tardar ~60s; subimos el limite del handler.
export const maxDuration = 120

const schema = z.object({
  mode: z.enum(['nitido', 'upgrade', 'explotar', 'generar', 'branded']),
  imageBase64: z.string().optional(),
  itemName: z.string().min(1).max(120),
  ingredients: z.string().max(800).optional(),
})

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Marca: modo sutil para retouch (no re-pintar la comida ni el plato).
function brandingContextPhotoRetouch(args: {
  businessName: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  style: string
}): string {
  return `
BRAND (background only — invisible on the food itself):
- Venue: ${args.businessName}
- Style: ${args.style}
- Allowed: a very subtle tint (5–12% opacity) of ${args.secondaryColor} on out-of-focus tabletop only. Optional hint of ${args.primaryColor} in deep shadow areas of the background blur.
- Forbidden: strong color grades, fake studio sets, props, patterns, logos, or any color cast on the dish.
`.trim()
}

// Marca completa para generación desde cero / branded / explotar arte.
function brandingContext(args: {
  businessName: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  style: string
}): string {
  return `
BRAND CONTEXT — apply these to background and styling of the result:
- Restaurant name: ${args.businessName}
- Brand primary color (subtle background tint / shadows): ${args.primaryColor}
- Brand secondary color (main surface): ${args.secondaryColor}
- Brand accent (warm highlights away from food): ${args.accentColor}
- Brand style direction: ${args.style}
The food itself is NEVER recolored to match the brand — natural colors only. Brand shows in environment and mood.
`.trim()
}

const PHOTO_REAL_TAIL = `
VISUAL DNA (mandatory):
Authentic smartphone or DSLR food photo: natural sRGB colors, sensor noise in shadows, micro texture in sauces, slight optical imperfections, plausible depth of field.
NOT: CGI, 3D render, cartoon, illustration, plastic specular, AI oversharpen halos, HDR glow, synthetic steam, perfect symmetry.
`.trim()

const FLUX_PHOTO_TAIL =
  ' Photorealistic DSLR food photo, 50mm lens, natural window side-light, faint film grain, true-to-life imperfections, chef-made plating — absolutely not CGI, not 3D, not illustration.'

const PROMPTS = {
  // Retoque mínimo — API usa input_fidelity=high sobre la foto entrante.
  upgrade: (name: string, groundTruth: string, brand: string) => `
You are editing a REAL camera photo provided as input.

MODE: Minimal in-painting photo retouch ONLY. The diner must perceive this as THE SAME untouched dish from the SAME shoot — never a remake.

GROUND TRUTH (do not contradict):
${groundTruth}

NON-NEGOTIABLE:
- Preserve pixel-level identity: fork angle, crumble edges, splash shape, garnish placement, reflections, imperfections.
- Do NOT replace the dish, do NOT "improve recipes", do NOT add cheese/herbs/lemon/objects.
- Sauce color and type LOCKED per ground truth.

ALLOWED MICRO-ADJUSTMENTS:
- Exposure: at most subtle correction; lift shadows slightly; tame blown highlights on white plates only.
- White balance: small neutral correction if visibly off.
- Remove ONLY clutter: fingers, phone, cables, packaging, obvious trash outside the plate edge.
- Background: extend/blur ONLY out-of-focus regions with a clean surface matching BRAND (no props).

FORBIDDEN:
- Repainting food texture, beauty filters, "AI polish", extra gloss/wet look, fake steam, new ingredients.

${brand}

Declared menu name (reference only): ${name}

${PHOTO_REAL_TAIL}
`.trim(),

  // PARTE desde la foto del usuario (images.edit).
  explotarWithPhoto: (name: string, ingredientsList: string, visionFacts: string, brand: string) => {
    const list = ingredientsList
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(Boolean)
    const count = list.length
    const numbered = count > 0
      ? list.map((ing, i) => `${i + 1}. ${ing}`).join('\n')
      : '(lista vacía — usa solo ingredientes coherentes con la foto)'

    const visionBlock = visionFacts.trim()
      ? `
============================
HECHOS VISUALES CONFIRMADOS (no contradecir las capas ni inventar elementos)
============================
${visionFacts.trim()}
`
      : ''

    return `
Exploded-ingredient DIAGRAM derived from THIS EXACT SOURCE PHOTO of "${name}".

============================
STACK LIST (${count} capas — orden arriba → abajo — CONTEO EXACTO ${count})
============================
${numbered}
${visionBlock}

============================
HARD RULES
============================
1. EXACTAMENTE ${count} capas ingrediente. Ni más ni menos.
2. Cada capa debe coincidir con la lista en orden vertical.
3. Cada ingrediente debe verse como MATERIAL DE LA MISMA SESIÓN FOTOGRÁFICA QUE LA FOTO DE ENTRADA: mismos colores, misma cocción, misma superficie rugosa/brillo — copied from reality, NOT generic stock CGI.
4. Etiquetas en español, sans serif legible, a la derecha con línea conectora.
5. Mantener apariencia fotorreal; NO render 3D, NO glossy plástico.
6. Separar físicamente en Z (float) pero sin cambiar tipo de ingrediente por otro más "lindo".

============================
${brand}
============================

${PHOTO_REAL_TAIL}

Final: ONE image, EXACTAMENTE ${count} capas etiquetadas.
`.trim()
  },

  // Explotar SIN foto (fallback si el user no sube imagen): generacion pura.
  explotar: (name: string, ingredients: string, brand: string) => {
    const list = ingredients
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(Boolean)
    const count = list.length
    const numbered = count > 0
      ? list.map((ing, i) => `${i + 1}. ${ing}`).join('\n')
      : '(vacio)'

    return `
Create a PHOTOREALISTIC exploded-view image of "${name}".

============================
INGREDIENTS LIST (${count} items, in stacking order top → bottom)
============================
${numbered}

============================
HARD CONSTRAINTS (must obey)
============================
1. Show EXACTLY ${count} layers. NOT more, NOT less. Count them: ${count}.
2. Each layer = one of the ${count} ingredients listed above, in that exact order.
3. Each layer has a VISIBLE TEXT LABEL with the Spanish ingredient name. Text must be readable (clear sans-serif, dark color).
4. NO duplicate layers, NO extra ingredients. If list says "Pan, Tomate, Lechuga, Carne, Queso, Pan" → 2 buns total, 1 tomato, 1 lettuce, 1 patty, 1 cheese. Not more.

============================
PHOTOREALISM
============================
- Each ingredient looks like a REAL photograph, not 3D, not CGI, not illustration.
- Real textures: real bread crumb, real cheese melt, real meat grain.
- No plastic shine, no oversaturation.

============================
LAYOUT
============================
- Vertical stack of ${count} layers, evenly spaced, centered.
- Label to the right of each ingredient, same horizontal row.
- Thin horizontal connector line from ingredient to label.
- Sans-serif Spanish labels.

============================
${brand}
============================

${PHOTO_REAL_TAIL}

Final output: ONE photoreal composition with EXACTLY ${count} ingredient layers and ${count} visible Spanish text labels.
`.trim()
  },

  generar: (name: string, ingredients: string, brand: string) => `
Create a PHOTOREALISTIC food photography image of "${name}".

Photorealism is mandatory:
- This must look like an UNEDITED PHOTO taken by a professional food photographer with a real camera and real lighting. NOT 3D render, NOT CGI, NOT illustration, NOT digital painting.
- Real food textures with natural imperfections (asymmetric cuts, uneven edges, real grain, real surface variation).
- No plastic shine, no oversaturation, no HDR halos, no artificial glow.

Ingredients present: ${ingredients}

Plating and styling:
- Elegant restaurant presentation on a real ceramic or wooden plate.
- Soft natural-feeling directional lighting (window-light look), gentle shadows.
- Composition: food centered, slight off-axis angle for natural feel, slight background blur (DOF).
- Background and surface tone aligned with the BRAND CONTEXT below.

${brand}

No text on the image. No watermarks. Just real-looking food.

${PHOTO_REAL_TAIL}
`.trim(),

  branded: (name: string, brand: string) => `
Create a PHOTOREALISTIC branded food image: this restaurant's signature dish "${name}" presented as a campaign-ready photo for the restaurant's own Instagram feed.

Photorealism mandatory:
- Looks like a real photograph by a pro food photographer, NOT a 3D render, NOT CGI, NOT illustration.
- Real food textures, real surface imperfections, real lighting.

${brand}

Composition:
- Food is the hero, centered, photorealistic.
- Background carries the brand colors and style as a subtle environment (e.g. wood for rustic brand, white marble for minimalist, vibrant solid color wash for bold brand).
- Leave some negative space (top or side) where the restaurant could overlay text later.
- Cinematic but realistic lighting — not Hollywood dramatic, just professional.

No text in the image. Make it look irresistible and on-brand.

${PHOTO_REAL_TAIL}
`.trim(),
}

// Limite duro de 25MB por imagen base64 (mas que eso OpenAI lo rechaza).
const MAX_BASE64_BYTES = 25 * 1024 * 1024 * (4 / 3)

// Inspecciona la foto con Vision (gpt-4o-mini) y devuelve una descripcion FACTUAL
// del plato (ingredientes visibles, vajilla, fondo). Usada como ground truth para
// evitar que el modelo de imagen alucine al retocar.
async function inspectDishWithVision(
  imageBase64: string,
  declaredName: string,
  userIngredients: string | undefined,
  detail: 'low' | 'high',
): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Sos un asistente que describe SOLO los hechos visibles en una foto de comida, en español rioplatense, en formato de bullet list compacto. NO opines, NO inventes, NO uses adjetivos publicitarios. Si algo no se ve con claridad, omitilo o decí "no visible".

Formato exacto de respuesta (lista con guiones, una linea por item, máximo 10 items):
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
              image_url: { url: dataUrlFromRawBase64(imageBase64), detail },
            },
          ],
        },
      ],
      max_tokens: detail === 'high' ? 380 : 250,
      temperature: 0.15,
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

// Generacion pura (text-to-image). Estrategia segun preferencia:
//   - 'flux'    : intenta Flux Pro 1.1 primero, fallback a OpenAI si falla.
//   - 'openai'  : intenta gpt-image-1 primero, fallback a dall-e-3.
async function generateWithFallback(prompt: string, preferred: 'flux' | 'openai' = 'openai'): Promise<GenResult> {
  const fullPrompt = `${prompt}\n\n${PHOTO_REAL_TAIL}`
  const fluxPrompt = `${prompt}${FLUX_PHOTO_TAIL}`

  if (preferred === 'flux' && isFluxAvailable()) {
    try {
      const url = await generateImageWithFlux(fluxPrompt)
      console.log('[imagenes] generate model: flux-1.1-pro (replicate)')
      return { url, modelUsed: 'flux-1.1-pro (replicate)' }
    } catch (err) {
      console.warn('[imagenes] Flux fallo, fallback a OpenAI:', err instanceof Error ? err.message : err)
    }
  }

  for (const model of ['gpt-image-1.5', 'gpt-image-1'] as const) {
    try {
      const res = await openai.images.generate({
        model,
        prompt: fullPrompt,
        n: 1,
        size: '1024x1024',
        quality: 'high',
      })
      const url = pickUrl(res.data?.[0])
      if (url) {
        console.log(`[imagenes] generate model: ${model}`)
        return { url, modelUsed: model }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (/model_not_found|do not have access|not_found/i.test(msg)) {
        console.warn(`[imagenes] ${model} no disponible, siguiente opción:`, msg)
        continue
      }
      console.warn(`[imagenes] generate ${model} error:`, msg)
      throw err
    }
  }

  try {
    const res = await openai.images.generate({
      model: 'dall-e-3',
      prompt: fullPrompt,
      n: 1,
      size: '1024x1024',
      quality: 'hd',
      style: 'natural',
    })
    console.log('[imagenes] generate model: dall-e-3 natural')
    return { url: pickUrl(res.data?.[0]), modelUsed: 'dall-e-3 (fallback, style=natural)' }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[imagenes] dall-e-3 también falló:', msg)
    throw err
  }
}

async function editWithFallback(prompt: string, imageBase64: string): Promise<GenResult> {
  const buf = Buffer.from(imageBase64, 'base64')
  if (buf.byteLength > 25 * 1024 * 1024) {
    throw new Error('La imagen supera 25MB. Subi una version mas chica.')
  }
  const meta = uploadMetaFromRawBase64(imageBase64)

  const runGptEdit = async (model: 'gpt-image-1.5' | 'gpt-image-1') => {
    const file = await toFile(buf, meta.filename, { type: meta.type })
    const res = await openai.images.edit({
      model,
      image: file,
      prompt,
      n: 1,
      size: '1024x1024',
      input_fidelity: 'high',
      quality: 'high',
      background: 'opaque',
    })
    return pickUrl(res.data?.[0])
  }

  try {
    const url = await runGptEdit('gpt-image-1.5')
    if (!url) throw new Error('empty response')
    console.log('[imagenes] edit model: gpt-image-1.5 (input_fidelity=high)')
    return { url, modelUsed: 'gpt-image-1.5 edit (high fidelity)' }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (!/model_not_found|do not have access|not_found/i.test(msg)) {
      console.warn('[imagenes] gpt-image-1.5 edit fallo, pruebo gpt-image-1:', msg)
    }
  }

  try {
    const url = await runGptEdit('gpt-image-1')
    if (!url) throw new Error('empty response')
    console.log('[imagenes] edit model: gpt-image-1 (input_fidelity=high)')
    return { url, modelUsed: 'gpt-image-1 edit (high fidelity)' }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (/model_not_found|do not have access|not_found/i.test(msg)) {
      console.warn('[imagenes] GPT image edit no disponible, fallback a dall-e-2:', msg)
      const fileFallback = await toFile(buf, meta.filename, { type: meta.type })
      const res = await openai.images.edit({
        model: 'dall-e-2',
        image: fileFallback,
        prompt,
        n: 1,
        size: '1024x1024',
      })
      return {
        url: pickUrl(res.data?.[0]),
        modelUsed: 'dall-e-2 (fallback — menor fidelidad al original)',
      }
    }
    throw err
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const data = schema.parse(body)

    // Validacion de tamaño max para todas las imagenes que vienen del cliente.
    if (data.imageBase64 && data.imageBase64.length > MAX_BASE64_BYTES) {
      return NextResponse.json({ error: 'La imagen supera 25MB. Subi una version mas chica.' }, { status: 413 })
    }
    if (data.mode === 'nitido' && !data.imageBase64) {
      return NextResponse.json({ error: 'Subí una foto para usar "Solo nitidez"' }, { status: 400 })
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

    if (data.mode === 'nitido') {
      if (!isRealEsrganAvailable()) {
        return NextResponse.json(
          {
            error:
              'Modo "Solo nitidez" usa Replicate (Real-ESRGAN). Agregá REPLICATE_API_TOKEN en el servidor.',
          },
          { status: 503 },
        )
      }
      const url = await enhanceToCdnUrlWithRealEsrgan(data.imageBase64!)
      if (!url) {
        return NextResponse.json(
          {
            error:
              'Real-ESRGAN no pudo procesar la imagen. Probá otra foto, otro formato o reintentá en unos segundos.',
          },
          { status: 502 },
        )
      }
      return NextResponse.json({
        url,
        modelUsed: 'Real-ESRGAN ×2 — solo nitidez, sin IA generativa',
      })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY no configurada en el servidor' }, { status: 500 })
    }

    const branding = business.branding
    const itemName = data.itemName
    const ingredients = data.ingredients ?? ''

    const brandFull = brandingContext({
      businessName: business.name,
      primaryColor: branding?.primaryColor ?? '#1a1a1a',
      secondaryColor: branding?.secondaryColor ?? '#ffffff',
      accentColor: branding?.accentColor ?? '#FF6B35',
      style: branding?.style ?? 'modern',
    })

    const brandPhoto = brandingContextPhotoRetouch({
      businessName: business.name,
      primaryColor: branding?.primaryColor ?? '#1a1a1a',
      secondaryColor: branding?.secondaryColor ?? '#ffffff',
      accentColor: branding?.accentColor ?? '#FF6B35',
      style: branding?.style ?? 'modern',
    })

    let prompt = ''
    let useFlux = false
    let useEditWithPhoto = false
    let preprocessTag = ''
    let imageForEdit: string | undefined = data.imageBase64

    switch (data.mode) {
      case 'upgrade': {
        if (!imageForEdit) break
        if (isRealEsrganAvailable()) {
          const sharpened = await enhanceBase64WithRealEsrgan(imageForEdit)
          if (sharpened) {
            const size = Buffer.from(sharpened, 'base64').byteLength
            if (size <= 22 * 1024 * 1024) {
              imageForEdit = sharpened
              preprocessTag = 'Real-ESRGAN → '
            }
          }
        }
        const groundTruth = await inspectDishWithVision(imageForEdit, itemName, ingredients, 'high')
        prompt = PROMPTS.upgrade(itemName, groundTruth, brandPhoto)
        useEditWithPhoto = true
        break
      }
      case 'explotar': {
        if (!data.imageBase64) break
        const visionFacts = await inspectDishWithVision(
          data.imageBase64,
          itemName,
          ingredients,
          'high',
        )
        prompt = PROMPTS.explotarWithPhoto(itemName, ingredients.trim(), visionFacts, brandFull)
        useEditWithPhoto = true
        break
      }
      case 'generar':
        prompt = PROMPTS.generar(itemName, ingredients, brandFull)
        useFlux = true
        break
      case 'branded':
        prompt = PROMPTS.branded(itemName, brandFull)
        useFlux = true
        useEditWithPhoto = Boolean(data.imageBase64)
        break
    }

    let result: GenResult
    if (useEditWithPhoto && imageForEdit) {
      result = await editWithFallback(prompt, imageForEdit)
    } else if (useFlux) {
      result = await generateWithFallback(prompt, 'flux')
    } else {
      result = await generateWithFallback(prompt, 'openai')
    }

    if (!result.url) return NextResponse.json({ error: 'OpenAI devolvio respuesta vacia' }, { status: 502 })
    return NextResponse.json({ url: result.url, modelUsed: preprocessTag + result.modelUsed })
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
