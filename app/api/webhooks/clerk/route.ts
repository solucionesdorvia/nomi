import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { Webhook } from 'svix'
import { prisma } from '@/lib/prisma'

type ClerkEvent = {
  type: string
  data: {
    id: string
    email_addresses: { email_address: string }[]
    first_name?: string
    last_name?: string
    username?: string
  }
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    + '-' + Math.random().toString(36).slice(2, 6)
}

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const svixId = headersList.get('svix-id')
  const svixTimestamp = headersList.get('svix-timestamp')
  const svixSignature = headersList.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  let event: ClerkEvent
  try {
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET ?? '')
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkEvent
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'user.created') {
    const { id, email_addresses, first_name, last_name } = event.data
    const email = email_addresses[0]?.email_address ?? ''
    const name = [first_name, last_name].filter(Boolean).join(' ') || email.split('@')[0]
    const slug = generateSlug(name)

    // Verificar que no exista ya
    const existing = await prisma.business.findUnique({ where: { clerkId: id } })
    if (!existing) {
      await prisma.business.create({
        data: {
          clerkId: id,
          name,
          slug,
          email,
          branding: { create: {} },
          menus: { create: { name: 'Mi carta' } },
        },
      })
    }
  }

  if (event.type === 'user.deleted') {
    const { id } = event.data
    await prisma.business.deleteMany({ where: { clerkId: id } })
  }

  return NextResponse.json({ received: true })
}
