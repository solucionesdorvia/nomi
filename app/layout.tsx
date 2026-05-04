import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'Nomi — Menú digital para tu restaurante',
  description: 'Creá tu menú digital con tu propio branding. Sin cartón, sin errores, siempre actualizado.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body className={`${geist.variable} font-sans antialiased`}>{children}</body>
      </html>
    </ClerkProvider>
  )
}
