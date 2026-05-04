'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, UtensilsCrossed, Palette,
  QrCode, Settings, BarChart2, ChevronRight, Share2, Wand2,
} from 'lucide-react'

const nav = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/dashboard/menu', label: 'Mi carta', icon: UtensilsCrossed },
  { href: '/dashboard/branding', label: 'Branding', icon: Palette },
  { href: '/dashboard/imagenes', label: 'Imágenes IA', icon: Wand2 },
  { href: '/dashboard/qr', label: 'Código QR', icon: QrCode },
  { href: '/dashboard/social', label: 'Redes sociales', icon: Share2 },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/dashboard/settings', label: 'Configuración', icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  return (
    <div className="min-h-screen flex bg-neutral-50">
      <aside className="w-60 bg-white border-r border-neutral-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-neutral-200">
          <span className="text-xl font-semibold tracking-tight text-neutral-900">nomi</span>
          <span className="ml-0.5 text-xl text-orange-500 font-semibold">.</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = path === href || (href !== '/dashboard' && path.startsWith(href))
            return (
              <Link key={href} href={href}
                className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  active ? 'bg-orange-50 text-orange-600 font-medium' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                )}>
                <Icon className="w-4 h-4 shrink-0" />
                {label}
                {active && <ChevronRight className="w-3 h-3 ml-auto opacity-50" />}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-neutral-200 flex items-center gap-3">
          <UserButton />
          <span className="text-xs text-neutral-500 truncate">Mi cuenta</span>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
