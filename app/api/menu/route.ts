import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const business = await prisma.business.findUnique({
      where: { clerkId: userId },
      include: {
        menus: {
          where: { isActive: true },
          include: {
            categories: {
              orderBy: { order: 'asc' },
              include: { items: { orderBy: { order: 'asc' } } },
            },
          },
        },
      },
    })

    return NextResponse.json(business?.menus[0] ?? null)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
