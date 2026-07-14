'use client'

import { useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'

type InfiniteLoaderProps = {
  hasNextPage: boolean
  isLoading: boolean
  isError?: boolean
  onLoadMore: () => void
  /** Marge de déclenchement avant le bas de liste (préchargement fluide). */
  rootMargin?: string
}

/**
 * Zone unique de chargement en bas de liste (modèle « base Notion ») :
 * - une sentinelle IntersectionObserver auto-charge la page suivante au scroll ;
 * - le même élément est un <button> cliquable → repli accessibilité / clavier ;
 * - sur erreur, l'auto-load est stoppé et le bouton passe à « Réessayer » (repli manuel).
 * Rien n'est rendu quand il n'y a plus de page.
 */
export function InfiniteLoader({
  hasNextPage,
  isLoading,
  isError = false,
  onLoadMore,
  rootMargin = '250px',
}: InfiniteLoaderProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // Pas d'auto-load s'il n'y a plus de page, si un chargement est en cours,
    // après une erreur (repli manuel), ou sans IntersectionObserver (repli bouton).
    if (!hasNextPage || isLoading || isError) return
    if (typeof IntersectionObserver === 'undefined') return
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore()
      },
      { rootMargin }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isLoading, isError, onLoadMore, rootMargin])

  if (!hasNextPage) return null

  return (
    <div ref={sentinelRef} className="flex justify-center pt-2">
      {isLoading ? (
        <span className="inline-flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Chargement…
        </span>
      ) : (
        <button
          type="button"
          onClick={onLoadMore}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          {isError ? 'Réessayer' : 'Charger plus'}
        </button>
      )}
    </div>
  )
}
