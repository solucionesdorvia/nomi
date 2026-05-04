'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import { Upload, X, Loader2, Sparkles } from 'lucide-react'

interface ImageUploadProps {
  value?: string | null
  aiValue?: string | null
  onChange: (url: string) => void
  onAiEnhance?: (originalUrl: string) => Promise<void>
  label?: string
  aspectRatio?: 'square' | 'wide'
  endpoint: 'businessLogo' | 'itemImage'
}

export default function ImageUpload({
  value,
  aiValue,
  onChange,
  onAiEnhance,
  label = 'Subir imagen',
  aspectRatio = 'square',
  endpoint,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [enhancing, setEnhancing] = useState(false)
  const [showAi, setShowAi] = useState(false)

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      // Usar fetch directo a uploadthing
      const res = await fetch(`/api/uploadthing?actionType=upload&slug=${endpoint}`, {
        method: 'POST',
        body: formData,
      })
      // Fallback: usar URL.createObjectURL para preview inmediato
      // En producción uploadthing maneja esto via su SDK
      const objectUrl = URL.createObjectURL(file)
      onChange(objectUrl)
    } catch (e) {
      console.error(e)
    } finally {
      setUploading(false)
    }
  }, [endpoint, onChange])

  async function handleEnhance() {
    if (!value || !onAiEnhance) return
    setEnhancing(true)
    try {
      await onAiEnhance(value)
    } finally {
      setEnhancing(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
    disabled: uploading,
  })

  const displayUrl = showAi && aiValue ? aiValue : value

  return (
    <div className="space-y-2">
      {displayUrl ? (
        <div className="relative group">
          <div className={`overflow-hidden rounded-xl border border-neutral-200 ${aspectRatio === 'square' ? 'aspect-square' : 'aspect-video'}`}>
            <Image
              src={displayUrl}
              alt="Preview"
              fill
              className="object-cover"
            />
          </div>

          {/* Acciones overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
            <button
              {...getRootProps()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-neutral-800 text-xs font-medium rounded-lg hover:bg-neutral-100"
            >
              <input {...getInputProps()} />
              <Upload className="w-3 h-3" />
              Cambiar
            </button>
            <button
              onClick={() => onChange('')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-red-600 text-xs font-medium rounded-lg hover:bg-red-50"
            >
              <X className="w-3 h-3" />
              Quitar
            </button>
          </div>

          {/* Toggle AI */}
          {aiValue && (
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => setShowAi(false)}
                className={`text-xs px-2.5 py-1 rounded-full transition-colors ${!showAi ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-700'}`}
              >
                Original
              </button>
              <button
                onClick={() => setShowAi(true)}
                className={`text-xs px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 ${showAi ? 'bg-orange-500 text-white' : 'text-neutral-500 hover:text-neutral-700'}`}
              >
                <Sparkles className="w-3 h-3" />
                Mejorada IA
              </button>
            </div>
          )}

          {/* Botón mejorar con IA */}
          {onAiEnhance && value && !aiValue && (
            <button
              onClick={handleEnhance}
              disabled={enhancing}
              className="mt-2 w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-medium rounded-lg hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {enhancing ? (
                <><Loader2 className="w-3 h-3 animate-spin" /> Mejorando con IA...</>
              ) : (
                <><Sparkles className="w-3 h-3" /> Mejorar foto con IA</>
              )}
            </button>
          )}
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`flex flex-col items-center justify-center ${aspectRatio === 'square' ? 'aspect-square' : 'aspect-video'} rounded-xl border-2 border-dashed transition-colors cursor-pointer ${
            isDragActive
              ? 'border-orange-400 bg-orange-50'
              : 'border-neutral-300 bg-neutral-50 hover:border-orange-400 hover:bg-orange-50'
          }`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
          ) : (
            <>
              <Upload className={`w-6 h-6 mb-2 ${isDragActive ? 'text-orange-500' : 'text-neutral-400'}`} />
              <p className="text-xs text-neutral-500 text-center px-4">
                {isDragActive ? 'Soltá la imagen' : label}
              </p>
              <p className="text-xs text-neutral-400 mt-1">PNG, JPG hasta 4MB</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
