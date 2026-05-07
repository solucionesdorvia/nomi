'use client'

import { useState } from 'react'
import { Check, Zap, Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

type Plan = {
  id: string
  name: string
  price: number
  features: readonly string[]
}

export default function SettingsClient({
  currentPlan,
  plans,
  stripeConfigured,
}: {
  currentPlan: string
  plans: Record<string, Plan>
  stripeConfigured: boolean
}) {
  const [loading, setLoading] = useState<string | null>(null)
  const params = useSearchParams()
  const success = params.get('success')

  async function upgrade(planId: string) {
    if (!stripeConfigured) return
    setLoading(planId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900">Configuración</h1>
        <p className="text-sm text-neutral-500 mt-1">Administrá tu plan y suscripción.</p>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-sm text-green-800 font-medium">¡Pago exitoso! Tu plan fue actualizado.</p>
        </div>
      )}

      {!stripeConfigured && (
        <div
          className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-900"
          role="status"
        >
          <p className="font-medium mb-1">Pagos con tarjeta no configurados</p>
          <p className="text-amber-800/90">
            Los botones de suscripción están deshabilitados hasta que en el servidor existan{' '}
            <code className="text-xs bg-amber-100/80 px-1 py-0.5 rounded">
              STRIPE_SECRET_KEY
            </code>
            , las claves públicas y los tres{' '}
            <code className="text-xs bg-amber-100/80 px-1 py-0.5 rounded">STRIPE_PRICE_*</code>. Podés usar
            el resto de Nomi sin Stripe.
          </p>
        </div>
      )}

      <div className="mb-6">
        <p className="text-sm text-neutral-500 mb-1">Plan actual</p>
        <p className="text-lg font-semibold text-neutral-900">{plans[currentPlan]?.name ?? 'Starter'}</p>
      </div>

      <div className="grid gap-4">
        {Object.values(plans).map(plan => {
          const isCurrent = plan.id === currentPlan
          const isPro = plan.id === 'PRO'
          const isLoading = loading === plan.id

          return (
            <div
              key={plan.id}
              className={`p-5 rounded-xl border transition-colors ${
                isPro
                  ? 'border-orange-300 bg-orange-50'
                  : isCurrent
                  ? 'border-neutral-300 bg-neutral-50'
                  : 'border-neutral-200 bg-white'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-neutral-900">{plan.name}</p>
                    {isPro && (
                      <span className="text-xs px-2 py-0.5 bg-orange-500 text-white rounded-full font-medium">
                        Más elegido
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-xs px-2 py-0.5 bg-neutral-200 text-neutral-600 rounded-full">
                        Activo
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-neutral-900 mb-3">
                    ${plan.price.toLocaleString('es-AR')}
                    <span className="text-sm font-normal text-neutral-400">/mes</span>
                  </p>
                  <ul className="space-y-1.5">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-neutral-600">
                        <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="shrink-0 sm:w-auto w-full">
                  {isCurrent ? (
                    <div className="px-4 py-2 text-sm text-neutral-400 border border-neutral-200 rounded-lg text-center">
                      Plan actual
                    </div>
                  ) : (
                    <button
                      onClick={() => upgrade(plan.id)}
                      disabled={!!loading || !stripeConfigured}
                      title={!stripeConfigured ? 'Configurá Stripe en el servidor' : undefined}
                      className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-60 sm:w-auto w-full ${
                        isPro
                          ? 'bg-orange-500 text-white hover:bg-orange-600'
                          : 'bg-neutral-900 text-white hover:bg-neutral-700'
                      }`}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4" />
                      )}
                      {isLoading ? 'Redirigiendo...' : 'Suscribirme'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
