'use client'

import { useEffect } from 'react'
import { capture } from '@/lib/analytics/posthog'

/**
 * Composant client-only qui fire l'event PostHog `landing_view` au mount
 * de la page d'accueil. Ne rend rien visuellement.
 *
 * Pourquoi un composant séparé : la page `/` est rendue en RSC (static).
 * On a besoin d'une frontière client pour appeler `capture()` côté browser
 * sans transformer toute la landing en client component (coût SSR + LCP).
 *
 * La capture des `utm_*` est faite dans `AcquisitionTracker` (layout marketing),
 * qui couvre toutes les pages publiques, pas seulement `/`.
 */
export function LandingViewTracker() {
  useEffect(() => {
    capture('landing_view')
  }, [])

  return null
}
