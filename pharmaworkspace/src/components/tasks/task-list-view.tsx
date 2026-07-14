'use client'

import React from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { DataTable, type Column } from '@/components/shared/data-table'
import { PriorityBadge } from '@/components/shared/priority-badge'
import { StatusBadge } from '@/components/shared/status-badge'
import { getTaskDescriptionText } from '@/lib/tasks/task-attachments'
import type { TaskStatus, TaskWithProfiles } from '@/types/index'

interface TaskListViewProps {
  tasks: TaskWithProfiles[]
  loading: boolean
  onRowClick: (task: TaskWithProfiles) => void
  onQuickDone?: (task: TaskWithProfiles) => void
  onTakeTask?: (task: TaskWithProfiles) => void
  emptyMessage?: string
  highlightRowId?: string | null
  hideAssignedToOnMobile?: boolean
  showTakeButtonOnMobile?: boolean
}

function formatDate(value: string | null): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(date)
}

function getPriorityBorder(priority: TaskWithProfiles['priority']): string {
  if (priority === 'high') return 'border-l-red-500'
  if (priority === 'medium') return 'border-l-orange-400'
  return 'border-l-blue-500'
}

function getPriorityDot(priority: TaskWithProfiles['priority']): string {
  if (priority === 'high') return 'bg-red-500'
  if (priority === 'medium') return 'bg-orange-400'
  return 'bg-blue-500'
}

function getMobileCardBorderClass(task: TaskWithProfiles): string {
  if (task.status === 'done') return 'border-green-300'
  if (task.status === 'todo') return 'border-orange-300'
  if (task.status === 'cancelled') return 'border-red-300'
  return 'border-slate-300'
}

export function TaskListView({
  tasks,
  loading,
  onRowClick,
  onQuickDone,
  onTakeTask,
  emptyMessage = 'Aucune tâche.',
  highlightRowId,
  hideAssignedToOnMobile = false,
  showTakeButtonOnMobile = false,
}: TaskListViewProps) {
  const renderMobileTaskCard = (row: TaskWithProfiles) => {
    const due = row.due_date ? new Date(row.due_date) : null
    const isOverdue =
      !!due &&
      row.status !== 'done' &&
      row.status !== 'cancelled' &&
      due.getTime() < new Date(new Date().toDateString()).getTime()

    const assignedLabel =
      row.assigned_to_profile?.display_name || row.assigned_to || ''

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${getPriorityDot(row.priority)}`}
              aria-hidden
            />
            <p className="line-clamp-2 min-w-0 flex-1 text-sm font-semibold leading-snug text-slate-900">
              {row.title}
            </p>
            {isOverdue ? (
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-orange-500" aria-hidden />
            ) : null}
          </div>
          {showTakeButtonOnMobile && row.status === 'todo' && onTakeTask ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onTakeTask?.(row)
              }}
              className="shrink-0 self-center rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-medium text-teal-700 transition-colors hover:bg-teal-100"
            >
              Prendre la tâche
            </button>
          ) : (
            <StatusBadge
              status={row.status as TaskStatus}
              size="sm"
              className="shrink-0 self-center"
            />
          )}
        </div>

        {getTaskDescriptionText(row) && (
          <p className="line-clamp-2 text-xs text-slate-500">{getTaskDescriptionText(row)}</p>
        )}

        <div className="flex items-center gap-2 text-xs text-slate-500">
          {!hideAssignedToOnMobile && assignedLabel && (
            <span className="truncate">
              {assignedLabel}
            </span>
          )}
          <span className="ml-auto shrink-0">
            Échéance: {formatDate(row.due_date)}
          </span>
        </div>
      </div>
    )
  }

  const columns: Column<TaskWithProfiles>[] = [
    {
      key: 'title',
      header: 'Titre',
      render: (_value, row) => (
        <div className={`space-y-1 md:border-l-2 md:pl-2 ${getPriorityBorder(row.priority)}`}>
          <div className="font-medium text-slate-900">{row.title}</div>
          <div className="line-clamp-1 text-xs text-slate-500">
            {getTaskDescriptionText(row) || '-'}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      render: (value) => <StatusBadge status={value as TaskStatus} size="sm" />,
    },
    {
      key: 'priority',
      header: 'Priorité',
      render: (value) => (
        <PriorityBadge priority={value as TaskWithProfiles['priority']} size="sm" />
      ),
    },
    {
      key: 'assigned_to',
      header: 'Assigné à',
      render: (_value, row) =>
        row.assigned_to_profile?.display_name || row.assigned_to || '-',
    },
    {
      key: 'due_date',
      header: 'Échéance',
      render: (value) => formatDate((value as string | null) ?? null),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (_value, row) => {
        const canTake =
          Boolean(onTakeTask) &&
          row.status === 'todo' &&
          !row.assigned_to
        const canQuickDone =
          row.status !== 'done' &&
          row.status !== 'cancelled' &&
          Boolean(row.assigned_to) &&
          Boolean(onQuickDone)

        if (canTake) {
          return (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onTakeTask?.(row)
              }}
              className="inline-flex shrink-0 items-center rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-medium text-teal-700 transition-colors hover:bg-teal-100"
            >
              Prendre la tâche
            </button>
          )
        }

        if (!canQuickDone) return null
        return (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onQuickDone?.(row)
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-600"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
            Terminer
          </button>
        )
      },
    },
  ]

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white p-2 shadow-sm">
      <DataTable<TaskWithProfiles>
        data={tasks}
        columns={columns}
        loading={loading}
        onRowClick={onRowClick}
        emptyMessage={emptyMessage}
        highlightRowId={highlightRowId}
        mobileRowClassName={getMobileCardBorderClass}
        mobileRowRender={renderMobileTaskCard}
      />
    </div>
  )
}
