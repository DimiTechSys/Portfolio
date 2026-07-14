'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

import { DetailDrawer } from '@/components/shared/detail-drawer'
import { DrawerActions } from '@/components/shared/drawer-actions'
import { PriorityBadge } from '@/components/shared/priority-badge'
import { StatusBadge } from '@/components/shared/status-badge'
import { TaskForm } from '@/components/tasks/task-form'
import { useProfile } from '@/contexts/profile-context'
import { tasksService, useTasks } from '@/features/tasks'
import { AudioRecorder } from '@/components/shared/audio-recorder'
import { AttachmentList } from '@/components/shared/file-uploader'
import {
  getTaskAttachments,
  getTaskDescriptionText,
} from '@/lib/tasks/task-attachments'
import { captureFirstMilestone } from '@/lib/analytics/capture-first'
import { FIRST_MILESTONE_EVENTS } from '@/lib/analytics/events'
import { markTransmissionNoteOpened } from '@/lib/onboarding/transmission-note-flag'
import posthog from 'posthog-js'
import type { NewTask, TaskWithProfiles, UpdateTask } from '@/types/index'

type TaskDrawerProps = {
  onChanged?: () => void
}

function formatDate(value: string | null): string {
  if (!value) {
    return '-'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function TaskDrawer({ onChanged }: TaskDrawerProps): React.JSX.Element {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const taskId = searchParams.get('id')

  const { canWriteTasks, isAdmin, pharmacy } = useProfile()
  const { createTask, updateTask, deleteTask } = useTasks()

  const [task, setTask] = useState<TaskWithProfiles | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [editing, setEditing] = useState<boolean>(false)

  const open = useMemo(() => taskId === 'new' || Boolean(taskId), [taskId])

  // Mission M3 invité (ONBOARD-01) : 1ère ouverture d'une tâche existante en
  // lecture → flag user_metadata, no-op les fois suivantes.
  useEffect(() => {
    if (!taskId || taskId === 'new') return
    void markTransmissionNoteOpened()
  }, [taskId])

  useEffect(() => {
    let active = true

    const run = async () => {
      if (!taskId || taskId === 'new') {
        if (active) {
          setTask(null)
          setEditing(taskId === 'new')
          setLoading(false)
        }
        return
      }

      setLoading(true)
      setEditing(false)

      const result = await tasksService.getTaskById(taskId)

      if (!active) {
        return
      }

      setTask(result.data ?? null)
      setLoading(false)
    }

    void run()

    return () => {
      active = false
    }
  }, [taskId])

  const closeDrawer = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('id')

    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  const handleCreate = async (payload: NewTask | UpdateTask) => {
    await createTask(payload as NewTask)
    posthog.capture('task_created', {
      priority: (payload as NewTask).priority,
      has_assigned_to: Boolean((payload as NewTask).assigned_to),
      has_due_date: Boolean((payload as NewTask).due_date),
    })
    if (pharmacy?.id) {
      captureFirstMilestone(FIRST_MILESTONE_EVENTS.first_task_created, pharmacy.id, {
        priority: (payload as NewTask).priority,
      })
    }
    onChanged?.()
    closeDrawer()
  }

  const handleUpdate = async (payload: NewTask | UpdateTask) => {
    if (!task?.id) {
      return
    }

    await updateTask(task.id, payload as UpdateTask)
    onChanged?.()
    setEditing(false)

    const result = await tasksService.getTaskById(task.id)
    setTask(result.data ?? null)
  }

  const handleDelete = async () => {
    if (!task?.id || !isAdmin) {
      return
    }

    await deleteTask(task.id)
    onChanged?.()
    closeDrawer()
  }

  const handleMarkAsDone = async () => {
    if (!task?.id || !canWriteTasks) return
    if (task.status === 'done' || task.status === 'cancelled') return
    if (!task.assigned_to) {
      toast.error(
        'Une tâche doit être assignée avant d’être marquée comme terminée.'
      )
      return
    }

    try {
      await updateTask(task.id, { status: 'done' })
      posthog.capture('task_completed', {
        task_id: task.id,
        priority: task.priority,
      })
      onChanged?.()
      const result = await tasksService.getTaskById(task.id)
      setTask(result.data ?? null)
      toast.success('Tâche terminée')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Impossible de mettre à jour la tâche'
      )
    }
  }

  const canMarkAsDone = Boolean(
    canWriteTasks &&
      task?.status === 'todo' &&
      task.assigned_to &&
      !editing
  )

  const actions = task ? (
    <DrawerActions
      canEdit={canWriteTasks}
      canDelete={isAdmin}
      onEdit={() => setEditing((current) => !current)}
      onDelete={handleDelete}
      editLabel={editing ? 'Annuler l’édition' : 'Éditer'}
    />
  ) : undefined

  return (
    <DetailDrawer
      open={open}
      onClose={closeDrawer}
      title={taskId === 'new' ? 'Nouvelle tâche' : task?.title ?? 'Détail de la tâche'}
      actions={taskId === 'new' || editing ? undefined : actions}
      width="lg"
    >
      {taskId === 'new' ? (
        <TaskForm onSubmit={handleCreate} onCancel={closeDrawer} submitLabel="Créer la tâche" />
      ) : loading ? (
        <div className="py-10 text-sm text-slate-500">Chargement...</div>
      ) : !task ? (
        <div className="py-10 text-sm text-slate-500">Tâche introuvable.</div>
      ) : editing ? (
        <TaskForm
          defaultValues={task}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(false)}
          submitLabel="Mettre à jour"
        />
      ) : (
        <div className="space-y-4">
          {canMarkAsDone ? (
            <button
              type="button"
              onClick={handleMarkAsDone}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
            >
              <CheckCircle2 className="h-4 w-4" />
              Marquer comme terminée
            </button>
          ) : null}

          <div className="flex flex-row flex-wrap items-center gap-2">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Description</h3>
            <p className="mt-2 line-clamp-1 text-sm leading-6 text-slate-600 md:line-clamp-none md:whitespace-pre-wrap">
              {getTaskDescriptionText(task) || 'Aucune description'}
            </p>

            {/* Vue lecture : on affiche uniquement les pièces jointes existantes
                (preview au clic + download). L'ajout / suppression passe par
                le mode édition (cf. TaskForm). */}
            {getTaskAttachments(task).length > 0 ? (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Pièces jointes
                </p>
                <AttachmentList attachments={getTaskAttachments(task)} />
              </div>
            ) : null}

            {task.audio_url ? (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <AudioRecorder
                  pharmacyId={task.pharmacy_id}
                  folderPath={`tasks/${task.id}`}
                  existingPath={task.audio_url}
                  onUploaded={() => {}}
                  readOnly
                />
              </div>
            ) : null}
          </div>

          <dl className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <dt className="text-xs uppercase tracking-wide text-slate-500">Assigné à</dt>
              <dd className="mt-1 text-sm text-slate-900">
                {task.assigned_to_profile?.display_name || task.assigned_to || 'Non assignée'}
              </dd>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <dt className="text-xs uppercase tracking-wide text-slate-500">Créée par</dt>
              <dd className="mt-1 text-sm text-slate-900">
                {task.created_by_profile?.display_name || task.created_by || '-'}
              </dd>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <dt className="text-xs uppercase tracking-wide text-slate-500">Échéance</dt>
              <dd className="mt-1 text-sm text-slate-900">{formatDate(task.due_date)}</dd>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <dt className="text-xs uppercase tracking-wide text-slate-500">Dernière mise à jour</dt>
              <dd className="mt-1 text-sm text-slate-900">{formatDate(task.updated_at)}</dd>
            </div>
          </dl>
        </div>
      )}
    </DetailDrawer>
  )
}
