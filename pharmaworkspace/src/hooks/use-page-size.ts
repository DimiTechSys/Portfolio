'use client'

import { useState } from 'react'

// Taille de lot de pagination, responsive : 20 sur desktop, 10 sur mobile.
// Calculée une fois au montage (stable pour la session) pour ne pas changer la clé
// de pagination en cours de navigation.
export function usePageSize(desktop = 20, mobile = 10): number {
  const [size] = useState<number>(() => {
    if (typeof window === 'undefined') return desktop
    return window.innerWidth >= 1024 ? desktop : mobile
  })
  return size
}
