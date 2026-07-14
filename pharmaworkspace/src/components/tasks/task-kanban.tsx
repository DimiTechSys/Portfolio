'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

import { PriorityBadge } from '@/components/shared/priority-badge'
import { StatusBadge } from '@/components/shared/status-badge'
import { TaskDrawer } from '@/components/tasks/task-drawer'
import { KANBAN_COLUMNS } from '@/config/constants'
import { useProfile } from '@/contexts/profile-context'
import { useTasks, TASK_DONE_REQUIRES_ASSIGNEE } from '@/features/tasks'
import { getTaskDescriptionText } from '@/lib/tasks/task-attachments'
import type { TaskStatus, TaskWithProfiles } from '@/types/index'

function formatDate(value: string | null): string {
  if (!value) {
    return 'Sans échéance'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Sans échéance'
  }

  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(date)
}

export function TaskKanban(): React.JSX.Element {
  const { profile, canWriteTasks } = useProfile()
  const { tasks, loading, error, updateTask, refresh } = useTasks()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const openTask = (taskId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('id', taskId)
    router.push(`${pathname}?${params.toString()}`)
  }

  const openCreate = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('id', 'new')
    router.push(`${pathname}?${params.toString()}`)
  }

  const canMoveTask = (_task: TaskWithProfiles): boolean =>
    Boolean(profile?.id && canWriteTasks)

  const moveTask = async (taskId: string, nextStatus: TaskStatus) => {
    const task = tasks.find((item) => item.id === taskId)

    if (!task || !canMoveTask(task) || task.status === nextStatus) {
      return
    }

    if (nextStatus === 'done' && !task.assigned_to) {
      toast.error(TASK_DONE_REQUIRES_ASSIGNEE)
      return
    }

    try {
      await updateTask(task.id, { status: nextStatus })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erreur lors du déplacement'
      )
    }
  }

  const groupedTasks = KANBAN_COLUMNS.map((column) => ({
    ...column,
    tasks: tasks.filter((task) => task.status === column.id),
  }))

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/70 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between md:p-5">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Board</h2>
          <p className="mt-1 text-sm text-slate-500">Visualisez rapidement la charge de travail.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/tasks"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
          >
            Vue liste
          </Link>

          {canWriteTasks ? (
            <button
              type="button"
              onClick={openCreate}
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-black"
            >
              Nouvelle tâche
            </button>
          ) : null}
        </div>
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      <div className="grid gap-4 xl:grid-cols-4">
        {groupedTasks.map((column) => (
          <section
            key={column.id}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              const taskId = event.dataTransfer.getData('text/task-id')
              void moveTask(taskId, column.id)
            }}
            className="min-h-[480px] rounded-3xl border border-slate-200 bg-white/70 p-3"
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">{column.label}</h2>
                <p className="text-xs text-slate-500">{column.tasks.length} tâche(s)</p>
              </div>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                  Chargement...
                </div>
              ) : column.tasks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                  Aucune tâche.
                </div>
              ) : (
                column.tasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    draggable={canMoveTask(task)}
                    onDragStart={(event) => {
                      event.dataTransfer.setData('text/task-id', task.id)
                    }}
                    onClick={() => openTask(task.id)}
                    className="block w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md active:scale-[0.99]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-medium text-slate-900">{task.title}</h3>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                          {getTaskDescriptionText(task) || '-'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <StatusBadge status={task.status} size="sm" />
                      <PriorityBadge priority={task.priority} size="sm" />
                    </div>

                    <div className="mt-4 space-y-1 text-xs text-slate-500">
                      <p>Assigné : {task.assigned_to_profile?.display_name || task.assigned_to || '-'}</p>
                      <p>Échéance : {formatDate(task.due_date)}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>
        ))}
      </div>

      <TaskDrawer onChanged={refresh} />
    </div>
  )
}
