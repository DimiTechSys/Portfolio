'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { PrescriptionTable } from '@/components/prescriptions/prescription-table'

export default function PrescriptionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ordonnances</h1>
          <p className="text-sm text-muted-foreground">
            Gérez les ordonnances de l&apos;officine.
          </p>
        </div>
        <Link
          href="/prescriptions?create=1"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition-transform active:scale-95"
          aria-label="Créer une nouvelle ordonnance"
        >
          <Plus className="h-6 w-6" />
        </Link>
      </div>

      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Chargement…</p>
        }
      >
        <PrescriptionTable />
      </Suspense>
    </div>
  )
}


// ============================================================================
// FILE: src/app/(app)/shortages/page.tsx
// ============================================================================
