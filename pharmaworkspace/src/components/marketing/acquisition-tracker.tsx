'use client'

import { useEffect } from 'react'
import { captureAcquisitionFromUrl } from '@/lib/analytics/acquisition'

/**
 * Capture les `utm_*` + `source` + referrer externe au 1er hit sur n'importe
 * quelle page marketing (`/`, `/tarifs`, `/securite`, `/signup`, …). Stocke en
 * sessionStorage pour que `SignupForm` puisse les ré-injecter même si la page
 * `/signup` n'a pas reçu directement les UTMs.
 *
 * Monté dans `(marketing)/layout.tsx`. Ne rend rien.
 */
export function AcquisitionTracker() {
  useEffect(() => {
    captureAcquisitionFromUrl()
  }, [])

  return null
}
