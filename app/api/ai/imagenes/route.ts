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

// Construye un bloque de contexto de marca que se inyecta en TODOS los prompts.
// Asi cada imagen generada respeta los colores, estilo y "feel" del local.
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
- Brand primary color (use as subtle background tint or accent on shadows): ${args.primaryColor}
- Brand secondary color (use as main background or empty surface): ${args.secondaryColor}
- Brand accent color (use sparingly for warmth highlights, never on the food itself): ${args.accentColor}
- Brand style direction: ${args.style} (e.g. modern = clean minimal, rustic = warm wood textures, classic = elegant linen, minimalist = stark white, vibrant = saturated bold)
The food itself is NEVER recolored to match the brand — it keeps its true natural colors. Brand colors only appear in the background, surface, light tone, and overall mood.
`.trim()
}

const PROMPTS = {
  // Mejora REALISTA con ground truth inyectada (descripcion factual del plato).
  // Recibe `groundTruth` con lo que la imagen REALMENTE contiene para evitar alucinaciones.
  upgrade: (name: string, groundTruth: string, brand: string) => `
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
- Background CLEAN-UP: remove fingers, phone cables, brand wrappers, plastic bags, paper towels visible behind the dish. Replace with a surface that matches the BRAND CONTEXT below (color tone + style direction).
- Color: realistic true-to-life on the food. Background can carry a subtle tint matching the brand secondary color.
- Focus: slight background blur (DOF), crisp food.

${brand}

GOAL: the result should look like an UNEDITED photo a pro photographer took of THIS EXACT dish, in a background that subtly references the restaurant's brand. Better light, cleaner background, same food.

Food item declared by the restaurant: ${name}
`.trim(),

  // Explotar con foto como referencia: identifica los ingredientes visibles del plato real
  // y los separa en capas flotantes con etiquetas. El plato sigue siendo el del usuario.
  explotarWithPhoto: (name: string, ingredients: string, brand: string) => {
    // Convertimos la lista a una numeracion explicita para que el modelo
    // entienda 1-a-1 que ingrediente va con que label, en orden.
    const list = ingredients
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(Boolean)
    const numbered = list.length > 0
      ? list.map((ing, i) => `  ${i + 1}. ${ing}`).join('\n')
      : '  (no provista — usa solo lo que veas en la foto, en orden top → bottom)'

    return `
This is a real photograph of "${name}". Create a PHOTOREALISTIC exploded-view image where each visible ingredient is shown as a separate floating layer, stacked vertically with even spacing between layers.

CRITICAL — EACH INGREDIENT MUST LOOK LIKE A REAL PHOTOGRAPH:
- Each layer must appear as if photographed individually with a professional camera, then composited. NOT 3D rendered, NOT CGI, NOT illustration, NOT digital painting, NOT clay-like, NOT plastic.
- Real food textures: bread with visible crumb and real grain. Cheese like real melted/fresh cheese, not plastic toy. Meat with real grill marks, juices, fibers. Lettuce with real leaf veins. Tomato with real seeds.
- Real food is asymmetric: tomato slice not a perfect circle, burger patty has uneven edges, lettuce irregular.
- NO glossy plastic shine. NO oversaturated colors. NO symmetric perfection.

INGREDIENT-LABEL MAPPING (CRITICAL — must follow exactly in this order):
${numbered}

LABEL PLACEMENT RULES (CRITICAL — most common AI failure is mismatching):
- The number of labels MUST equal the number of ingredient layers. No extra labels, no missing labels.
- Layer #1 in the list above = TOPMOST layer in the image. Last layer in the list = BOTTOMMOST in the image.
- Each label is placed on the RIGHT side of the image, on the SAME HORIZONTAL ROW as the center of its ingredient layer (same Y coordinate, same vertical height).
- Draw a thin horizontal connector line from each ingredient layer to its label, so it's visually obvious which label belongs to which ingredient.
- Labels are aligned in a vertical column on the right.
- DO NOT shift labels up or down by one slot. Each label is at the EXACT vertical center of its corresponding ingredient.
- Sans-serif font, low emphasis, dark color over light background. Spanish (rioplatense Argentinian) names.

LAYOUT:
- Image canvas split visually: left ~65% has the stacked ingredients, right ~35% has the column of labels.
- Even vertical spacing between layers. Soft realistic shadows under each layer matching the brand background tone, NOT pure black.

${brand}

Output: single photoreal composition. Vertical stack of REAL-LOOKING ingredients on the left, perfectly aligned column of labels on the right, each label on the same row as its ingredient, on a brand-aligned background.
`.trim()
  },

  // Explotar SIN foto (fallback si el user no sube imagen): generacion pura.
  explotar: (name: string, ingredients: string, brand: string) => {
    const list = ingredients
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(Boolean)
    const numbered = list.length > 0
      ? list.map((ing, i) => `  ${i + 1}. ${ing}`).join('\n')
      : '  (vacio)'

    return `
Create a PHOTOREALISTIC exploded-view image of "${name}". Each ingredient appears as if photographed separately with a pro camera and composited into a vertical stack with labels.

Photorealism rules (critical):
- Each ingredient must look like a REAL photograph, not 3D render, not CGI, not illustration.
- Real textures: real bread crumb, real cheese melt, real meat grain, real vegetable surface with imperfections.
- Avoid AI "perfect rounded smooth" aesthetic. Real food is asymmetric.
- No plastic shine, no oversaturation.

INGREDIENT-LABEL MAPPING (CRITICAL — must follow in this order, top → bottom):
${numbered}

LABEL PLACEMENT RULES (CRITICAL):
- The number of labels MUST equal the number of ingredient layers above. No extras, no missing.
- Layer #1 = TOPMOST. Last layer = BOTTOMMOST.
- Each label on the RIGHT, on the SAME HORIZONTAL ROW as its ingredient (same Y coordinate, same vertical height).
- Thin horizontal connector line from each ingredient to its label.
- DO NOT shift labels by one slot. Exact vertical alignment per ingredient.
- Sans-serif, low emphasis, Spanish rioplatense.

LAYOUT:
- Left ~65%: stacked ingredients with even spacing.
- Right ~35%: column of labels, perfectly aligned with their ingredients.
- Background and surface tone follow the BRAND CONTEXT below.
- Soft realistic shadows matching the brand background tone.

${brand}
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

    // Branding context que se inyecta en TODOS los prompts: aplica al fondo,
    // tono de superficie y estilo de la imagen final, sin alterar el color real
    // de la comida.
    const brand = brandingContext({
      businessName: business.name,
      primaryColor: branding?.primaryColor ?? '#1a1a1a',
      secondaryColor: branding?.secondaryColor ?? '#ffffff',
      accentColor: branding?.accentColor ?? '#FF6B35',
      style: branding?.style ?? 'modern',
    })

    let prompt = ''
    switch (data.mode) {
      case 'upgrade': {
        // Vision pass: describe lo que la foto realmente contiene, asi al
        // pasar a images.edit el modelo no alucina ni agrega cosas.
        const groundTruth = data.imageBase64
          ? await inspectDishWithVision(data.imageBase64, itemName, ingredients)
          : `- Comida: ${itemName}${ingredients ? `\n- Ingredientes confirmados por el dueño: ${ingredients}` : ''}`
        prompt = PROMPTS.upgrade(itemName, groundTruth, brand)
        break
      }
      case 'explotar':
        prompt = data.imageBase64
          ? PROMPTS.explotarWithPhoto(itemName, ingredients, brand)
          : PROMPTS.explotar(itemName, ingredients, brand)
        break
      case 'generar':
        prompt = PROMPTS.generar(itemName, ingredients, brand)
        break
      case 'branded':
        prompt = PROMPTS.branded(itemName, brand)
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
