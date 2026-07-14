'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuditLogTable } from '@/components/admin/audit-log-table'
import { useProfile } from '@/contexts/profile-context'

export default function AuditLogPage() {
  const router = useRouter()
  const { isAdmin, loading } = useProfile()

  useEffect(() => {
    if (loading) return
    if (!isAdmin) {
      router.replace('/dashboard')
    }
  }, [isAdmin, loading, router])

  if (loading || !isAdmin) {
    return <p className="text-sm text-muted-foreground">Chargement…</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Journal d&apos;audit</h1>
        <p className="text-sm text-muted-foreground">
          Historique des accès et modifications sensibles (ordonnances). Réservé au titulaire.
        </p>
      </div>
      <AuditLogTable />
    </div>
  )
}
