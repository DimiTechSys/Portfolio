'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ShortageTable } from '@/components/shortages/shortage-table'

export default function ResolvedShortagesPage() {
  return (
    <div className="min-h-screen space-y-4 bg-slate-50 -m-6 p-6">
      <Link
        href="/shortages"
        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
      >
        <ChevronLeft className="h-4 w-4" />
        Retour
      </Link>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
          Ruptures résolues
        </h2>
        <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}>
          <ShortageTable isResolvedView={true} />
        </Suspense>
      </section>
    </div>
  )
}
