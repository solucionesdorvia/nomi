import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { PLANS } from '@/lib/stripe'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const { userId } = await auth()
  const business = await prisma.business.findUnique({
    where: { clerkId: userId! },
    select: { plan: true, name: true, slug: true },
  })

  return <SettingsClient currentPlan={business?.plan ?? 'STARTER'} plans={PLANS} />
}
