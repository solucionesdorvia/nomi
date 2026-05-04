# Nomi — SaaS de menú digital para restaurantes

## Producto
Menú digital interactivo con branding adaptativo por local. El menú se ve exactamente como el restaurante: su paleta, tipografía y personalidad. Incluye IA para mejorar fotos y generar descripciones y contenido para redes.

## Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Clerk (auth + webhooks)
- Prisma + PostgreSQL (Railway)
- Uploadthing (imágenes)
- Stripe (pagos + portal)
- OpenAI GPT-4o-mini (descripciones + contenido social)
- Replicate / Real-ESRGAN (mejora de fotos)
- Svix (verificación webhooks)

## Estructura de rutas
- `/` — Landing page pública
- `/sign-in` `/sign-up` — Auth Clerk
- `/dashboard` — Home con checklist
- `/dashboard/branding` — Logo, colores, tipografía, preview
- `/dashboard/menu` — Editor de carta (categorías + platos)
- `/dashboard/qr` — Generador y descarga de QR
- `/dashboard/social` — Generación de contenido para redes con IA
- `/dashboard/analytics` — Métricas de vistas y platos
- `/dashboard/settings` — Planes y suscripción Stripe
- `/m/[slug]` — Menú público para clientes (sin auth)

## API Routes
- `POST /api/webhooks/clerk` — Crear Business al registrarse
- `GET/POST /api/business` — Business del usuario
- `GET /api/menu` — Menú activo con categorías e items
- `POST /api/categories` — Crear categoría
- `DELETE /api/categories/[id]` — Borrar categoría
- `POST /api/items` — Crear item
- `PATCH/DELETE /api/items/[id]` — Actualizar/borrar item
- `GET/POST /api/analytics` — Tracking y datos
- `POST /api/ai/describe` — Generar descripción con GPT
- `POST /api/ai/enhance` — Mejorar foto con Replicate
- `POST /api/ai/social` — Generar contenido para redes
- `POST /api/stripe/checkout` — Crear sesión de pago
- `POST /api/stripe/portal` — Portal de suscripción
- `POST /api/stripe/webhook` — Sync de planes
- `GET/POST /api/uploadthing` — Subida de archivos

## Variables de entorno (.env.local)
DATABASE_URL, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY,
CLERK_WEBHOOK_SECRET, UPLOADTHING_SECRET, UPLOADTHING_APP_ID,
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
STRIPE_PRICE_STARTER, STRIPE_PRICE_PRO, STRIPE_PRICE_MULTI,
OPENAI_API_KEY, REPLICATE_API_TOKEN, RESEND_API_KEY, NEXT_PUBLIC_APP_URL

## Para arrancar
1. npm install
2. Completar .env.local
3. npx prisma db push
4. npm run dev

## Convenciones
- TypeScript estricto, sin `any`
- Server Components por defecto
- Zod en todos los API routes
- Color de marca: naranja #FF6B35
