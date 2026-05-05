'use client'

import { useState, useEffect, useRef } from 'react'
import { Download, Copy, Check } from 'lucide-react'

export default function QRPage() {
  const [slug, setSlug] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const url = slug ? `${window.location.origin}/m/${slug}` : ''

  useEffect(() => {
    fetch('/api/business').then(r => r.json()).then(d => {
      if (d?.slug) setSlug(d.slug)
    })
  }, [])

  useEffect(() => {
    if (!slug || !canvasRef.current) return
    import('qrcode').then(QRCode => {
      QRCode.toCanvas(canvasRef.current!, url, {
        width: 280,
        margin: 2,
        color: { dark: '#1a1a1a', light: '#ffffff' },
      })
    })
  }, [slug, url])

  function copyUrl() {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function downloadQR() {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `nomi-qr-${slug}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900">Código QR</h1>
        <p className="text-sm text-neutral-500 mt-1">Descargalo e imprimilo en tus mesas.</p>
      </div>

      {slug ? (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-neutral-200 p-8 flex flex-col items-center">
            <canvas ref={canvasRef} className="rounded-xl" />
            <p className="text-xs text-neutral-400 mt-4 text-center">Escaneá para ver el menú</p>
          </div>

          {/* URL */}
          <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4">
            <p className="text-xs text-neutral-400 mb-2">Link directo</p>
            <div className="flex items-center gap-2">
              <code className="text-sm text-neutral-700 flex-1 truncate">{url}</code>
              <button
                onClick={copyUrl}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-100 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </div>

          <button
            onClick={downloadQR}
            className="w-full flex items-center justify-center gap-2 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            Descargar QR
          </button>
        </div>
      ) : (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 text-center">
          <p className="text-orange-700 text-sm">
            Primero configurá tu branding para generar el QR.
          </p>
        </div>
      )}
    </div>
  )
}
