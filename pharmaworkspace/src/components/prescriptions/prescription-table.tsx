'use client'

import { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DataTable } from '@/components/shared/data-table'
import { DetailDrawer } from '@/components/shared/detail-drawer'
import { StatusBadge } from '@/components/shared/status-badge'
import { PriorityBadge } from '@/components/shared/priority-badge'
import { PrescriptionDrawer } from '@/components/prescriptions/prescription-drawer'
import { PrescriptionForm } from '@/components/prescriptions/prescription-form'
import { LoadMoreButton } from '@/components/shared/load-more-button'
import { SearchInput } from '@/components/shared/search-input'
import { useProfile } from '@/contexts/profile-context'
import { prescriptionsService, usePrescriptions } from '@/features/prescriptions'
import type { Prescription, PrescriptionItem, PrescriptionStatus, PrescriptionWithItems } from '@/types/index'

const PRESCRIPTION_STATUS_FILTER_ITEMS: {
  value: PrescriptionStatus | 'all'
  label: string
}[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'to_serve', label: 'À traiter' },
  { value: 'expired', label: 'Expiré' },
]

function getMobileCardBorderClass(prescription: Prescription): string {
  if (prescription.status === 'served') return 'border-teal-300'
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

export function PrescriptionTable() {
  const { push } = useRouter()
  const searchParams = useSearchParams()

  const [statusFilter, setStatusFilter] = useState<
    PrescriptionStatus | 'all'
  >('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const { pharmacy } = useProfile()

  const {
    prescriptions,
    loading,
    updatePrescription,
    deletePrescription,
    refresh,
    hasNextPage,
    fetchNextPage,
    fetchingNextPage,
  } = usePrescriptions()

  const searchTerm = debouncedSearch.trim()
  const isSearchActive = Boolean(searchTerm && pharmacy?.id)

  const searchQuery = useQuery({
    queryKey: ['prescriptions-search', pharmacy?.id, searchTerm] as const,
    enabled: isSearchActive,
    queryFn: async () => {
      const result = await prescriptionsService.searchPrescriptions(pharmacy!.id, searchTerm)
      if (result.error) throw new Error(result.error)
      return result.data ?? []
    },
  })

  const searchLoading = searchQuery.isFetching

  // Filtering Logic
  const allFiltered = useMemo(() => {
    const source = isSearchActive ? (searchQuery.data ?? []) : prescriptions
    return source
      .filter((p) => {
        if (statusFilter === 'all' && p.status === 'served') return false

        const matchesStatus = statusFilter === 'all' || p.status === statusFilter
        if (!matchesStatus) return false

        return true
      })
      .sort((a, b) => {
        const aTime = a.execution_date ? new Date(a.execution_date).getTime() : Number.MAX_SAFE_INTEGER
        const bTime = b.execution_date ? new Date(b.execution_date).getTime() : Number.MAX_SAFE_INTEGER
        return aTime - bTime
      })
  }, [isSearchActive, searchQuery.data, prescriptions, statusFilter])

  const processedCount = useMemo(
    () => prescriptions.filter((p) => p.status === 'served').length,
    [prescriptions]
  )

  const selectedId = searchParams.get('id')
  const drawerOpen = Boolean(selectedId)
  const createDialogOpen = searchParams.get('create') === '1'

  const openDrawer = useCallback(
    (row: Prescription) => {
      push(`/prescriptions?id=${row.id}`)
    },
    [push]
  )

  const closeDrawer = useCallback(() => {
    push('/prescriptions')
  }, [push])

  const closeCreateDialog = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('create')
    const query = params.toString()
    push(query ? `/prescriptions?${query}` : '/prescriptions')
  }, [push, searchParams])

  const handleQuickProcess = useCallback(
    async (row: Prescription) => {
      if (row.status === 'served' || row.status === 'expired') return
      await updatePrescription(row.id, { status: 'served' })
      await refresh()
    },
    [refresh, updatePrescription]
  )

  const columns = useMemo(
    () => [
      {
        key: 'patient_ref' as const,
        header: 'Patient',
        sortable: true,
      },
      {
        key: 'status' as const,
        header: 'Statut',
        sortable: true,
        render: (value: unknown) => (
          <StatusBadge status={value as PrescriptionStatus} />
        ),
      },
      {
        key: 'priority' as const,
        header: 'Priorité',
        sortable: true,
        render: (value: unknown) => (
          <PriorityBadge priority={value as Prescription['priority']} />
        ),
      },

      {
        key: 'execution_date' as const,
        header: 'Échéance',
        sortable: true,
        render: (value: unknown) =>
          value ? new Date(String(value)).toLocaleDateString('fr-FR') : '-',
      },
      {
        key: 'actions' as const,
        header: '',
        className: 'text-right',
        render: (_value: unknown, row: Prescription) => {
          const canQuickProcess = row.status !== 'served' && row.status !== 'expired'
          if (!canQuickProcess) return null
          return (
            <button
              type="button"
              onClick={async (event) => {
                event.stopPropagation()
                await handleQuickProcess(row)
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-600"
              aria-label={`Traiter l'ordonnance ${row.patient_ref ?? ''}`}
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
              Traiter
            </button>
          )
        },
      },
    ],
    [handleQuickProcess]
  )

  const renderMobilePrescriptionCard = useCallback(
    (row: Prescription) => {
      const isServed = row.status === 'served'
      const isOverdue =
        row.execution_date &&
        !isServed &&
        row.status !== 'expired' &&
        new Date(row.execution_date).getTime() < new Date().getTime()

      const dotColor = isServed ? 'bg-teal-500' : getPriorityDotClass(row.priority)

      return (
        <div className={cn('space-y-2', isServed && 'opacity-80')}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <span
                className={cn('h-2 w-2 shrink-0 rounded-full', dotColor)}
                aria-hidden
              />
              <p className={cn('line-clamp-2 min-w-0 flex-1 text-sm font-semibold leading-snug', isServed ? 'text-slate-500' : 'text-slate-900')}>
                {(() => {
                  const items = (row as PrescriptionWithItems).items
                  return items && items.length > 0
                    ? items.map((i: PrescriptionItem) => i.medication_name).join(', ')
                    : 'Aucun médicament saisi'
                })()}
              </p>
              {isOverdue && (
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
              )}
            </div>
          </div>

          <p className="line-clamp-2 text-xs text-slate-500 font-medium">
            Patient: {row.patient_ref ?? '-'}
          </p>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className={cn('ml-auto shrink-0', isOverdue && 'text-red-500 font-medium')}>
              Échéance: {row.execution_date ? new Date(row.execution_date).toLocaleString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }).replace(':', 'h') : '-'}
            </span>
          </div>
        </div>
      )
    },
    []
  )

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <SearchInput
          value={search}
          onValueChange={setSearch}
          onDebouncedChange={setDebouncedSearch}
          placeholder="Rechercher une ordonnance…"
          className="h-11 w-full rounded-xl border-slate-200 bg-white pl-4 pr-10 shadow-sm focus:border-teal-500 focus:ring-teal-500"
        />
      </div>

      {/* Filters (Status Pills) */}
      <div className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max gap-2 pb-1">
          {PRESCRIPTION_STATUS_FILTER_ITEMS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatusFilter(value)}
              className={cn(
                'rounded-full border px-3 py-2 text-xs font-medium transition-all',
                statusFilter === value
                  ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {statusFilter === 'all' && processedCount > 0 && (
        <div className="flex items-center justify-between gap-2 lg:hidden">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
            Ordonnances en cours
          </h2>
          <button
            type="button"
            onClick={() => push('/prescriptions/completed')}
            className="inline-flex items-center gap-1 text-xs font-medium"
          >
            <span className="text-slate-500">{processedCount} traitée(s)</span>
            <span className="text-teal-600 underline underline-offset-2">Afficher</span>
          </button>
        </div>
      )}

      <div>
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-2 shadow-sm">
          <DataTable
            data={allFiltered}
            columns={columns}
            loading={loading || searchLoading}
            onRowClick={openDrawer}
            emptyMessage="Aucune ordonnance scannée pour l'instant. Scannez-en une pour la voir apparaître ici."
            mobileRowClassName={(row) => getMobileCardBorderClass(row)}
            mobileRowRender={renderMobilePrescriptionCard}
          />
        </div>
        {!isSearchActive ? (
          <LoadMoreButton
            hasMore={hasNextPage}
            loading={fetchingNextPage}
            onLoadMore={() => void fetchNextPage()}
          />
        ) : null}
      </div>

      {/* Drawer de détail */}
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

      <DetailDrawer
        open={createDialogOpen}
        onClose={closeCreateDialog}
        title="Nouvelle ordonnance"
        width="lg"
      >
        <PrescriptionForm
          onSubmit={async () => {}}
          onCreated={async () => {
            closeCreateDialog()
            await refresh()
          }}
          onCancel={closeCreateDialog}
        />
      </DetailDrawer>

    </div>
  )
}
