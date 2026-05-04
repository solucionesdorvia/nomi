import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getStripe, PLANS, type PlanId } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({ planId: z.enum(['STARTER', 'PRO', 'MULTI']) })

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { planId } = schema.parse(body)
    const plan = PLANS[planId as PlanId]

    const business = await prisma.business.findUnique({ where: { clerkId: userId } })
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    // Crear o recuperar customer de Stripe
    let customerId = business.stripeCustomerId
    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: business.email,
        metadata: { clerkId: userId, businessId: business.id },
      })
      customerId = customer.id
      await prisma.business.update({
        where: { id: business.id },
        data: { stripeCustomerId: customerId },
      })
    }

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: plan.priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
      metadata: { businessId: business.id, planId },
      subscription_data: {
        metadata: { businessId: business.id, planId },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: 'Error al crear sesión de pago' }, { status: 500 })
  }
}
