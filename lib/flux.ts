import Replicate from 'replicate'

// Lazy: solo instanciamos el cliente cuando alguien lo necesita.
// Si REPLICATE_API_TOKEN falta, tira un error claro pero no rompe el build.
let _replicate: Replicate | null = null

function getReplicate(): Replicate {
  if (_replicate) return _replicate
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) throw new Error('REPLICATE_API_TOKEN no esta configurada en el entorno')
  _replicate = new Replicate({ auth: token })
  return _replicate
}

export function isFluxAvailable(): boolean {
  return Boolean(process.env.REPLICATE_API_TOKEN)
}

// Genera una imagen 1024x1024 con Flux Pro 1.1 desde texto, via Replicate.
// Devuelve la URL del PNG en el CDN de Replicate.
export async function generateImageWithFlux(prompt: string): Promise<string> {
  const replicate = getReplicate()
  const output = await replicate.run(
    'black-forest-labs/flux-1.1-pro',
    {
      input: {
        prompt,
        aspect_ratio: '1:1',
        output_format: 'png',
        output_quality: 90,
        safety_tolerance: 2,
        prompt_upsampling: false,
      },
    }
  )

  // Replicate Flux 1.1 Pro suele devolver un ReadableStream o una URL string,
  // segun la version del SDK. Normalizamos.
  let url: string | null = null
  if (typeof output === 'string') {
    url = output
  } else if (Array.isArray(output) && typeof output[0] === 'string') {
    url = output[0]
  } else if (output && typeof output === 'object' && 'url' in output) {
    const u = (output as { url: unknown }).url
    if (typeof u === 'function') {
      const r = (u as () => unknown)()
      url = r instanceof URL ? r.toString() : (typeof r === 'string' ? r : null)
    } else if (u instanceof URL) {
      url = u.toString()
    } else if (typeof u === 'string') {
      url = u
    }
  }

  if (!url) {
    throw new Error('Flux/Replicate devolvio respuesta no esperada: ' + JSON.stringify(output).slice(0, 200))
  }
  return url
}
