import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'
import { z } from 'zod'

const schema = z.object({
  type: z.enum(['instagram_post', 'instagram_story', 'whatsapp_status', 'promo']),
  itemId: z.string().optional(),
  customText: z.string().optional(),
  tone: z.enum(['formal', 'casual', 'entusiasta', 'minimalista']).default('casual'),
})

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const TYPE_PROMPTS = {
  instagram_post: 'post de Instagram (caption + hashtags, máximo 150 caracteres + 10 hashtags relevantes)',
  instagram_story: 'texto para story de Instagram (muy corto, máximo 3 líneas, impactante, con emojis)',
  whatsapp_status: 'estado de WhatsApp Business (corto, informal, máximo 2 líneas)',
  promo: 'texto de promoción especial (urgencia, oferta, llamada a la acción)',
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { type, itemId, customText, tone } = schema.parse(body)

    const business = await prisma.business.findUnique({
      where: { clerkId: userId },
      include: { branding: true },
    })
    if (!business) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    let itemContext = ''
    if (itemId) {
      const item = await prisma.item.findUnique({
        where: { id: itemId },
        include: { category: true },
      })
      if (item) {
        itemContext = `Plato: ${item.name}. Precio: $${item.price}. Descripción: ${item.description ?? 'sin descripción'}. Categoría: ${item.category.name}.`
      }
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Sos un experto en marketing gastronómico para redes sociales en Argentina. 
Escribís en español rioplatense. Tono: ${tone}.
Local: "${business.name}".
${itemContext}
${customText ? `Contexto adicional: ${customText}` : ''}
Generá un ${TYPE_PROMPTS[type]}.
Respondé SOLO con el texto, sin explicaciones ni comillas.`,
        },
        { role: 'user', content: `Generá el contenido para ${TYPE_PROMPTS[type]}.` },
      ],
      max_tokens: 200,
      temperature: 0.85,
    })

    const content = completion.choices[0].message.content?.trim() ?? ''

    // Variaciones — generar 3 opciones
    const variations = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Generá 2 variaciones MÁS del siguiente texto para redes sociales, separadas por "---".
Texto original: "${content}"
Local: "${business.name}". Tono: ${tone}.
Solo las variaciones, sin texto adicional.`,
        },
        { role: 'user', content: 'Generá las variaciones.' },
      ],
      max_tokens: 300,
      temperature: 0.9,
    })

    const variationTexts = (variations.choices[0].message.content ?? '')
      .split('---')
      .map(v => v.trim())
      .filter(Boolean)

    return NextResponse.json({
      content,
      variations: [content, ...variationTexts],
    })
  } catch (error) {
    console.error('Social AI error:', error)
    return NextResponse.json({ error: 'Error al generar contenido' }, { status: 500 })
  }
}
