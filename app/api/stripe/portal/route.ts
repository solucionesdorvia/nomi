import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const business = await prisma.business.findUnique({
      where: { clerkId: userId },
      select: { stripeCustomerId: true },
    })

    if (!business?.stripeCustomerId) {
      return NextResponse.json({ error: 'No hay suscripción activa' }, { status: 400 })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: business.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
