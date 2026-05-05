import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/m/(.*)',
  '/api/webhooks/(.*)',
  '/api/analytics',
  // Uploadthing necesita que /api/uploadthing sea publico porque el callback
  // server-to-server de Uploadthing (post-upload) llega sin cookies de Clerk.
  // La autenticacion del usuario ya se valida dentro del .middleware() del
  // FileRouter (ver lib/uploadthing.ts) y el handler valida la firma del
  // request via UPLOADTHING_TOKEN.
  '/api/uploadthing(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
