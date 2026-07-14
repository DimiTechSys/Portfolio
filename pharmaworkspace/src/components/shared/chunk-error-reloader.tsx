'use client'

import { useEffect } from 'react'
import { isChunkLoadError, reloadOnceForChunkError } from '@/lib/errors/chunk-reload'

/**
 * Recharge la page (une fois) quand un chunk JS échoue à charger — typiquement
 * après un déploiement, l'onglet ouvert référence des chunks au hash périmé.
 * Écoute les erreurs non gérées (`error`) et les promesses rejetées
 * (`unhandledrejection`, où atterrissent souvent les imports dynamiques échoués).
 */
export function ChunkErrorReloader() {
  useEffect(() => {
    const maybeReload = (err: unknown) => {
      if (isChunkLoadError(err)) reloadOnceForChunkError()
    }
    const onError = (e: ErrorEvent) => maybeReload(e.error ?? e.message)
    const onRejection = (e: PromiseRejectionEvent) => maybeReload(e.reason)
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])
  return null
}
