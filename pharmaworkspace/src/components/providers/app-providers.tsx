'use client'

import type { ReactNode } from 'react'
import { ProfileProvider } from '@/contexts/profile-context'
import { QueryProvider } from '@/components/providers/query-provider'

// Note : SessionProvider (work_sessions / clock-in/out) est volontairement
// AILLEURS : il est injecté dans (app)/layout.tsx et (admin)/layout.tsx
// uniquement. C'est un concept "app", pas pertinent pendant l'onboarding,
// le signup ou les pages marketing → on évite des fetch inutiles (et les
// erreurs réseau visibles dans la console côté pilotes).
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <ProfileProvider>{children}</ProfileProvider>
    </QueryProvider>
  )
}
