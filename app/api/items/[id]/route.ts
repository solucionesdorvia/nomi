import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const { price, ...rest } = body

    const item = await prisma.item.update({
      where: { id },
      data: {
        ...rest,
        ...(price !== undefined ? { price: Number(price) } : {}),
      },
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    await prisma.item.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
