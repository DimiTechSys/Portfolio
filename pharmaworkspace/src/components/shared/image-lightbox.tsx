'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { SignedImage } from '@/components/shared/signed-image'
import type { SignedBucket } from '@/lib/storage/get-signed-url'

type ImageLightboxProps = {
  bucket?: SignedBucket
  path: string
  alt?: string
  onClose: () => void
}

/**
 * Aperçu plein écran d'une image du storage, IN-APP (aucun nouvel onglet).
 * Ferme au clic sur le fond, sur la croix, ou avec Échap.
 */
export function ImageLightbox({ bucket = 'attachments', path, alt = '', onClose }: ImageLightboxProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
        aria-label="Fermer l'aperçu"
      >
        <X className="h-5 w-5" />
      </button>
      <SignedImage
        bucket={bucket}
        path={path}
        alt={alt}
        className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}
