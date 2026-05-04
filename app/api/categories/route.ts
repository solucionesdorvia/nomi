import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  menuId: z.string(),
  name: z.string().min(1),
  emoji: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const data = schema.parse(body)

    const count = await prisma.category.count({ where: { menuId: data.menuId } })

    const category = await prisma.category.create({
      data: { ...data, order: count },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
