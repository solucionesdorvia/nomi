import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Replicate from 'replicate'
import { z } from 'zod'

const schema = z.object({
  imageUrl: z.string().url(),
  itemId: z.string(),
})

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { imageUrl, itemId } = schema.parse(body)

    // Usar Real-ESRGAN para mejorar calidad de foto + claridad
    // Modelo: nightmareai/real-esrgan - upscale + enhance
    const output = await replicate.run(
      'nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b',
      {
        input: {
          image: imageUrl,
          scale: 2,
          face_enhance: false,
        },
      }
    )

    const enhancedUrl = (Array.isArray(output) ? output[0] : output) as unknown as string

    // Guardar URL mejorada en DB
    await prisma.item.update({
      where: { id: itemId },
      data: { imageAiUrl: enhancedUrl },
    })

    return NextResponse.json({ url: enhancedUrl })
  } catch (error) {
    console.error('AI enhance error:', error)
    return NextResponse.json({ error: 'Error al mejorar la imagen' }, { status: 500 })
  }
}
