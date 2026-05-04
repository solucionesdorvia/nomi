import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
  typescript: true,
})

export const PLANS = {
  STARTER: {
    id: 'STARTER',
    name: 'Starter',
    price: 8000,
    priceId: process.env.STRIPE_PRICE_STARTER ?? '',
    features: [
      '1 local',
      'Hasta 30 platos',
      'Menú QR básico',
      'Branding adaptativo',
    ],
    limits: { items: 30, locations: 1, aiEnhance: false },
  },
  PRO: {
    id: 'PRO',
    name: 'Pro',
    price: 18000,
    priceId: process.env.STRIPE_PRICE_PRO ?? '',
    features: [
      '1 local',
      'Platos ilimitados',
      'QR con tu logo',
      'Mejora de fotos con IA',
      'Dashboard de métricas',
      'Branding completo',
    ],
    limits: { items: Infinity, locations: 1, aiEnhance: true },
  },
  MULTI: {
    id: 'MULTI',
    name: 'Multi',
    price: 35000,
    priceId: process.env.STRIPE_PRICE_MULTI ?? '',
    features: [
      'Hasta 5 locales',
      'Todo lo de Pro',
      'Menús distintos por sucursal',
      'Soporte prioritario',
    ],
    limits: { items: Infinity, locations: 5, aiEnhance: true },
  },
} as const

export type PlanId = keyof typeof PLANS
