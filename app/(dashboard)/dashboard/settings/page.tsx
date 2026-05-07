import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { PLANS } from '@/lib/stripe'
import SettingsClient from './SettingsClient'

function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
      process.env.STRIPE_PRICE_STARTER &&
      process.env.STRIPE_PRICE_PRO &&
      process.env.STRIPE_PRICE_MULTI
  )
}

export default async function SettingsPage() {
  const { userId } = await auth()
  const business = await prisma.business.findUnique({
    where: { clerkId: userId! },
    select: { plan: true, name: true, slug: true },
  })

  return (
    <SettingsClient
      currentPlan={business?.plan ?? 'STARTER'}
      plans={PLANS}
      stripeConfigured={isStripeConfigured()}
    />
  )
}
