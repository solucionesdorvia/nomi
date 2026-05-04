# PROMPT MAESTRO — NOMI SaaS
# Pegá esto completo en Claude Code al abrir la carpeta del proyecto

---

Sos el dev principal de **Nomi**, un SaaS de menú digital para restaurantes argentinos. Ya tenés todo el código armado. Tu trabajo es dejarlo 100% funcional, compilando sin errores y listo para producción.

## CONTEXTO DEL PRODUCTO

Nomi permite a restaurantes crear un menú digital con su propio branding (logo, colores, tipografía). Los clientes del restaurante acceden al menú escaneando un QR. Diferenciadores: branding adaptativo por local, mejora de fotos con IA, generación de contenido para redes con IA.

## STACK

- Next.js 16 + TypeScript (App Router)
- Tailwind CSS
- Clerk (auth)
- Prisma + PostgreSQL (Railway)
- Uploadthing (imágenes)
- Stripe (pagos)
- OpenAI GPT-4o-mini (IA texto)
- Replicate / Real-ESRGAN (IA imágenes)
- Svix (verificación webhooks)

## ESTRUCTURA DE ARCHIVOS YA CREADOS

```
nomi/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx                          ← sidebar con nav
│   │   └── dashboard/
│   │       ├── page.tsx                        ← home con checklist
│   │       ├── branding/page.tsx               ← onboarding de marca
│   │       ├── menu/page.tsx                   ← editor de carta
│   │       ├── qr/page.tsx                     ← generador QR
│   │       ├── social/page.tsx                 ← contenido para redes con IA
│   │       ├── analytics/page.tsx              ← métricas
│   │       └── settings/
│   │           ├── page.tsx                    ← server component
│   │           └── SettingsClient.tsx          ← planes + Stripe
│   ├── api/
│   │   ├── business/route.ts                   ← GET/POST business del usuario
│   │   ├── menu/route.ts                       ← GET menú activo
│   │   ├── categories/route.ts                 ← POST crear categoría
│   │   ├── categories/[id]/route.ts            ← DELETE categoría
│   │   ├── items/route.ts                      ← POST crear item
│   │   ├── items/[id]/route.ts                 ← PATCH/DELETE item
│   │   ├── analytics/route.ts                  ← GET/POST analytics
│   │   ├── uploadthing/route.ts                ← handler de uploads
│   │   ├── ai/
│   │   │   ├── describe/route.ts               ← generar descripción GPT
│   │   │   ├── enhance/route.ts                ← mejorar foto Replicate
│   │   │   └── social/route.ts                 ← generar contenido redes
│   │   ├── stripe/
│   │   │   ├── checkout/route.ts               ← crear sesión pago
│   │   │   ├── portal/route.ts                 ← portal de suscripción
│   │   │   └── webhook/route.ts                ← sync planes
│   │   └── webhooks/
│   │       └── clerk/route.ts                  ← crear Business al registrarse
│   ├── m/[slug]/
│   │   ├── page.tsx                            ← server: fetch business
│   │   └── MenuClient.tsx                      ← menú público con branding
│   ├── sign-in/[[...sign-in]]/page.tsx
│   ├── sign-up/[[...sign-up]]/page.tsx
│   ├── layout.tsx                              ← root con ClerkProvider
│   ├── page.tsx                                ← landing page
│   └── not-found.tsx
├── components/dashboard/
│   ├── ImageUpload.tsx                         ← drag & drop con preview
│   └── ItemModal.tsx                           ← modal edición de plato con IA
├── hooks/
│   └── useMenuTracking.ts                      ← tracking de vistas
├── lib/
│   ├── prisma.ts                               ← singleton Prisma
│   ├── stripe.ts                               ← client + PLANS config
│   ├── uploadthing.ts                          ← file router
│   └── utils.ts                               ← cn(), slugify(), formatPrice()
├── prisma/
│   └── schema.prisma                           ← modelo completo
├── middleware.ts                               ← Clerk auth
├── next.config.ts                              ← remotePatterns imágenes
├── .env.local                                  ← completar con keys reales
└── CLAUDE.md                                   ← este archivo
```

## SCHEMA DE PRISMA (ya en prisma/schema.prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
enum Plan { STARTER PRO MULTI }

model Business {
  id        String   @id @default(cuid())
  clerkId   String   @unique
  name      String
  slug      String   @unique
  email     String
  phone     String?
  plan      Plan     @default(STARTER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  branding             Branding?
  menus                Menu[]
  analytics            Analytics[]
  stripeCustomerId     String?
  stripeSubscriptionId String?
  @@map("businesses")
}
model Branding {
  id             String   @id @default(cuid())
  businessId     String   @unique
  business       Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  logoUrl        String?
  primaryColor   String   @default("#1a1a1a")
  secondaryColor String   @default("#ffffff")
  accentColor    String   @default("#FF6B35")
  fontHeading    String   @default("Playfair Display")
  fontBody       String   @default("Inter")
  borderRadius   String   @default("md")
  style          String   @default("modern")
  @@map("brandings")
}
model Menu {
  id         String     @id @default(cuid())
  businessId String
  business   Business   @relation(fields: [businessId], references: [id], onDelete: Cascade)
  name       String     @default("Mi carta")
  isActive   Boolean    @default(true)
  isPublic   Boolean    @default(true)
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt
  categories Category[]
  @@map("menus")
}
model Category {
  id       String  @id @default(cuid())
  menuId   String
  menu     Menu    @relation(fields: [menuId], references: [id], onDelete: Cascade)
  name     String
  emoji    String?
  order    Int     @default(0)
  isActive Boolean @default(true)
  items    Item[]
  @@map("categories")
}
model Item {
  id          String    @id @default(cuid())
  categoryId  String
  category    Category  @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  name        String
  description String?
  price       Decimal   @db.Decimal(10, 2)
  imageUrl    String?
  imageAiUrl  String?
  isActive    Boolean   @default(true)
  isFeatured  Boolean   @default(false)
  order       Int       @default(0)
  tags        String[]
  allergens   String[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  analytics   Analytics[]
  @@map("items")
}
model Analytics {
  id         String   @id @default(cuid())
  businessId String
  business   Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  itemId     String?
  item       Item?    @relation(fields: [itemId], references: [id], onDelete: SetNull)
  event      String
  device     String?
  createdAt  DateTime @default(now())
  @@map("analytics")
}
```

## DEPENDENCIAS (ya en package.json)

```json
"@clerk/nextjs": "^7.3.0",
"@hookform/resolvers": "^5.2.2",
"@prisma/client": "^7.8.0",
"@stripe/stripe-js": "^9.4.0",
"@types/qrcode": "^1.5.6",
"@uploadthing/react": "^7.3.3",
"clsx": "^2.1.1",
"date-fns": "^4.1.0",
"lucide-react": "^1.14.0",
"next": "16.2.4",
"openai": "^6.36.0",
"prisma": "^7.8.0",
"qrcode": "^1.5.4",
"react": "19.2.4",
"react-dom": "19.2.4",
"react-dropzone": "^15.0.0",
"react-hook-form": "^7.75.0",
"replicate": "^1.4.0",
"resend": "^6.12.2",
"stripe": "^22.1.0",
"svix": "^1.92.2",
"tailwind-merge": "^3.5.0",
"uploadthing": "^7.7.4",
"zod": "^4.4.3"
```

## VARIABLES DE ENTORNO (.env.local — completar con keys reales)

```
DATABASE_URL="postgresql://..."

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard/branding

UPLOADTHING_SECRET=sk_live_...
UPLOADTHING_APP_ID=...

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_MULTI=price_...

OPENAI_API_KEY=sk-...
REPLICATE_API_TOKEN=r8_...
RESEND_API_KEY=re_...

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## RUTAS PÚBLICAS (sin auth)
- `/` landing
- `/sign-in` `/sign-up`
- `/m/[slug]` menú del cliente
- `/api/webhooks/clerk`
- `/api/analytics` (POST de tracking)

## CONVENCIONES
- TypeScript estricto, sin `any`
- Server Components por defecto, `'use client'` solo cuando hay estado/interactividad
- Zod para validar todos los body de API routes
- Color de marca Nomi: `#FF6B35`
- `formatPrice()` en `lib/utils.ts` para precios en ARS

---

## TU TAREA — EJECUTAR EN ESTE ORDEN:

### PASO 1 — Instalar dependencias
```bash
npm install
```

### PASO 2 — Generar cliente Prisma
```bash
npx prisma generate
```

### PASO 3 — Verificar .env.local
Chequeá que DATABASE_URL y las keys de Clerk estén cargadas. Sin eso nada funciona.

### PASO 4 — Pushear schema a la base de datos
```bash
npx prisma db push
```

### PASO 5 — Correr el proyecto y revisar errores
```bash
npm run dev
```

### PASO 6 — Arreglar TODOS los errores de TypeScript y compilación
Revisá la consola. Arreglá cada error hasta que el proyecto compile limpio. Errores comunes a revisar:
- Versiones de API de Clerk (`auth()` vs `auth.protect()` según versión)
- Tipos de Prisma en los query results
- Props faltantes en componentes
- Imports de lucide-react (algunos íconos cambian de nombre entre versiones)

### PASO 7 — Configurar webhook de Clerk
En el dashboard de Clerk → Webhooks → agregar endpoint:
`https://tu-dominio.com/api/webhooks/clerk`
Eventos a escuchar: `user.created`, `user.deleted`
Copiar el Signing Secret → pegarlo en `CLERK_WEBHOOK_SECRET` del .env

### PASO 8 — Configurar webhook de Stripe
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
Copiar el webhook secret → pegarlo en `STRIPE_WEBHOOK_SECRET`

### PASO 9 — Crear precios en Stripe
En Stripe Dashboard → Products → crear 3 productos:
- Starter $8.000 ARS/mes recurrente → copiar price_id → STRIPE_PRICE_STARTER
- Pro $18.000 ARS/mes recurrente → STRIPE_PRICE_PRO
- Multi $35.000 ARS/mes recurrente → STRIPE_PRICE_MULTI

### PASO 10 — Verificar flujo completo
Testear manualmente:
- [ ] Registrarse → Business se crea automáticamente en DB
- [ ] Configurar branding → preview en tiempo real funciona
- [ ] Agregar categoría y plato
- [ ] Ver menú público en /m/[slug]
- [ ] Descargar QR
- [ ] Generar descripción con IA
- [ ] Generar contenido para redes
- [ ] Ver analytics con datos reales

### PASO 11 — Deploy en Railway
```bash
# Conectar repo a Railway
# Agregar PostgreSQL como plugin
# Copiar todas las variables de .env.local a Railway → Variables
# Railway hace el deploy automático
```

---

## NOTAS IMPORTANTES

**Uploadthing**: El componente `ImageUpload.tsx` tiene un fallback con `URL.createObjectURL` para preview inmediato. En producción reemplazar con el SDK oficial de Uploadthing (`useUploadThing` hook).

**Analytics**: El tracking se hace desde el cliente en `MenuClient.tsx`. Hay un hook `useMenuTracking` en `hooks/useMenuTracking.ts` listo para integrar — agregar `useMenuTracking(slug)` al inicio del componente.

**Imágenes externas**: `next.config.ts` ya tiene los `remotePatterns` para Uploadthing, Replicate y Clerk. Si aparece error de imagen, agregar el hostname ahí.

**Stripe en Argentina**: Stripe puede requerir cuenta en USD. Alternativamente usar MercadoPago — si lo necesitás, decime y lo integro.

**Clerk webhook secret**: Es distinto al `CLERK_SECRET_KEY`. Se genera en el dashboard de Clerk al crear el endpoint.

Si encontrás algún error que no podés resolver solo, describilo con el stack trace completo.
