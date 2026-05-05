'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { UserButton } from '@clerk/nextjs'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, UtensilsCrossed, Palette,
  QrCode, Settings, BarChart2, ChevronRight, Share2, Wand2,
  Menu, X,
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
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Cierra el drawer al navegar a una nueva ruta.
  useEffect(() => { setDrawerOpen(false) }, [path])

  // Cuando el drawer esta abierto en mobile, bloqueamos el scroll del body.
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [drawerOpen])

  const currentLabel = nav.find(n => path === n.href || (n.href !== '/dashboard' && path.startsWith(n.href)))?.label ?? 'Dashboard'

  return (
    <div className="min-h-screen flex bg-neutral-50">
      {/* Topbar mobile (visible solo en < md) */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-neutral-200 h-14 flex items-center justify-between px-4">
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-2 -ml-2 rounded-lg text-neutral-700 hover:bg-neutral-100"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold tracking-tight text-neutral-900">nomi</span>
          <span className="-ml-1 text-base text-orange-500 font-semibold">.</span>
          <span className="text-sm text-neutral-400 ml-2">/ {currentLabel}</span>
        </div>
        <div className="w-9 flex items-center justify-end">
          <UserButton appearance={{ elements: { avatarBox: 'w-7 h-7' } }} />
        </div>
      </header>

      {/* Backdrop drawer mobile */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Sidebar / Drawer */}
      <aside
        className={cn(
          'bg-white border-r border-neutral-200 flex flex-col fixed md:sticky top-0 left-0 h-screen z-50 transition-transform duration-300',
          'w-64 md:w-60',
          drawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-neutral-200 shrink-0">
          <div className="flex items-center">
            <span className="text-xl font-semibold tracking-tight text-neutral-900">nomi</span>
            <span className="ml-0.5 text-xl text-orange-500 font-semibold">.</span>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="md:hidden p-2 -mr-2 rounded-lg text-neutral-500 hover:bg-neutral-100"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = path === href || (href !== '/dashboard' && path.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg text-sm transition-colors',
                  active ? 'bg-orange-50 text-orange-600 font-medium' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight className="w-3 h-3 opacity-50" />}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-neutral-200 flex items-center gap-3 shrink-0">
          <UserButton />
          <span className="text-xs text-neutral-500 truncate">Mi cuenta</span>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        {children}
      </main>
    </div>
  )
}
