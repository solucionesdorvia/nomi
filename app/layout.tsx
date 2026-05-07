import type { Metadata, Viewport } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { DM_Sans, Fraunces } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Nomi — Menú digital para tu restaurante',
  description:
    'Creá tu menú digital con tu propio branding. Sin cartón, sin errores, siempre actualizado.',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafaf9' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="es" className="scroll-smooth">
        <body
          className={`${dmSans.variable} ${fraunces.variable} font-sans antialiased bg-[var(--background)] text-[var(--foreground)]`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
