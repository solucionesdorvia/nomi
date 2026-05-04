import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

export async function POST(req: Request) {
  const body = await req.text()
  const sig = (await headers()).get('stripe-signature')!

  let event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    return NextResponse.json({ error: 'Webhook signature invalid' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const { businessId, planId } = session.metadata ?? {}
      if (businessId && planId) {
        await prisma.business.update({
          where: { id: businessId },
          data: {
            plan: planId as any,
            stripeSubscriptionId: session.subscription as string,
          },
        })
      }
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object
      const { businessId } = sub.metadata ?? {}
      if (businessId) {
        await prisma.business.update({
          where: { id: businessId },
          data: { plan: 'STARTER', stripeSubscriptionId: null },
        })
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
