import { Suspense } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { ShortageTable } from '@/components/shortages/shortage-table'

export default function ShortagesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ruptures</h1>
          <p className="text-sm text-muted-foreground">
            Suivez et gérez les ruptures de stock.
          </p>
        </div>
        <Link
          href="/shortages?create=1"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition-transform active:scale-95"
          aria-label="Signaler une nouvelle rupture"
        >
          <Plus className="h-6 w-6" />
        </Link>
      </div>

      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Chargement…</p>
        }
      >
        <ShortageTable />
      </Suspense>
    </div>
  )
}


// ============================================================================
// FILE: src/components/prescriptions/prescription-drawer.tsx
// ============================================================================
