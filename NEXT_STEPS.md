# NEXT STEPS — Nomi

Handoff para continuar en Cursor. Última actualización: proyecto desplegado en Railway, app mobile-first.

---

## [x] Ya hecho (resumen)

| Área | Estado |
|------|--------|
| Build / TypeScript | `npm run build` limpio |
| Base de datos | Prisma + PostgreSQL (Railway); scripts `db:push` / `db:studio` con `dotenv-cli` |
| Auth | Clerk; `proxy.ts` (Next 16) con rutas públicas incl. `/api/uploadthing(.*)` |
| Uploads | Uploadthing v7+ (`UPLOADTHING_TOKEN`), `ImageUpload` con SDK y timeout |
| Stripe | Cliente lazy `getStripe()` para no romper build sin key |
| Menú público | `/m/[slug]`, `useMenuTracking(slug)`, tema `getMenuTheme()` para contraste |
| Branding | Logo, colores, fonts; extracción de paleta (`node-vibrant`); inspiración multi-imagen |
| Pósters / fichas | `GET /api/menu-poster`, `GET /api/dish-card` (OG images) |
| Imágenes IA | `/dashboard/imagenes` — modos con OpenAI + Replicate (Flux donde aplica) |
| UI | Dashboard con drawer mobile, páginas responsive, landing ajustada |

Repo: `https://github.com/solucionesdorvia/nomi` · Deploy ejemplo: configurar `NEXT_PUBLIC_APP_URL` al dominio real de Railway.

---

## [ ] Pendiente operativo (cuando decidas monetizar / producción fuerte)

### 1. Variables de entorno en producción

En Railway → Variables del servicio Next, cargar todo lo que usás en local (misma lista que `.env.example`). **No** commitear `.env.local`.

- `NEXT_PUBLIC_APP_URL` = URL pública del deploy (sin barra final inconsistente).
- Webhook Clerk: URL `https://TU_DOMINIO/api/webhooks/clerk`, eventos `user.created`, `user.deleted` → `CLERK_WEBHOOK_SECRET`.
- Si usás Stripe: `STRIPE_*` + webhook `https://TU_DOMINIO/api/stripe/webhook` → `STRIPE_WEBHOOK_SECRET`.
- Crear en Stripe Dashboard los 3 precios recurrentes ARS y pegar `STRIPE_PRICE_STARTER` / `_PRO` / `_MULTI`.

Stripe en Argentina puede complicarse: alternativa futura **MercadoPago** (no implementada aún).

### 2. Checklist manual post-deploy

- [ ] Registro → `Business` en DB (webhook Clerk OK)
- [ ] Branding guarda y se refleja en menú público
- [ ] Categorías / platos / QR / IA descripción / social / analytics
- [ ] Subida de logo e imágenes (no queda colgada)
- [ ] Póster menú + ficha de plato descargables
- [ ] (Opcional) Checkout Stripe test

---

## Cambios aplicados (histórico útil para debug)

Los primeros fixes de la sesión original siguen válidos como referencia: Prisma 6, Clerk `UserButton`, Stripe API version, `params` async en Next 16, cast Replicate enhance.

Fixes posteriores no listados línea por línea: `middleware` → `proxy.ts`, rutas públicas Uploadthing, integración SDK upload, tema semántico, posters OG, rutas IA imágenes, Flux vía Replicate, responsive global.

---

## Notas

- **CRLF/LF**: si molesta en Windows, `.gitattributes` con `* text=auto eol=lf`.
- **Git author del repo**: `solucionesdorvia` — cambiar con `git config user.email` en el clone si hace falta.
