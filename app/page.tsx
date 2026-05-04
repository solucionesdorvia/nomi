import Link from 'next/link'
import { ArrowRight, Palette, Zap, QrCode, Star, Search, Sparkles, Check } from 'lucide-react'

export default function LandingPage() {
  return (
    <main style={{ fontFamily: "'Inter', sans-serif", backgroundColor: '#0a0a0a', color: '#f5f5f0' }}>

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid #1f1f1f', backgroundColor: '#0a0a0aee', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
            <span style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', color: '#f5f5f0' }}>nomi</span>
            <span style={{ fontSize: 22, color: '#FF6B35', fontWeight: 600 }}>.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <a href="#features" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>Funciones</a>
            <a href="#pricing" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>Precios</a>
            <Link href="/sign-in" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>Ingresar</Link>
            <Link href="/sign-up" style={{ fontSize: 13, fontWeight: 500, color: '#0a0a0a', backgroundColor: '#FF6B35', padding: '8px 18px', borderRadius: 8, textDecoration: 'none' }}>
              Empezar gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '96px 24px 80px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#FF6B3515', border: '1px solid #FF6B3530', borderRadius: 99, padding: '6px 14px', marginBottom: 32 }}>
          <Sparkles size={12} color="#FF6B35" />
          <span style={{ fontSize: 12, color: '#FF6B35', fontWeight: 500 }}>Menú digital con IA · nuevo en Argentina</span>
        </div>

        <h1 style={{ fontSize: 'clamp(40px, 7vw, 80px)', fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.04em', marginBottom: 24, color: '#f5f5f0' }}>
          El menú que se ve<br />
          <span style={{ color: '#FF6B35' }}>como tu local.</span>
        </h1>

        <p style={{ fontSize: 18, color: '#888', lineHeight: 1.6, maxWidth: 520, margin: '0 auto 40px' }}>
          Creá tu carta digital con tu propio branding. Sin cartón, sin errores, siempre actualizada.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/sign-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#FF6B35', color: '#fff', padding: '14px 28px', borderRadius: 10, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
            Empezar gratis <ArrowRight size={16} />
          </Link>
          <a href="#demo" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: 'transparent', color: '#f5f5f0', padding: '14px 28px', borderRadius: 10, fontSize: 15, fontWeight: 500, textDecoration: 'none', border: '1px solid #2a2a2a' }}>
            Ver demo →
          </a>
        </div>

        <div style={{ display: 'flex', gap: 48, justifyContent: 'center', marginTop: 64, flexWrap: 'wrap' }}>
          {[{ n: '30 días', label: 'prueba gratis' }, { n: '5 min', label: 'para tener tu menú' }, { n: '100%', label: 'branding propio' }].map(({ n, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 28, fontWeight: 700, color: '#f5f5f0', letterSpacing: '-0.03em' }}>{n}</p>
              <p style={{ fontSize: 13, color: '#555', marginTop: 4 }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Demo */}
      <section id="demo" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 96px' }}>
        <div style={{ backgroundColor: '#111', border: '1px solid #1f1f1f', borderRadius: 20, overflow: 'hidden', padding: 32 }}>
          <p style={{ fontSize: 12, color: '#444', marginBottom: 24, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            El mismo SaaS, tres locales distintos — cada uno con su identidad
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { name: 'La Trattoria', primary: '#1a0a00', accent: '#E8722A', bg: '#fff8f3', style: 'Rústico italiano' },
              { name: 'Sushi Ko', primary: '#0d1117', accent: '#E53E3E', bg: '#f7f7f7', style: 'Minimalista japonés' },
              { name: 'Verde Café', primary: '#1a2e1a', accent: '#4caf50', bg: '#f0faf0', style: 'Orgánico natural' },
            ].map(({ name, primary, accent, bg, style }) => (
              <div key={name} style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #2a2a2a' }}>
                <div style={{ backgroundColor: primary, padding: '20px 16px', textAlign: 'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: accent + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: 18 }}>🍽️</div>
                  <p style={{ color: bg, fontWeight: 700, fontSize: 14 }}>{name}</p>
                  <p style={{ color: accent, fontSize: 10, marginTop: 2 }}>{style}</p>
                </div>
                <div style={{ backgroundColor: bg, padding: 12 }}>
                  <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: accent, marginBottom: 8 }}>Entradas</p>
                  {['Bruschetta', 'Tabla mixta'].map(item => (
                    <div key={item} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${primary}15` }}>
                      <p style={{ fontSize: 11, color: primary, fontWeight: 500 }}>{item}</p>
                      <p style={{ fontSize: 11, color: accent, fontWeight: 700 }}>$2.500</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 96px' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <p style={{ fontSize: 12, color: '#FF6B35', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Por qué Nomi</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, letterSpacing: '-0.03em', color: '#f5f5f0' }}>Más que un menú QR</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {[
            { icon: <Palette size={20} color="#FF6B35" />, title: 'Branding adaptativo', desc: 'Cargás tu logo, colores y tipografía. El menú toma la identidad de tu local. No hay dos iguales.' },
            { icon: <Sparkles size={20} color="#FF6B35" />, title: 'Mejora de fotos con IA', desc: 'Sacás una foto con el celular, Nomi la mejora automáticamente. Calidad profesional sin fotógrafo.' },
            { icon: <Search size={20} color="#FF6B35" />, title: 'Menú interactivo', desc: 'Búsqueda en tiempo real, filtros por alérgenos, platos destacados. No es una lista plana.' },
            { icon: <QrCode size={20} color="#FF6B35" />, title: 'QR con tu logo', desc: 'Generás el QR con tu logo integrado, listo para imprimir en mesas o la puerta del local.' },
            { icon: <Zap size={20} color="#FF6B35" />, title: 'Cambios al instante', desc: 'Actualizás precio o descripción y el menú cambia en todos los QR en segundos.' },
            { icon: <Star size={20} color="#FF6B35" />, title: 'Platos destacados', desc: 'Marcás tus mejores platos y aparecen primero. Dirigís lo que el cliente ve primero.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{ backgroundColor: '#111', border: '1px solid #1f1f1f', borderRadius: 14, padding: '24px 20px' }}>
              <div style={{ marginBottom: 14 }}>{icon}</div>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#f5f5f0', marginBottom: 8 }}>{title}</p>
              <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cómo funciona */}
      <section style={{ borderTop: '1px solid #1f1f1f', borderBottom: '1px solid #1f1f1f', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, letterSpacing: '-0.03em', color: '#f5f5f0', textAlign: 'center', marginBottom: 60 }}>En 3 pasos, listo</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
            {[
              { n: '01', title: 'Configurás tu marca', desc: 'Subís el logo, elegís colores y tipografía. El menú toma tu identidad automáticamente.' },
              { n: '02', title: 'Cargás tu carta', desc: 'Agregás categorías y platos con fotos. La IA mejora las imágenes y genera descripciones.' },
              { n: '03', title: 'Compartís el QR', desc: 'Descargás el QR personalizado y lo ponés en las mesas. Tus clientes ya pueden verlo.' },
            ].map(({ n, title, desc }) => (
              <div key={n}>
                <p style={{ fontSize: 64, fontWeight: 800, color: '#1a1a1a', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 16 }}>{n}</p>
                <p style={{ fontSize: 18, fontWeight: 600, color: '#f5f5f0', marginBottom: 10 }}>{title}</p>
                <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ maxWidth: 1100, margin: '0 auto', padding: '96px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, letterSpacing: '-0.03em', color: '#f5f5f0', marginBottom: 12 }}>Precios simples</h2>
          <p style={{ fontSize: 15, color: '#666' }}>30 días gratis. Sin tarjeta. Sin letra chica.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { name: 'Starter', price: '$8.000', features: ['1 local', 'Hasta 30 platos', 'Menú QR', 'Branding adaptativo'], highlight: false },
            { name: 'Pro', price: '$18.000', features: ['1 local', 'Platos ilimitados', 'QR con tu logo', 'Mejora IA de fotos', 'Dashboard de métricas'], highlight: true },
            { name: 'Multi', price: '$35.000', features: ['Hasta 5 locales', 'Todo lo de Pro', 'Menús por sucursal', 'Soporte prioritario'], highlight: false },
          ].map(({ name, price, features, highlight }) => (
            <div key={name} style={{ backgroundColor: highlight ? '#FF6B3510' : '#111', border: `1px solid ${highlight ? '#FF6B3540' : '#1f1f1f'}`, borderRadius: 16, padding: 28, position: 'relative' }}>
              {highlight && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#FF6B35', color: '#fff', fontSize: 11, fontWeight: 600, padding: '4px 14px', borderRadius: 99 }}>
                  Más elegido
                </div>
              )}
              <p style={{ fontSize: 14, fontWeight: 500, color: '#888', marginBottom: 8 }}>{name}</p>
              <p style={{ fontSize: 36, fontWeight: 700, color: '#f5f5f0', letterSpacing: '-0.03em', marginBottom: 24 }}>{price}<span style={{ fontSize: 13, fontWeight: 400, color: '#555' }}>/mes</span></p>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: 28 }}>
                {features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#aaa', paddingBottom: 10 }}>
                    <Check size={14} color="#FF6B35" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/sign-up" style={{ display: 'block', textAlign: 'center', backgroundColor: highlight ? '#FF6B35' : 'transparent', color: highlight ? '#fff' : '#f5f5f0', border: `1px solid ${highlight ? '#FF6B35' : '#2a2a2a'}`, padding: '12px 0', borderRadius: 10, fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>
                Empezar gratis
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ borderTop: '1px solid #1f1f1f', padding: '96px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(28px, 5vw, 56px)', fontWeight: 700, letterSpacing: '-0.04em', color: '#f5f5f0', marginBottom: 20 }}>
          Tu carta digital,<br /><span style={{ color: '#FF6B35' }}>en 5 minutos.</span>
        </h2>
        <p style={{ fontSize: 16, color: '#666', marginBottom: 36 }}>30 días gratis. Sin tarjeta de crédito.</p>
        <Link href="/sign-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#FF6B35', color: '#fff', padding: '16px 36px', borderRadius: 12, fontSize: 16, fontWeight: 600, textDecoration: 'none' }}>
          Crear mi menú ahora <ArrowRight size={18} />
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #1f1f1f', padding: '32px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: '#f5f5f0' }}>nomi</span>
            <span style={{ fontSize: 18, color: '#FF6B35' }}>.</span>
          </div>
          <p style={{ fontSize: 12, color: '#444' }}>© 2025 Nomi. Hecho en Argentina.</p>
          <div style={{ display: 'flex', gap: 24 }}>
            <a href="#" style={{ fontSize: 12, color: '#444', textDecoration: 'none' }}>Privacidad</a>
            <a href="#" style={{ fontSize: 12, color: '#444', textDecoration: 'none' }}>Términos</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
