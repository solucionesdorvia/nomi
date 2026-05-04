# NEXT STEPS — Nomi

Estado del proyecto al cierre de la sesion con Claude Code.
Continuar desde aca en Cursor.

---

## [x] Hecho

- `npm install` corrido (412 paquetes)
- `npx prisma generate` OK
- 7 errores de TS / compatibilidad arreglados (ver "Cambios aplicados" abajo)
- `npm run build` pasa limpio (0 errores TS, 24 rutas generadas)
- Repo subido a `https://github.com/solucionesdorvia/nomi` (branch `main`)

## [ ] Pendiente

### 1. Completar `.env.local` con credenciales reales

Copiar `.env.example` -> `.env.local` y reemplazar los placeholders. Sin esto
nada funciona en runtime. Servicios a dar de alta:

| Variable | Servicio | Donde |
|---|---|---|
| `DATABASE_URL` | Railway PostgreSQL | railway.app -> New Project -> + PostgreSQL -> Connect |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` | Clerk | clerk.com -> tu app -> API Keys |
| `CLERK_WEBHOOK_SECRET` | Clerk | clerk.com -> Webhooks -> Add Endpoint a `/api/webhooks/clerk` (eventos: `user.created`, `user.deleted`) -> Signing Secret |
| `UPLOADTHING_SECRET` + `UPLOADTHING_APP_ID` | Uploadthing | uploadthing.com -> API Keys |
| `STRIPE_SECRET_KEY` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe | stripe.com -> Developers -> API Keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe (local) | `stripe listen --forward-to localhost:3000/api/stripe/webhook` |
| `STRIPE_PRICE_STARTER` / `_PRO` / `_MULTI` | Stripe | Crear 3 productos recurrentes ARS ($8.000 / $18.000 / $35.000) y copiar los `price_...` |
| `OPENAI_API_KEY` | OpenAI | platform.openai.com -> API Keys |
| `REPLICATE_API_TOKEN` | Replicate | replicate.com -> Account -> Tokens |
| `RESEND_API_KEY` | Resend | resend.com -> API Keys |

Stripe en Argentina puede requerir cuenta en USD. Si no funciona, considerar
MercadoPago como alternativa.

### 2. Pushear schema a la DB

Con `DATABASE_URL` real cargada:

```bash
npx prisma db push
```

### 3. Levantar el dev server

```bash
npm run dev
```

Abre en http://localhost:3000

### 4. Configurar webhooks externos

**Clerk** (paso 7 del prompt original):
- Dashboard de Clerk -> Webhooks -> Add Endpoint
- URL: `https://TU_DOMINIO/api/webhooks/clerk` (o usar ngrok local)
- Eventos: `user.created`, `user.deleted`
- Copiar Signing Secret -> `CLERK_WEBHOOK_SECRET` en `.env.local`

**Stripe** (paso 8 — local dev):
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
Copiar el secret que imprime -> `STRIPE_WEBHOOK_SECRET`.

Para production, crear el endpoint en Stripe Dashboard -> Developers -> Webhooks
apuntando a `https://TU_DOMINIO/api/stripe/webhook`.

### 5. Crear los 3 precios en Stripe (paso 9)

Stripe Dashboard -> Products -> + Add Product, x3:

| Plan | Precio | Recurrencia |
|---|---|---|
| Starter | $8.000 ARS | Mensual |
| Pro | $18.000 ARS | Mensual |
| Multi | $35.000 ARS | Mensual |

Copiar cada `price_...` ID a la variable correspondiente.

### 6. Test manual del flujo (paso 10)

- [ ] Registrarse -> Business se crea automaticamente en DB (verifica que el webhook de Clerk dispara)
- [ ] Configurar branding -> preview en tiempo real funciona
- [ ] Agregar categoria y plato
- [ ] Ver menu publico en `/m/[slug]`
- [ ] Descargar QR
- [ ] Generar descripcion con IA (boton dentro del modal de plato)
- [ ] Generar contenido para redes (`/dashboard/social`)
- [ ] Ver analytics con datos reales
- [ ] Probar checkout de Stripe (modo test)

### 7. Deploy en Railway (paso 11)

1. Conectar el repo de GitHub a Railway (`solucionesdorvia/nomi`)
2. Agregar PostgreSQL como plugin (si no esta ya)
3. Settings -> Variables -> pegar todas las variables de `.env.local` (excepto la `DATABASE_URL` local — Railway la inyecta solo)
4. Settings -> Domain -> generar dominio
5. Actualizar `NEXT_PUBLIC_APP_URL` con el dominio real
6. Redeploy
7. Volver al paso 4: actualizar la URL del webhook de Clerk a `https://TU_DOMINIO_RAILWAY/api/webhooks/clerk`

---

## Cambios aplicados durante la sesion

Para que la build pasara con las versiones de `package.json`:

| Archivo | Cambio | Razon |
|---|---|---|
| `package.json` | `prisma` y `@prisma/client` ^7 -> ^6 | Prisma 7 requiere `prisma.config.ts` y rompe `url` en `schema.prisma` |
| `app/(dashboard)/dashboard/social/page.tsx` | `Instagram` -> `Camera` | `lucide-react` v1.14 no exporta `Instagram` |
| `app/(dashboard)/layout.tsx` | Removido `afterSignOutUrl` de `<UserButton>` | Clerk 7 lo saco como prop directa; ahora se controla con `NEXT_PUBLIC_CLERK_AFTER_SIGN_OUT_URL` |
| `lib/stripe.ts` | `apiVersion: '2024-11-20.acacia'` -> `'2026-04-22.dahlia'` | Stripe SDK v22 |
| `app/api/ai/enhance/route.ts` | Cast seguro del output de Replicate | `replicate.run` devuelve `string \| string[]` |
| `app/api/categories/[id]/route.ts` | `params: { id }` -> `params: Promise<{ id }>` + `await params` | Next 16 async params |
| `app/api/items/[id]/route.ts` | idem | idem |
| `app/m/[slug]/page.tsx` | `params: { slug }` -> `params: Promise<{ slug }>` + `await params` | idem |

---

## Notas / decisiones abiertas

- **Middleware deprecation warning**: Next 16 marca `middleware.ts` como
  deprecado a favor de `proxy.ts`. La build pasa igual pero conviene migrar
  cuando convenga (renombrar archivo, ver
  https://nextjs.org/docs/messages/middleware-to-proxy).

- **Uploadthing**: `components/dashboard/ImageUpload.tsx` usa un fallback con
  `URL.createObjectURL` para preview. Para production, integrar el SDK oficial
  con `useUploadThing` hook.

- **Analytics tracking**: hay un hook `hooks/useMenuTracking.ts` listo para
  usar — falta agregar `useMenuTracking(slug)` al inicio de `MenuClient.tsx`.

- **CRLF/LF warnings al hacer git add**: normal en Windows. Si molesta,
  agregar `.gitattributes` con `* text=auto eol=lf`.

- **Identidad git del primer commit**: `solucionesdorvia
  <solucionesdorvia@users.noreply.github.com>` (config local al repo, no
  global). Cambiar con `git config user.email TU_EMAIL` si querias otra.
