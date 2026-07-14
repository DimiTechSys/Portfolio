'use client'

import { useEffect, useMemo, useState } from 'react'

import { useProfile } from '@/contexts/profile-context'
import { tasksService } from '@/features/tasks'
import { AudioRecorder } from '@/components/shared/audio-recorder'
import { FormActions } from '@/components/shared/form-actions'
import { AttachmentList, FileUploader, type Attachment } from '@/components/shared/file-uploader'
import { getTaskAttachments, getTaskDescriptionText } from '@/lib/tasks/task-attachments'
import type {
  NewTask,
  Profile,
  TaskPriority,
  TaskStatus,
  TaskWithProfiles,
  UpdateTask,
} from '@/types/index'

type TaskFormValues = {
  title: string
  description: string
  priority: TaskPriority
  status: TaskStatus
  due_date: string
  assigned_to: string
  audio_url: string | null
}

type TaskFormProps = {
  defaultValues?: Partial<TaskWithProfiles>
  onSubmit: (payload: NewTask | UpdateTask) => Promise<void>
  onCancel?: () => void
  submitLabel?: string
}

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high']
const STATUSES: TaskStatus[] = ['todo', 'done', 'cancelled']

function toDateInputValue(value: string | null | undefined): string {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toISOString().slice(0, 10)
}

export function TaskForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = 'Enregistrer',
}: TaskFormProps): React.JSX.Element {
  const { pharmacy, canWriteTasks } = useProfile()
  const [members, setMembers] = useState<Profile[]>([])
  const [membersLoading, setMembersLoading] = useState(false)

  const initialValues = useMemo<TaskFormValues>(
    () => ({
      title: defaultValues?.title ?? '',
      description: defaultValues ? getTaskDescriptionText(defaultValues) : '',
      priority: (defaultValues?.priority ?? 'medium') as TaskPriority,
      status: (defaultValues?.status ?? 'todo') as TaskStatus,
      due_date: toDateInputValue(defaultValues?.due_date),
      assigned_to: defaultValues?.assigned_to ?? '',
      audio_url: defaultValues?.audio_url ?? null,
    }),
    [defaultValues]
  )

  const [values, setValues] = useState<TaskFormValues>(initialValues)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [uploadedAttachments, setUploadedAttachments] = useState<Attachment[]>([])
  const isEditing = Boolean(defaultValues?.id)
  const attachmentFolderPath = isEditing
    ? `tasks/${defaultValues?.id}`
    : `temp/tasks/${Date.now()}`

  useEffect(() => {
    setValues(initialValues)
    setUploadedAttachments(defaultValues ? getTaskAttachments(defaultValues) : [])
  }, [initialValues, defaultValues])

  useEffect(() => {
    let active = true

    const loadMembers = async () => {
      if (!pharmacy?.id) {
        if (active) setMembers([])
        return
      }

      setMembersLoading(true)
      const result = await tasksService.getPharmacyMembers(pharmacy.id)
      if (!active) return
      setMembers(result.data ?? [])
      setMembersLoading(false)
    }

    void loadMembers()

    return () => {
      active = false
    }
  }, [pharmacy?.id])

  const handleChange = <K extends keyof TaskFormValues>(key: K, value: TaskFormValues[K]) => {
    setValues((current) => {
      let next: TaskFormValues = { ...current, [key]: value }
      if (key === 'assigned_to' && !(value as string).trim() && current.status === 'done') {
        next = { ...next, status: 'todo' }
      }
      return next
    })
  }

  const statusOptions = useMemo(() => {
    const hasAssignee = Boolean(values.assigned_to.trim())
    return hasAssignee ? STATUSES : STATUSES.filter((s) => s !== 'done')
  }, [values.assigned_to])

  useEffect(() => {
    if (!values.assigned_to.trim() && values.status === 'done') {
      setValues((current) => ({ ...current, status: 'todo' }))
    }
  }, [values.assigned_to, values.status])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!canWriteTasks || !pharmacy?.id || !values.title.trim()) {
      return
    }

    if (values.status === 'done' && !values.assigned_to.trim()) {
      return
    }

    setSubmitting(true)

    try {
      const descriptionText = values.description.trim() || null
      const attachmentsPayload = uploadedAttachments

      if (isEditing) {
        const payload: UpdateTask = {
          title: values.title.trim(),
          description: descriptionText,
          attachments: attachmentsPayload,
          priority: values.priority,
          status: values.status,
          due_date: values.due_date ? new Date(values.due_date).toISOString() : null,
          assigned_to: values.assigned_to.trim() || null,
          audio_url: values.audio_url,
        }

        await onSubmit(payload)
      } else {
        const userId = await tasksService.getCurrentUserId()
        if (!userId) return

        const payload: NewTask = {
          pharmacy_id: pharmacy.id,
          created_by: userId,
          title: values.title.trim(),
          description: descriptionText,
          attachments: attachmentsPayload,
          priority: values.priority,
          status: values.status,
          due_date: values.due_date ? new Date(values.due_date).toISOString() : null,
          assigned_to: values.assigned_to.trim() || null,
          audio_url: values.audio_url,
        }

        await onSubmit(payload)
        setValues({
          title: '',
          description: '',
          priority: 'medium',
          status: 'todo',
          due_date: '',
          assigned_to: '',
          audio_url: null,
        })
        setUploadedAttachments([])
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form id="task-form" className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label htmlFor="task-title" className="text-sm font-medium text-slate-900">
          Titre
        </label>
        <input
          id="task-title"
          type="text"
          value={values.title}
          onChange={(event) => handleChange('title', event.target.value)}
          disabled={!canWriteTasks || submitting}
          required
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-slate-500"
          placeholder="Ex. Relancer fournisseur"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="task-description" className="text-sm font-medium text-slate-900">
          Description
        </label>
        <textarea
          id="task-description"
          value={values.description}
          onChange={(event) => handleChange('description', event.target.value)}
          disabled={!canWriteTasks || submitting}
          rows={4}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-slate-500"
          placeholder="Détails complémentaires"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-900">Mémo vocal</label>
        {pharmacy?.id && (
          <AudioRecorder
            pharmacyId={pharmacy.id}
            folderPath={isEditing ? `tasks/${defaultValues?.id}` : `temp/tasks/${Date.now()}`}
            existingPath={values.audio_url}
            onUploaded={(path) => handleChange('audio_url', path)}
            onDelete={() => handleChange('audio_url', null)}
          />
        )}
      </div>
      {pharmacy?.id ? (
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-900">Photo / fichiers</label>
          <FileUploader
            pharmacyId={pharmacy.id}
            folderPath={attachmentFolderPath}
            onUploaded={(attachment) =>
              setUploadedAttachments((prev) => [...prev, attachment])
            }
          />
          <AttachmentList
            attachments={uploadedAttachments}
            onDelete={(index) =>
              setUploadedAttachments((prev) => prev.filter((_, i) => i !== index))
            }
          />
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="task-priority" className="text-sm font-medium text-slate-900">
            Priorité
          </label>
          <select
            id="task-priority"
            value={values.priority}
            onChange={(event) => handleChange('priority', event.target.value as TaskPriority)}
            disabled={!canWriteTasks || submitting}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-slate-500"
          >
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority === 'low' ? 'Basse' : priority === 'medium' ? 'Moyenne' : 'Haute'}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="task-status" className="text-sm font-medium text-slate-900">
            Statut
          </label>
          <select
            id="task-status"
            value={values.status}
            onChange={(event) => handleChange('status', event.target.value as TaskStatus)}
            disabled={!canWriteTasks || submitting}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-slate-500"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === 'todo'
                  ? 'À faire'
                  : status === 'done'
                      ? 'Terminé'
                    : 'Annulé'}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="task-due-date" className="text-sm font-medium text-slate-900">
            Échéance
          </label>
          <input
            id="task-due-date"
            type="date"
            value={values.due_date}
            onChange={(event) => handleChange('due_date', event.target.value)}
            disabled={!canWriteTasks || submitting}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-slate-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="task-assigned-to" className="text-sm font-medium text-slate-900">
            Assigné à
          </label>
          <select
            id="task-assigned-to"
            value={values.assigned_to}
            onChange={(event) => handleChange('assigned_to', event.target.value)}
            disabled={!canWriteTasks || submitting || membersLoading}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-slate-500"
          >
            <option value="">
              {membersLoading ? 'Chargement des membres…' : 'Non assignée'}
            </option>
            {members.map((member) => {
              const name =
                member.display_name?.trim() ||
                `${member.first_name ?? ''} ${member.last_name ?? ''}`.trim() ||
                'Membre'
              return (
                <option key={member.id} value={member.id}>
                  {name}
                </option>
              )
            })}
          </select>
          <p className="text-xs text-slate-500">Choisissez un membre de votre pharmacie.</p>
        </div>
      </div>

      <FormActions
        onCancel={onCancel ?? (() => {})}
        submitLabel={submitLabel}
        submitting={submitting}
        disabled={!canWriteTasks || !values.title.trim()}
        submitForm="task-form"
      />
    </form>
  )
}
