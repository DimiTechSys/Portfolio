'use client'

import React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { TASK_DONE_REQUIRES_ASSIGNEE } from '@/features/tasks'
import { getTaskDescriptionText } from '@/lib/tasks/task-attachments'
import { cn } from '@/lib/utils'
import type { TaskStatus, TaskWithProfiles } from '@/types/index'

interface TaskKanbanViewProps {
  tasks: TaskWithProfiles[]
  loading: boolean
  onStatusChange: (taskId: string, newStatus: TaskStatus) => Promise<void>
}

const COLUMNS = [
  { id: 'todo', label: 'À FAIRE', textColor: 'text-slate-500' },
  { id: 'done', label: 'TERMINÉ', textColor: 'text-green-600' },
] as const

function formatDateAbbr(dateStr: string | null): { text: string; isOverdue: boolean } {
  if (!dateStr) return { text: '', isOverdue: false }
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return { text: '', isOverdue: false }

  const now = new Date()
  const isOverdue = date < now && date.toDateString() !== now.toDateString()

  const formatter = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
  })
  return { text: formatter.format(date), isOverdue }
}

const PRIORITY_STYLES = {
  high: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    dot: 'bg-red-500',
    border: 'border-red-200 hover:border-red-300',
    label: 'Haute',
  },
  medium: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    dot: 'bg-orange-400',
    border: 'border-orange-200 hover:border-orange-300',
    label: 'Moyenne',
  },
  low: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    dot: 'bg-blue-500',
    border: 'border-blue-200 hover:border-blue-300',
    label: 'Basse',
  },
}

export function TaskKanbanView({
  tasks,
  loading,
  onStatusChange,
}: TaskKanbanViewProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-2xl bg-slate-50 p-3">
            <div className="mb-3 h-4 w-1/2 rounded bg-slate-200" />
            <div className="mb-2 h-20 rounded-xl border border-slate-200 bg-white" />
            <div className="mb-2 h-16 rounded-xl border border-slate-200 bg-white" />
            <div className="h-24 rounded-xl border border-slate-200 bg-white" />
          </div>
        ))}
      </div>
    )
  }

  const tasksByStatus = tasks.reduce((acc, task) => {
    if (!acc[task.status]) acc[task.status] = []
    acc[task.status].push(task)
    return acc
  }, {} as Record<string, TaskWithProfiles[]>)

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {COLUMNS.map((col) => {
        const columnTasks = tasksByStatus[col.id] ?? []
        return (
          <div
            key={col.id}
            className="flex min-h-[200px] flex-col gap-2 rounded-2xl bg-slate-50 p-3"
          >
            {/* Header */}
            <div className="mb-2 flex items-center justify-between">
              <span
                className={cn(
                  'text-xs font-semibold uppercase tracking-wide',
                  col.textColor
                )}
              >
                {col.label}
              </span>
              <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-500">
                {columnTasks.length}
              </span>
            </div>

            {/* Tasks */}
            {columnTasks.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-slate-200 p-4 text-center">
                <p className="text-xs text-slate-400">Aucune tâche</p>
              </div>
            ) : (
              columnTasks.map((task) => {
                const priorityStyle = PRIORITY_STYLES[task.priority as keyof typeof PRIORITY_STYLES]
                const { text: dateText, isOverdue } = formatDateAbbr(task.due_date)
                const isDone = task.status === 'done'

                return (
                  <div
                    key={task.id}
                    className={cn(
                      'rounded-xl border bg-white p-3 transition-colors',
                      priorityStyle.border,
                      isDone && 'opacity-60'
                    )}
                  >
                    <p className="text-sm font-medium text-slate-800">{task.title}</p>
                    {getTaskDescriptionText(task) && (
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                        {getTaskDescriptionText(task)}
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                      {/* Priority Badge */}
                      <span
                        className={cn(
                          'flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium',
                          priorityStyle.bg,
                          priorityStyle.text
                        )}
                      >
                        <span
                          className={cn('mr-1 h-1.5 w-1.5 rounded-full', priorityStyle.dot)}
                        />
                        {priorityStyle.label}
                      </span>

                      {/* Due Date */}
                      {dateText && (
                        <span
                          className={cn(
                            'text-[10px]',
                            isOverdue ? 'font-medium text-red-500' : 'text-slate-400'
                          )}
                        >
                          {dateText}
                        </span>
                      )}
                    </div>

                    {/* Status Select */}
                    <Select
                      value={task.status}
                      onValueChange={async (val) => {
                        const next = val as TaskStatus
                        if (next === 'done' && !task.assigned_to) {
                          toast.error(TASK_DONE_REQUIRES_ASSIGNEE)
                          return
                        }
                        try {
                          await onStatusChange(task.id, next)
                        } catch (error) {
                          toast.error(
                            error instanceof Error
                              ? error.message
                              : 'Erreur lors de la mise à jour'
                          )
                        }
                      }}
                    >
                      <SelectTrigger className="mt-2 h-7 w-full text-[10px] border-slate-100 bg-slate-50/50 hover:bg-slate-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">À faire</SelectItem>
                        {task.assigned_to || task.status === 'done' ? (
                          <SelectItem value="done">Terminé</SelectItem>
                        ) : null}
                        <SelectItem value="cancelled">Annulé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )
              })
            )}
          </div>
        )
      })}
    </div>
  )
}
