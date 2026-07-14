'use client'

import { Suspense, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

import { DataTable } from '@/components/shared/data-table'
import { LoadMoreButton } from '@/components/shared/load-more-button'
import { StatusBadge } from '@/components/shared/status-badge'
import { PrescriptionDrawer } from '@/components/prescriptions/prescription-drawer'
import { usePrescriptions } from '@/features/prescriptions'
import type { Prescription } from '@/types/index'
import { cn } from '@/lib/utils'

function getMobileCardBorderClass(prescription: Prescription): string {
  if (prescription.status === 'served') return 'border-green-300'
  if (prescription.status === 'to_serve') return 'border-orange-300'
  if (prescription.status === 'expired') return 'border-red-300'
  return 'border-slate-300'
}

function getPriorityDotClass(priority: Prescription['priority']): string {
  switch (priority) {
    case 'high':
      return 'bg-red-500'
    case 'medium':
      return 'bg-orange-400'
    case 'low':
      return 'bg-blue-500'
    default:
      return 'bg-slate-300'
  }
}

export function CompletedPrescriptionsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    prescriptions,
    loading,
    refresh,
    updatePrescription,
    deletePrescription,
    hasNextPage,
    fetchNextPage,
    fetchingNextPage,
  } = usePrescriptions({ status: 'served' })

  const completedPrescriptions = useMemo(() => {
    return [...prescriptions].sort((a, b) => {
        const aTime = a.execution_date ? new Date(a.execution_date).getTime() : 0
        const bTime = b.execution_date ? new Date(b.execution_date).getTime() : 0
        return bTime - aTime // Newest first
      })
  }, [prescriptions])

  const selectedId = searchParams.get('id')
  const drawerOpen = Boolean(selectedId)

  const openDrawer = useCallback(
    (row: Prescription) => {
      router.push(`/prescriptions/completed?id=${row.id}`)
    },
    [router]
  )

  const closeDrawer = useCallback(() => {
    router.push('/prescriptions/completed')
  }, [router])

  const renderMobilePrescriptionCard = useCallback(
    (row: Prescription) => (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <span
              className={cn('h-2 w-2 shrink-0 rounded-full', getPriorityDotClass(row.priority))}
              aria-hidden
            />
            <p className="line-clamp-2 min-w-0 flex-1 text-sm font-semibold leading-snug text-slate-900">
              {row.patient_ref ?? '-'}
            </p>
          </div>
          <StatusBadge status={row.status} size="sm" className="shrink-0 self-center" />
        </div>

        <p className="line-clamp-2 text-xs text-slate-500">
          {row.missing_products || 'Aucun produit manquant'}
        </p>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="ml-auto shrink-0">
            Traitée le: {row.execution_date ? new Date(row.execution_date).toLocaleDateString('fr-FR') : '-'}
          </span>
        </div>
      </div>
    ),
    []
  )

  const columns = useMemo(
    () => [
      {
        key: 'patient_ref' as const,
        header: 'Patient',
        sortable: true,
      },
      {
        key: 'missing_products' as const,
        header: 'Produits manquants',
        render: (value: unknown) =>
          value ? (
            <span className="text-orange-600 text-sm">{String(value)}</span>
          ) : (
            <span className="text-muted-foreground text-sm">-</span>
          ),
      },
      {
        key: 'execution_date' as const,
        header: 'Traitée le',
        sortable: true,
        render: (value: unknown) =>
          value ? new Date(String(value)).toLocaleDateString('fr-FR') : '-',
      },
    ],
    []
  )

  return (
    <div className="min-h-screen space-y-4 bg-slate-50 -m-6 p-6">
      <button
        type="button"
        onClick={() => router.push('/prescriptions')}
        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
      >
        <ChevronLeft className="h-4 w-4" />
        Retour
      </button>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
          Ordonnances traitées
        </h2>
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-2 shadow-sm">
          <DataTable
            data={completedPrescriptions}
            columns={columns}
            loading={loading}
            onRowClick={openDrawer}
            emptyMessage="Aucune ordonnance terminée."
            mobileRowClassName={(row) => getMobileCardBorderClass(row)}
            mobileRowRender={renderMobilePrescriptionCard}
          />
        </div>
        <LoadMoreButton
          hasMore={hasNextPage}
          loading={fetchingNextPage}
          onLoadMore={() => void fetchNextPage()}
        />
      </section>

      <PrescriptionDrawer
        prescriptionId={selectedId}
        open={drawerOpen}
        onClose={closeDrawer}
        onUpdate={async (id, payload) => {
          await updatePrescription(id, payload)
          refresh()
        }}
        onDelete={async (id) => {
          await deletePrescription(id)
          refresh()
        }}
      />
    </div>
  )
}

export default function CompletedPrescriptionsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}>
      <CompletedPrescriptionsContent />
    </Suspense>
  )
}
