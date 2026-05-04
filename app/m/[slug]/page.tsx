import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import MenuClient from './MenuClient'

export default async function MenuPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const business = await prisma.business.findUnique({
    where: { slug },
    include: {
      branding: true,
      menus: {
        where: { isActive: true, isPublic: true },
        include: {
          categories: {
            where: { isActive: true },
            orderBy: { order: 'asc' },
            include: {
              items: {
                where: { isActive: true },
                orderBy: [{ isFeatured: 'desc' }, { order: 'asc' }],
              },
            },
          },
        },
      },
    },
  })

  if (!business || !business.menus[0]) notFound()

  return <MenuClient slug={slug} business={business} menu={business.menus[0]} />
}
