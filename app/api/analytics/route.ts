import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const trackSchema = z.object({
  slug: z.string(),
  event: z.enum(['menu_view', 'item_view', 'item_click', 'search']),
  itemId: z.string().optional(),
  device: z.string().optional(),
})

// POST — trackear evento (público, desde el menú del cliente)
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = trackSchema.parse(body)

    const business = await prisma.business.findUnique({
      where: { slug: data.slug },
      select: { id: true },
    })
    if (!business) return NextResponse.json({ ok: false })

    await prisma.analytics.create({
      data: {
        businessId: business.id,
        event: data.event,
        itemId: data.itemId,
        device: data.device,
      },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}

// GET — obtener datos para el dashboard (protegido)
export async function GET(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const business = await prisma.business.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    })
    if (!business) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get('days') ?? '30')
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const [total, byEvent, byDay, topItems] = await Promise.all([
      // Total de vistas del menú
      prisma.analytics.count({
        where: { businessId: business.id, event: 'menu_view', createdAt: { gte: since } },
      }),

      // Por tipo de evento
      prisma.analytics.groupBy({
        by: ['event'],
        where: { businessId: business.id, createdAt: { gte: since } },
        _count: { _all: true },
      }),

      // Por día (últimos N días)
      prisma.$queryRaw<{ day: string; count: number }[]>`
        SELECT DATE(created_at) as day, COUNT(*)::int as count
        FROM analytics
        WHERE business_id = ${business.id}
          AND event = 'menu_view'
          AND created_at >= ${since}
        GROUP BY DATE(created_at)
        ORDER BY day ASC
      `,

      // Top platos más vistos
      prisma.analytics.groupBy({
        by: ['itemId'],
        where: {
          businessId: business.id,
          event: 'item_view',
          itemId: { not: null },
          createdAt: { gte: since },
        },
        _count: { _all: true },
        orderBy: { _count: { itemId: 'desc' } },
        take: 5,
      }),
    ])

    // Resolver nombres de los top items
    const itemIds = topItems.map(t => t.itemId).filter(Boolean) as string[]
    const items = await prisma.item.findMany({
      where: { id: { in: itemIds } },
      select: { id: true, name: true, price: true },
    })
    const itemMap = Object.fromEntries(items.map(i => [i.id, i]))

    const topItemsWithName = topItems.map(t => ({
      ...itemMap[t.itemId!],
      views: t._count._all,
    }))

    // Dispositivos
    const byDevice = await prisma.analytics.groupBy({
      by: ['device'],
      where: { businessId: business.id, event: 'menu_view', createdAt: { gte: since } },
      _count: { _all: true },
    })

    return NextResponse.json({
      totalViews: total,
      byEvent,
      byDay,
      topItems: topItemsWithName,
      byDevice,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
