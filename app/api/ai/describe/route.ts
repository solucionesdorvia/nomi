import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { z } from 'zod'

const schema = z.object({
  name: z.string(),
  category: z.string().optional(),
})

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { name, category } = schema.parse(body)

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Sos un experto en redacción gastronómica para menús de restaurantes argentinos. Escribís descripciones cortas (máximo 15 palabras), apetitosas y precisas. Sin emojis. En español rioplatense.',
        },
        {
          role: 'user',
          content: `Generá una descripción para: "${name}"${category ? ` (categoría: ${category})` : ''}`,
        },
      ],
      max_tokens: 60,
      temperature: 0.8,
    })

    const description = completion.choices[0].message.content?.trim() ?? ''
    return NextResponse.json({ description })
  } catch (error) {
    console.error('AI description error:', error)
    return NextResponse.json({ error: 'Error al generar descripción' }, { status: 500 })
  }
}
