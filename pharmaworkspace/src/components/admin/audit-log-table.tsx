'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DataTable, type Column } from '@/components/shared/data-table'
import { getAuditLogEntries } from '@/lib/queries/audit-log'
import { AUDIT_ACTION_LABELS } from '@/config/constants'
import { useProfile } from '@/contexts/profile-context'
import type { AuditLogEntry } from '@/types/index'

const TARGET_TYPE_LABELS: Record<string, string> = {
  prescription: 'Ordonnance',
  prescription_comment: 'Commentaire',
  task: 'Tâche',
  order: 'Commande',
  supplier: 'Fournisseur',
  shortage: 'Rupture',
  rental: 'Location',
  contact: 'Contact',
  training_resource: 'Formation',
  work_session: 'Pointage',
  leave_request: 'Congé',
  member: 'Membre',
  invitation: 'Invitation',
  pharmacy: 'Officine',
  profile: 'Profil',
  chat_message: 'Message chat',
}

function formatActor(entry: AuditLogEntry): string {
  const actor = entry.actor
  if (!actor) return '-'
  const name =
    actor.display_name?.trim() ||
    [actor.first_name, actor.last_name].filter(Boolean).join(' ').trim()
  return name || 'Utilisateur'
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AuditLogTable() {
  const { pharmacy } = useProfile()
  const pharmacyId = pharmacy?.id ?? null

  const auditQuery = useQuery({
    queryKey: ['audit-log', pharmacyId] as const,
    enabled: Boolean(pharmacyId),
    queryFn: async () => {
      const result = await getAuditLogEntries(pharmacyId!)
      if (result.error) throw new Error(result.error)
      return result.data ?? []
    },
  })

  const entries = auditQuery.data ?? []
  const loading = auditQuery.isLoading || auditQuery.isFetching
  const error = (auditQuery.error as Error | null)?.message ?? null

  const columns = useMemo<Column<AuditLogEntry>[]>(
    () => [
      {
        key: 'created_at',
        header: 'Date',
        sortable: true,
        render: (value) => formatDate(String(value)),
      },
      {
        key: 'action',
        header: 'Action',
        render: (value) =>
          AUDIT_ACTION_LABELS[String(value)] ?? String(value),
      },
      {
        key: 'target_type',
        header: 'Cible',
        render: (_value, row) => {
          const label = TARGET_TYPE_LABELS[row.target_type] ?? row.target_type
          const shortId = row.target_id ? row.target_id.slice(0, 8) : ''
          return shortId ? `${label} (${shortId}…)` : label
        },
      },
      {
        key: 'user_id',
        header: 'Utilisateur',
        render: (_value, row) => formatActor(row),
      },
    ],
    []
  )

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>
  }

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white p-2 shadow-sm">
      <DataTable
        data={entries}
        columns={columns}
        loading={loading}
        emptyMessage="Aucune activité enregistrée pour le moment."
      />
    </div>
  )
}
