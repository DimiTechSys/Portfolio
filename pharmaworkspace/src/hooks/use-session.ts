'use client'

import { useSessionContext } from '@/contexts/session-context'

export function useSession() {
  return useSessionContext()
}
