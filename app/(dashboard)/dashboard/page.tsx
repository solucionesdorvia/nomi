import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowRight, UtensilsCrossed, Palette, QrCode, Eye } from 'lucide-react'

export default async function DashboardPage() {
  const { userId } = await auth()
  const business = await prisma.business.findUnique({
    where: { clerkId: userId! },
    include: {
      branding: true,
      menus: { include: { categories: { include: { items: true } } } },
    },
  })

  const totalItems = business?.menus[0]?.categories.reduce(
    (acc, cat) => acc + cat.items.length, 0
  ) ?? 0

  const steps = [
    {
      done: !!business?.branding?.logoUrl,
      href: '/dashboard/branding',
      icon: Palette,
      title: 'Configurá tu branding',
      desc: 'Logo, colores y estilo de tu local',
    },
    {
      done: totalItems > 0,
      href: '/dashboard/menu',
      icon: UtensilsCrossed,
      title: 'Cargá tu carta',
      desc: 'Agregá categorías y platos con fotos',
    },
    {
      done: false,
      href: '/dashboard/qr',
      icon: QrCode,
      title: 'Descargá tu QR',
      desc: 'Ponelo en las mesas de tu local',
    },
  ]

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Bienvenido a Nomi{business?.name ? `, ${business.name}` : ''}
        </h1>
        <p className="text-neutral-500 mt-1">
          Seguí estos pasos para tener tu menú digital listo.
        </p>
      </div>

      <div className="space-y-3">
        {steps.map(({ done, href, icon: Icon, title, desc }, i) => (
          <Link
            key={i}
            href={href}
            className="flex items-center gap-4 p-5 bg-white rounded-xl border border-neutral-200 hover:border-orange-300 hover:shadow-sm transition-all group"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-green-100' : 'bg-orange-50'}`}>
              <Icon className={`w-5 h-5 ${done ? 'text-green-600' : 'text-orange-500'}`} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-neutral-900">{title}</p>
              <p className="text-sm text-neutral-500">{desc}</p>
            </div>
            <div className="flex items-center gap-2">
              {done && <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">Listo</span>}
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-orange-500 transition-colors" />
            </div>
          </Link>
        ))}
      </div>

      {business?.slug && (
        <div className="mt-8 p-5 bg-orange-50 rounded-xl border border-orange-200">
          <p className="text-sm font-medium text-orange-800 mb-1">Tu menú público</p>
          <div className="flex items-center gap-3">
            <code className="text-sm text-orange-700 bg-orange-100 px-3 py-1.5 rounded-lg flex-1">
              {process.env.NEXT_PUBLIC_APP_URL}/m/{business.slug}
            </code>
            <Link
              href={`/m/${business.slug}`}
              target="_blank"
              className="flex items-center gap-1.5 text-sm font-medium text-orange-600 hover:text-orange-700"
            >
              <Eye className="w-4 h-4" />
              Ver
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
