import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  primaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  fontHeading: z.string().optional(),
  fontBody: z.string().optional(),
  style: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const data = schema.parse(body)

    const { name, slug, ...brandingData } = data

    // Upsert business
    const business = await prisma.business.upsert({
      where: { clerkId: userId },
      create: {
        clerkId: userId,
        name,
        slug,
        email: '',
        branding: { create: brandingData },
        menus: { create: { name: 'Mi carta' } },
      },
      update: {
        name,
        branding: {
          upsert: {
            create: brandingData,
            update: brandingData,
          },
        },
      },
    })

    return NextResponse.json(business)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const business = await prisma.business.findUnique({
      where: { clerkId: userId },
      include: { branding: true, menus: true },
    })

    return NextResponse.json(business)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
