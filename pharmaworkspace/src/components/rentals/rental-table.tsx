'use client'

import { DataTable, type Column } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { AlertTriangle } from 'lucide-react'
import type { Rental, RentalStatus } from '@/types/index'
import { cn } from '@/lib/utils'

function getCardState(rental: Rental): 'retard' | 'en_cours' | 'retournee' {
  if (rental.status === 'returned') return 'retournee'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const retour = new Date(rental.expected_return)
  if (today > retour) return 'retard'
  return 'en_cours'
}

function getMobileCardBorderClass(rental: Rental): string {
  const state = getCardState(rental)
  if (state === 'retard') return 'border-red-300'
  if (state === 'retournee') return 'border-teal-300'
  return 'border-orange-300'
}

const columns: Column<Rental>[] = [
  {
    key: 'equipment',
    header: 'Équipement',
    sortable: true,
    render: (_value, row) => (
      <div className="flex items-center gap-2">
        <span className="font-medium">{row.equipment}</span>
        {row.status === 'overdue' && (
          <AlertTriangle className="h-4 w-4 text-orange-500" />
        )}
      </div>
    ),
  },
  {
    key: 'status',
    header: 'Statut',
    sortable: true,
    render: (_value, row) => <StatusBadge status={row.status as RentalStatus} />,
  },
  {
    key: 'expected_return',
    header: 'Retour prévu',
    sortable: true,
    render: (_value, row) => (
      <span
        className={`text-sm ${
          row.status === 'overdue'
            ? 'text-orange-600 font-medium'
            : 'text-muted-foreground'
        }`}
      >
        {row.expected_return
          ? new Date(row.expected_return).toLocaleDateString('fr-FR')
          : '-'}
      </span>
    ),
  },
  {
    key: 'created_at',
    header: 'Créée le',
    sortable: true,
    render: (_value, row) => (
      <span className="text-sm text-muted-foreground">
        {new Date(row.created_at).toLocaleDateString('fr-FR')}
      </span>
    ),
  },
]

type RentalTableProps = {
  rentals: Rental[]
  loading: boolean
  onRowClick: (rental: Rental) => void
  onIncrementPayment?: (rental: Rental) => void
  onMarkAsReturned?: (rental: Rental) => void
  highlightRowId?: string | null
}

export function RentalTable({
  rentals,
  loading,
  onRowClick,
  onIncrementPayment: _onIncrementPayment,
  onMarkAsReturned: _onMarkAsReturned,
  highlightRowId
}: RentalTableProps) {
  
  const renderMobileRentalCard = (row: Rental) => {
    const state = getCardState(row)
    const isReturned = state === 'retournee'
    const dotColor = state === 'retard' ? 'bg-red-500' : isReturned ? 'bg-teal-500' : 'bg-orange-500'

    return (
      <div className={cn("space-y-2", isReturned && "opacity-80")}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} aria-hidden="true" />
            <p className={cn(
              "line-clamp-2 min-w-0 flex-1 text-sm font-semibold leading-snug",
              isReturned ? "text-slate-500" : "text-slate-900"
            )}>
              {row.equipment}
            </p>
            {state === 'retard' && (
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-orange-500" />
            )}
          </div>
          <StatusBadge status={row.status as RentalStatus} size="sm" className="shrink-0 self-center" />
        </div>

        <p className="line-clamp-2 text-xs text-slate-500">
          <span className="font-medium text-slate-700">{row.client_name ?? 'Client inconnu'}</span>
          {' · '}
          {row.daily_rate ? `${(row.daily_rate * 7).toFixed(2)} €/sem.` : '-'}
          {row.deposit ? ` (Caut. ${row.deposit}€)` : ''}
        </p>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>{isReturned ? 'Retour:' : 'Prévu:'} {new Date(isReturned && row.returned_at ? row.returned_at : row.expected_return).toLocaleDateString('fr-FR')}</span>
          <span className="ml-auto shrink-0">Créée: {new Date(row.created_at).toLocaleDateString('fr-FR')}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white p-2 shadow-sm">
      <DataTable<Rental>
        data={rentals}
        columns={columns}
        loading={loading}
        onRowClick={onRowClick}
        emptyMessage="Aucun matériel actuellement loué à un patient."
        highlightRowId={highlightRowId}
        mobileRowClassName={getMobileCardBorderClass}
        mobileRowRender={renderMobileRentalCard}
      />
    </div>
  )
}