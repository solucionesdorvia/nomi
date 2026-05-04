import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  categoryId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.string().or(z.number()),
  tags: z.array(z.string()).optional(),
})

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const data = schema.parse(body)
    const count = await prisma.item.count({ where: { categoryId: data.categoryId } })

    const item = await prisma.item.create({
      data: {
        categoryId: data.categoryId,
        name: data.name,
        description: data.description,
        price: Number(data.price),
        tags: data.tags ?? [],
        order: count,
      },
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
