'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import type { OrderWithDetails } from '@/types/index'

type Column<T> = {
  key: keyof T | string
  header: string
  sortable?: boolean
  render?: (value: unknown, row: T) => React.ReactNode
}

const columns: Column<OrderWithDetails>[] = [
  {
    key: 'supplier',
    header: 'Fournisseur',
    sortable: true,
    render: (_value, row) => (
      <div className="space-y-0.5">
        <span className="font-semibold text-slate-900">{row.supplier?.name ?? '-'}</span>
        {row.supplier?.contact_name && (
          <p className="text-xs font-medium text-slate-700">{row.supplier.contact_name}</p>
        )}
        {(row.supplier?.phone || row.supplier?.email) && (
          <p className="text-xs text-slate-500">
            {row.supplier?.phone ?? row.supplier?.email}
          </p>
        )}
      </div>
    ),
  },
  {
    key: 'items',
    header: 'Lignes',
    render: (_value, row) => (
      <span className="text-muted-foreground">
        {row.items.length} produit{row.items.length > 1 ? 's' : ''}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Statut',
    sortable: true,
    render: (_value, row) => <StatusBadge status={row.status} />,
  },
  {
    key: 'created_at',
    header: 'Date',
    sortable: true,
    render: (_value, row) => (
      <span className="text-sm text-muted-foreground">
        {new Date(row.created_at).toLocaleDateString('fr-FR')}
      </span>
    ),
  },
]

function getMobileCardBorderClass(order: OrderWithDetails): string {
  if (order.status === 'received') return 'border-teal-300'
  if (order.status === 'sent') return 'border-orange-300'
  return 'border-slate-300'
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(date)
}

type OrderTableProps = {
  orders: OrderWithDetails[]
  loading: boolean
  onRowClick: (order: OrderWithDetails) => void
}

export function OrderTable({ orders, loading, onRowClick }: OrderTableProps) {
  const renderMobileOrderCard = (row: OrderWithDetails) => {
    const isReceived = row.status === 'received'
    const supplierName = row.supplier?.name ?? '-'
    const supplierContact = row.supplier?.contact_name ?? null
    const itemsCount = row.items.length

    const dotColor = isReceived ? 'bg-teal-500'
                   : row.status === 'sent' ? 'bg-orange-500'
                   : 'bg-slate-400'

    return (
      <div className={cn('space-y-2', isReceived && 'opacity-80')}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} aria-hidden="true" />
            <p className={cn('line-clamp-2 min-w-0 flex-1 text-sm font-semibold leading-snug', isReceived ? 'text-slate-500' : 'text-slate-900')}>
              {supplierName}
            </p>
          </div>
          <StatusBadge status={row.status} size="sm" className="shrink-0 self-center" />
        </div>

        <p className="line-clamp-2 text-xs text-slate-500">
          {supplierContact ? `${supplierContact} · ` : ''}
          {itemsCount} produit{itemsCount > 1 ? 's' : ''}
          {row.notes ? ` · ${row.notes}` : ''}
        </p>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="ml-auto shrink-0">Créée le {formatDate(row.created_at)}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white p-2 shadow-sm">
      <DataTable<OrderWithDetails>
        data={orders}
        columns={columns}
        loading={loading}
        onRowClick={onRowClick}
        emptyMessage="Aucune commande trouvée."
        mobileRowClassName={getMobileCardBorderClass}
        mobileRowRender={renderMobileOrderCard}
      />
    </div>
  )
}


// ============================================================================
// FILE: src/components/rentals/rental-form.tsx
// ============================================================================
