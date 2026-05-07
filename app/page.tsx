import Link from 'next/link'
import {
  ArrowRight,
  Palette,
  Zap,
  QrCode,
  Star,
  Search,
  Sparkles,
  Check,
} from 'lucide-react'

const accent = '#FF6B35'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#f5f5f0] font-sans antialiased selection:bg-orange-500/25 selection:text-white">
      {/* Nav */}
      <nav
        className="sticky top-0 z-50 border-b border-[#1f1f1f] bg-[#0a0a0a]/92 backdrop-blur-md"
        aria-label="Principal"
      >
        <div className="mx-auto flex h-[60px] max-w-[1100px] items-center justify-between px-5">
          <Link
            href="/"
            className="flex items-baseline gap-0.5 rounded-md focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#FF6B35]"
          >
            <span className="text-[22px] font-semibold tracking-tight text-[#f5f5f0]">nomi</span>
            <span className="text-[22px] font-semibold" style={{ color: accent }}>
              .
            </span>
          </Link>
          <div
            className="nomi-nav-links items-center gap-6 [&_a]:text-[13px] [&_a]:text-neutral-500 [&_a]:transition-colors [&_a]:hover:text-[#f5f5f0]"
          >
            <a href="#features" className="rounded-md focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#FF6B35]">
              Funciones
            </a>
            <a href="#pricing" className="rounded-md focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#FF6B35]">
              Precios
            </a>
            <Link
              href="/sign-in"
              className="text-[13px] text-neutral-500 transition-colors hover:text-[#f5f5f0] rounded-md focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#FF6B35]"
            >
              Ingresar
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg bg-[#FF6B35] px-[18px] py-2 text-[13px] font-medium text-[#0a0a0a] transition-opacity hover:opacity-[0.96] focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Empezar gratis
            </Link>
          </div>
          <Link
            href="/sign-up"
            className="nomi-nav-cta-mobile rounded-lg bg-[#FF6B35] px-4 py-2 text-[13px] font-medium text-[#0a0a0a] transition-opacity hover:opacity-[0.96] focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Empezar
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-[1100px] px-6 pb-20 pt-[72px] text-center md:pb-24 md:pt-24">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#FF6B3530] bg-[#FF6B3515] px-[14px] py-1.5">
          <Sparkles size={12} color={accent} aria-hidden />
          <span className="text-xs font-medium text-[#FF6B35]">Menú digital con IA · hecho para restaurantes argentinos</span>
        </div>

        <h1 className="font-display text-[clamp(2.35rem,7vw,4.85rem)] font-semibold leading-[1.06] tracking-[-0.04em] text-[#f5f5f0]">
          El menú que se ve
          <br />
          <span style={{ color: accent }}>como tu local.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-[520px] text-lg leading-relaxed text-neutral-500">
          Creá tu carta digital con tu propio branding. Sin cartón, sin errores, siempre actualizada.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 rounded-[10px] bg-[#FF6B35] px-7 py-3.5 text-[15px] font-semibold text-white shadow-[0_12px_40px_-12px_rgba(255,107,53,0.55)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_16px_48px_-10px_rgba(255,107,53,0.65)] focus-visible:outline focus-visible:outline-offset-4 focus-visible:outline-[#FF6B35]"
          >
            Empezar gratis <ArrowRight size={16} aria-hidden />
          </Link>
          <a
            href="#demo"
            className="inline-flex items-center gap-2 rounded-[10px] border border-[#2a2a2a] bg-transparent px-7 py-3.5 text-[15px] font-medium text-[#f5f5f0] transition-colors hover:border-neutral-600 hover:bg-white/[0.03] focus-visible:outline focus-visible:outline-offset-4 focus-visible:outline-[#FF6B35]"
          >
            Ver demo →
          </a>
        </div>

        <div className="mt-14 flex flex-wrap justify-center gap-10 md:gap-14">
          {[
            { n: '30 días', label: 'prueba gratis' },
            { n: '5 min', label: 'para tener tu menú' },
            { n: '100%', label: 'branding propio' },
          ].map(({ n, label }) => (
            <div key={label} className="text-center">
              <p className="text-[28px] font-bold tracking-tight text-[#f5f5f0]">{n}</p>
              <p className="mt-1 text-[13px] text-neutral-600">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Demo */}
      <section id="demo" className="mx-auto max-w-[1100px] px-6 pb-24">
        <div className="overflow-hidden rounded-[20px] border border-[#1f1f1f] bg-[#111] p-8">
          <p className="mb-6 text-center text-[12px] uppercase tracking-[0.1em] text-neutral-600">
            El mismo producto, tres locales distintos — cada uno con su identidad
          </p>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
            {[
              { name: 'La Trattoria', primary: '#1a0a00', accent: '#E8722A', bg: '#fff8f3', style: 'Rústico italiano' },
              { name: 'Sushi Ko', primary: '#0d1117', accent: '#E53E3E', bg: '#f7f7f7', style: 'Minimalista japonés' },
              { name: 'Verde Café', primary: '#1a2e1a', accent: '#4caf50', bg: '#f0faf0', style: 'Orgánico natural' },
            ].map(({ name, primary, accent: a, bg, style }) => (
              <div key={name} className="overflow-hidden rounded-[14px] border border-[#2a2a2a]">
                <div className="px-4 py-5 text-center" style={{ backgroundColor: primary }}>
                  <div
                    className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full text-lg"
                    style={{ backgroundColor: `${a}30` }}
                    aria-hidden
                  >
                    🍽️
                  </div>
                  <p className="text-sm font-bold" style={{ color: bg }}>
                    {name}
                  </p>
                  <p className="mt-0.5 text-[10px]" style={{ color: a }}>
                    {style}
                  </p>
                </div>
                <div className="p-3" style={{ backgroundColor: bg }}>
                  <p
                    className="mb-2 text-[9px] font-bold uppercase tracking-[0.08em]"
                    style={{ color: a }}
                  >
                    Entradas
                  </p>
                  {['Bruschetta', 'Tabla mixta'].map(item => (
                    <div
                      key={item}
                      className="flex justify-between border-b py-1.5 text-[11px]"
                      style={{ borderColor: `${primary}15`, color: primary }}
                    >
                      <p className="font-medium">{item}</p>
                      <p className="font-bold" style={{ color: a }}>
                        $2.500
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-[1100px] px-6 pb-24">
        <div className="mb-14 text-center">
          <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-[#FF6B35]">
            Por qué Nomi
          </p>
          <h2 className="font-display text-[clamp(1.8rem,4vw,2.65rem)] font-semibold tracking-[-0.03em] text-[#f5f5f0]">
            Más que un menú QR
          </h2>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
          {[
            {
              icon: <Palette size={20} color={accent} />,
              title: 'Branding adaptativo',
              desc: 'Cargás tu logo, colores y tipografía. El menú toma la identidad de tu local. No hay dos iguales.',
            },
            {
              icon: <Sparkles size={20} color={accent} />,
              title: 'Mejora de fotos con IA',
              desc: 'Sacás una foto con el celular, Nomi la mejora automáticamente. Calidad profesional sin fotógrafo.',
            },
            {
              icon: <Search size={20} color={accent} />,
              title: 'Menú interactivo',
              desc: 'Búsqueda en tiempo real, filtros por alérgenos, platos destacados. No es una lista plana.',
            },
            {
              icon: <QrCode size={20} color={accent} />,
              title: 'QR con tu logo',
              desc: 'Generás el QR con tu logo integrado, listo para imprimir en mesas o la puerta del local.',
            },
            {
              icon: <Zap size={20} color={accent} />,
              title: 'Cambios al instante',
              desc: 'Actualizás precio o descripción y el menú cambia en todos los QR en segundos.',
            },
            {
              icon: <Star size={20} color={accent} />,
              title: 'Platos destacados',
              desc: 'Marcás tus mejores platos y aparecen primero. Dirigís lo que el cliente ve primero.',
            },
          ].map(({ icon, title, desc }) => (
            <div
              key={title}
              className="rounded-[14px] border border-[#1f1f1f] bg-[#111] p-6 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-28px_rgba(0,0,0,0.75)]"
            >
              <div className="mb-3.5">{icon}</div>
              <p className="mb-2 text-[15px] font-semibold text-[#f5f5f0]">{title}</p>
              <p className="text-[13px] leading-relaxed text-neutral-600">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="border-y border-[#1f1f1f] py-16 md:py-20">
        <div className="mx-auto max-w-[1100px] px-6">
          <h2 className="font-display mb-12 text-center text-[clamp(1.75rem,4vw,2.65rem)] font-semibold tracking-[-0.03em] text-[#f5f5f0] md:mb-16">
            En 3 pasos, listo
          </h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-10 md:gap-8">
            {[
              {
                n: '01',
                title: 'Configurás tu marca',
                desc: 'Subís el logo, elegís colores y tipografía. El menú toma tu identidad automáticamente.',
              },
              {
                n: '02',
                title: 'Cargás tu carta',
                desc: 'Agregás categorías y platos con fotos. La IA mejora las imágenes y genera descripciones.',
              },
              {
                n: '03',
                title: 'Compartís el QR',
                desc: 'Descargás el QR personalizado y lo ponés en las mesas. Tus clientes ya pueden verlo.',
              },
            ].map(({ n, title, desc }) => (
              <div key={n}>
                <p className="mb-4 text-[64px] font-extrabold leading-none tracking-[-0.04em] text-[#1a1a1a]">
                  {n}
                </p>
                <p className="mb-2.5 text-lg font-semibold text-[#f5f5f0]">{title}</p>
                <p className="text-sm leading-relaxed text-neutral-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-[1100px] px-6 py-24">
        <div className="mb-14 text-center">
          <h2 className="font-display text-[clamp(1.75rem,4vw,2.65rem)] font-semibold tracking-[-0.03em] text-[#f5f5f0] mb-3">
            Precios simples
          </h2>
          <p className="text-[15px] text-neutral-600">30 días gratis. Sin tarjeta. Sin letra chica.</p>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
          {[
            {
              name: 'Starter',
              price: '$8.000',
              features: ['1 local', 'Hasta 30 platos', 'Menú QR', 'Branding adaptativo'],
              highlight: false,
            },
            {
              name: 'Pro',
              price: '$18.000',
              features: [
                '1 local',
                'Platos ilimitados',
                'QR con tu logo',
                'Mejora IA de fotos',
                'Dashboard de métricas',
              ],
              highlight: true,
            },
            {
              name: 'Multi',
              price: '$35.000',
              features: ['Hasta 5 locales', 'Todo lo de Pro', 'Menús por sucursal', 'Soporte prioritario'],
              highlight: false,
            },
          ].map(({ name, price, features, highlight }) => (
            <div
              key={name}
              className={`relative rounded-2xl p-7 ${
                highlight
                  ? 'border border-[#FF6B3540] bg-[#FF6B3510]'
                  : 'border border-[#1f1f1f] bg-[#111]'
              }`}
            >
              {highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#FF6B35] px-3.5 py-1 text-[11px] font-semibold text-white">
                  Más elegido
                </div>
              )}
              <p className="mb-2 text-sm font-medium text-neutral-500">{name}</p>
              <p className="mb-6 text-4xl font-bold tracking-tight text-[#f5f5f0]">
                {price}
                <span className="text-[13px] font-normal text-neutral-600">/mes</span>
              </p>
              <ul className="mb-7 list-none space-y-2.5 p-0">
                {features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-[13px] text-neutral-400">
                    <Check size={14} color={accent} strokeWidth={2.5} className="mt-0.5 shrink-0" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className={`block rounded-[10px] py-3 text-center text-sm font-medium transition-opacity hover:opacity-95 focus-visible:outline focus-visible:outline-offset-4 focus-visible:outline-[#FF6B35] ${
                  highlight
                    ? 'bg-[#FF6B35] text-white'
                    : 'border border-[#2a2a2a] bg-transparent text-[#f5f5f0]'
                }`}
              >
                Empezar gratis
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[#1f1f1f] px-6 py-24 text-center">
        <h2 className="font-display mb-5 text-[clamp(1.85rem,5vw,3.25rem)] font-semibold leading-tight tracking-[-0.04em] text-[#f5f5f0]">
          Tu carta digital,
          <br />
          <span style={{ color: accent }}>en 5 minutos.</span>
        </h2>
        <p className="mb-9 text-base text-neutral-600">30 días gratis. Sin tarjeta de crédito.</p>
        <Link
          href="/sign-up"
          className="inline-flex items-center gap-2 rounded-xl bg-[#FF6B35] px-9 py-4 text-base font-semibold text-white transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-16px_rgba(255,107,53,0.55)] focus-visible:outline focus-visible:outline-offset-4 focus-visible:outline-[#FF6B35]"
        >
          Crear mi menú ahora <ArrowRight size={18} aria-hidden />
        </Link>
      </section>

      {/* Legal mini */}
      <section
        id="legal"
        className="border-t border-[#1f1f1f] bg-[#080808] px-6 py-12 text-left text-sm text-neutral-500"
        aria-labelledby="legal-heading"
      >
        <div className="mx-auto max-w-[1100px] grid gap-10 md:grid-cols-2">
          <div id="privacidad">
            <h3 id="legal-heading" className="mb-2 font-display text-base font-semibold text-[#e5e5e5]">
              Privacidad
            </h3>
            <p className="leading-relaxed">
              Procesamos los datos necesarios para operar tu cuenta y tu menú (nombre del local, branding e
              imágenes que subas). No vendemos datos de contacto de tus clientes.
            </p>
          </div>
          <div id="terminos">
            <h3 className="mb-2 font-display text-base font-semibold text-[#e5e5e5]">Términos</h3>
            <p className="leading-relaxed">
              Al usar Nomi aceptás un uso razonable del servicio. Podés exportar o actualizar tu contenido en
              cualquier momento; las suscripciones se facturan según el plan elegido cuando esté activo el pago
              en línea.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1f1f1f] px-6 py-8">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-4">
          <div className="flex items-baseline gap-0.5">
            <span className="text-lg font-semibold text-[#f5f5f0]">nomi</span>
            <span className="text-lg" style={{ color: accent }}>
              .
            </span>
          </div>
          <p className="text-xs text-neutral-600">© {new Date().getFullYear()} Nomi. Hecho en Argentina.</p>
          <div className="flex gap-6 text-xs">
            <a
              href="#privacidad"
              className="text-neutral-500 transition-colors hover:text-[#f5f5f0] rounded focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#FF6B35]"
            >
              Privacidad
            </a>
            <a
              href="#terminos"
              className="text-neutral-500 transition-colors hover:text-[#f5f5f0] rounded focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#FF6B35]"
            >
              Términos
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}
