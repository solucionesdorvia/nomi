import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 text-center px-4">
      <p className="text-6xl font-bold text-neutral-200 mb-4">404</p>
      <h1 className="text-xl font-semibold text-neutral-800 mb-2">Página no encontrada</h1>
      <p className="text-neutral-500 mb-8 text-sm">El menú o la página que buscás no existe o fue eliminado.</p>
      <Link href="/" className="px-5 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">
        Ir al inicio
      </Link>
    </div>
  )
}
