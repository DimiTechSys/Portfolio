// src/lib/queries/tasks.ts
import { createClient } from '@/lib/supabase/client'
import { createNotification } from '@/lib/queries/notifications'
import { logAudit } from '@/lib/audit/log'
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '@/lib/audit/actions'
import {
  applyKeysetCursor,
  sliceKeysetPage,
  type KeysetCursor,
} from '@/lib/queries/keyset-pagination'
import type {
  Task,
  NewTask,
  UpdateTask,
  TaskWithProfiles,
  TaskStatus,
  TaskPriority,
  QueryResult,
} from '@/types/index'

// Sélection réutilisée par les listes (jointures profils légères).
const TASK_LIST_SELECT = `
  *,
  created_by_profile:profiles!created_by (
    id, display_name, avatar_url
  ),
  assigned_to_profile:profiles!assigned_to (
    id, display_name, avatar_url
  )
`

/** Partition d'affichage de la page /tasks. */
export type TaskSection = 'mine' | 'free' | 'team'

/** Filtres appliqués CÔTÉ SERVEUR (plus de filtrage/recherche sur un flux déjà paginé). */
export type TaskListFilters = {
  status?: TaskStatus // absent → toutes les tâches actives (status != 'done')
  priority?: TaskPriority
  search?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyTaskSection(query: any, section: TaskSection, userId: string) {
  if (section === 'mine') return query.eq('assigned_to', userId)
  if (section === 'free') return query.is('assigned_to', null)
  // team : assignée à quelqu'un d'autre que moi
  return query.not('assigned_to', 'is', null).neq('assigned_to', userId)
}

/** Shown when setting status to done without an assignee (UI + DB). */
export const TASK_DONE_REQUIRES_ASSIGNEE =
  'Une tâche doit être assignée avant d’être marquée comme terminée.'

function mapTasksAccessError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('row-level security')) {
    return (
      'Accès refusé par la base pour les tâches. ' +
      'Appliquez la migration `0015_tasks_all_pharmacy_members_write` sur Supabase ' +
      '(ou vérifiez que votre profil a bien un `pharmacy_id`).'
    )
  }
  return message
}

// ── Liste ────────────────────────────────────────────────────

export async function getTasks(
  pharmacyId: string,
  filters?: { status?: TaskStatus; assignedTo?: string }
): Promise<QueryResult<TaskWithProfiles[]>> {
  const supabase = createClient()

  let query = supabase
    .from('tasks')
    .select(`
      *,
      created_by_profile:profiles!created_by (
        id, display_name, avatar_url
      ),
      assigned_to_profile:profiles!assigned_to (
        id, display_name, avatar_url
      )
    `)
    .eq('pharmacy_id', pharmacyId)
    .order('created_at', { ascending: false })

  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.assignedTo) query = query.eq('assigned_to', filters.assignedTo)

  const { data, error } = await query
  if (error) return { data: null, error: error.message }
  return { data: data as unknown as TaskWithProfiles[], error: null }
}

type Cursor = { created_at: string; id: string }

export async function getTasksPaginated(
  pharmacyId: string,
  cursor?: Cursor,
  limit = 50,
  filters?: { status?: TaskStatus; assignedTo?: string }
): Promise<QueryResult<{ items: TaskWithProfiles[]; nextCursor: Cursor | null }>> {
  const supabase = createClient()

  let query = supabase
    .from('tasks')
    .select(
      `
      *,
      created_by_profile:profiles!created_by (
        id, display_name, avatar_url
      ),
      assigned_to_profile:profiles!assigned_to (
        id, display_name, avatar_url
      )
    `
    )
    .eq('pharmacy_id', pharmacyId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1)

  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.assignedTo) query = query.eq('assigned_to', filters.assignedTo)

  if (cursor) {
    query = query.or(
      `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`
    )
  }

  const { data, error } = await query
  if (error) return { data: null, error: error.message }

  const rows = (data as unknown as TaskWithProfiles[]) ?? []
  const items = rows.slice(0, limit)
  const extra = rows.length > limit ? rows[limit] : null
  const nextCursor = extra ? { created_at: extra.created_at, id: extra.id } : null
  return { data: { items, nextCursor }, error: null }
}

// ── Sections paginées + compteurs (page /tasks) ──────────────
//
// Chaque section (mes tâches / libres / équipe) est paginée INDÉPENDAMMENT côté
// serveur, avec statut/priorité/recherche appliqués en SQL. Fini le partitionnement
// et la recherche côté client sur un flux de 50 lignes (bug d'affichage à volume).

export async function getTasksSectionPaginated(
  pharmacyId: string,
  section: TaskSection,
  userId: string,
  cursor?: KeysetCursor,
  limit = 50,
  filters?: TaskListFilters
): Promise<QueryResult<{ items: TaskWithProfiles[]; nextCursor: KeysetCursor | null }>> {
  const supabase = createClient()

  let query = supabase
    .from('tasks')
    .select(TASK_LIST_SELECT)
    .eq('pharmacy_id', pharmacyId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1)

  query = applyTaskSection(query, section, userId)

  if (filters?.status) query = query.eq('status', filters.status)
  else query = query.neq('status', 'done')

  if (filters?.priority) query = query.eq('priority', filters.priority)

  const search = filters?.search?.trim()
  if (search) {
    query = query.textSearch('search_vec', search, { config: 'french', type: 'plain' })
  }

  query = applyKeysetCursor(query, cursor)

  const { data, error } = await query
  if (error) return { data: null, error: mapTasksAccessError(error.message) }

  const rows = (data as unknown as TaskWithProfiles[]) ?? []
  return { data: sliceKeysetPage(rows, limit), error: null }
}

/** Compteur serveur (head:true) — ne rapatrie aucune ligne. `status: 'active'` = != done. */
export async function countTasks(
  pharmacyId: string,
  filters: {
    section?: TaskSection
    userId?: string | null
    status?: TaskStatus | 'active'
    priority?: TaskPriority
  }
): Promise<QueryResult<number>> {
  const supabase = createClient()

  let query = supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('pharmacy_id', pharmacyId)

  if (filters.section === 'free') {
    query = query.is('assigned_to', null)
  } else if (filters.section && filters.userId) {
    query = applyTaskSection(query, filters.section, filters.userId)
  }

  if (filters.status === 'active') query = query.neq('status', 'done')
  else if (filters.status) query = query.eq('status', filters.status)

  if (filters.priority) query = query.eq('priority', filters.priority)

  const { count, error } = await query
  if (error) return { data: null, error: mapTasksAccessError(error.message) }
  return { data: count ?? 0, error: null }
}

// ── Par ID ───────────────────────────────────────────────────

export async function getTaskById(
  id: string
): Promise<QueryResult<TaskWithProfiles>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      created_by_profile:profiles!created_by (
        id, display_name, avatar_url
      ),
      assigned_to_profile:profiles!assigned_to (
        id, display_name, avatar_url
      )
    `)
    .eq('id', id)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as unknown as TaskWithProfiles, error: null }
}

// ── Création ─────────────────────────────────────────────────

export async function createTask(
  payload: NewTask
): Promise<QueryResult<Task>> {
  if (payload.status === 'done' && !payload.assigned_to) {
    return { data: null, error: TASK_DONE_REQUIRES_ASSIGNEE }
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('tasks')
    .insert(payload)
    .select()
    .single()

  if (error) return { data: null, error: mapTasksAccessError(error.message) }

  // audio_url désormais stocke un path Supabase Storage (bucket attachments).
  if (data.audio_url && data.audio_url.startsWith(`${payload.pharmacy_id}/temp/tasks/`)) {
    const oldPath = data.audio_url
    const fileName = oldPath.split('/').pop()
    if (fileName) {
      const newPath = `${payload.pharmacy_id}/tasks/${data.id}/${fileName}`
      const { error: moveError } = await supabase.storage.from('attachments').move(oldPath, newPath)

      if (!moveError) {
        const { data: updatedTask } = await supabase
          .from('tasks')
          .update({ audio_url: newPath })
          .eq('id', data.id)
          .select()
          .single()

        if (updatedTask) {
          data.audio_url = updatedTask.audio_url
        }
      }
    }
  }

  // Move newly uploaded attachments from temp to permanent
  if (data.attachments && Array.isArray(data.attachments) && data.attachments.length > 0) {
    let attachmentsUpdated = false
    const newAttachments = [...data.attachments]

    for (let i = 0; i < newAttachments.length; i++) {
      const att = newAttachments[i]
      const oldPath: string | undefined = att?.path
      if (oldPath && oldPath.startsWith(`${payload.pharmacy_id}/temp/tasks/`)) {
        const fileName = oldPath.split('/').pop()
        if (fileName) {
          const newPath = `${payload.pharmacy_id}/tasks/${data.id}/${fileName}`
          const { error: moveError } = await supabase.storage.from('attachments').move(oldPath, newPath)

          if (!moveError) {
            newAttachments[i] = { ...att, path: newPath }
            attachmentsUpdated = true
          }
        }
      }
    }

    if (attachmentsUpdated) {
      const { data: updatedTask } = await supabase
        .from('tasks')
        .update({ attachments: newAttachments })
        .eq('id', data.id)
        .select()
        .single()

      if (updatedTask) {
        data.attachments = updatedTask.attachments
      }
    }
  }

  if (data.assigned_to && data.assigned_to !== data.created_by) {
    await createNotification({
      pharmacy_id: data.pharmacy_id,
      user_id: data.assigned_to,
      type: 'task_assigned',
      title: 'Nouvelle tâche assignée',
      body: data.title,
      metadata: { task_id: data.id, target_url: '/tasks' },
    })
  }

  void logAudit({
    action: AUDIT_ACTIONS.taskCreated,
    target_type: AUDIT_TARGET_TYPES.task,
    target_id: data.id,
    pharmacy_id: data.pharmacy_id,
    metadata: { title: data.title, status: data.status },
  })

  return { data, error: null }
}

// ── Mise à jour ───────────────────────────────────────────────

export async function updateTask(
  id: string,
  payload: UpdateTask
): Promise<QueryResult<Task>> {
  const supabase = createClient()

  const { data: current, error: fetchError } = await supabase
    .from('tasks')
    .select('assigned_to,status')
    .eq('id', id)
    .single()

  if (fetchError || !current) {
    return {
      data: null,
      error: fetchError
        ? mapTasksAccessError(fetchError.message)
        : 'Tâche introuvable.',
    }
  }

  const nextStatus = (
    payload.status !== undefined ? payload.status : current.status
  ) as TaskStatus
  const nextAssigned =
    payload.assigned_to !== undefined
      ? payload.assigned_to
      : current.assigned_to

  if (nextStatus === 'done' && !nextAssigned) {
    return { data: null, error: TASK_DONE_REQUIRES_ASSIGNEE }
  }

  const updatePayload: UpdateTask = { ...payload }
  if (payload.status !== undefined) {
    if (payload.status === 'done' && !updatePayload.completed_at) {
      updatePayload.completed_at = new Date().toISOString()
    }
    if (payload.status !== 'done') {
      updatePayload.completed_at = null
    }
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: mapTasksAccessError(error.message) }

  if (data.assigned_to && data.assigned_to !== data.created_by) {
    await createNotification({
      pharmacy_id: data.pharmacy_id,
      user_id: data.assigned_to,
      type: 'task_assigned',
      title: 'Nouvelle tâche assignée',
      body: data.title,
      metadata: { task_id: data.id, target_url: '/tasks' },
    })
  }

  // `task.completed` quand on passe à done, sinon `task.updated`. Le passage de
  // statut est l'action la plus utile à tracer pour une équipe.
  const becameDone = payload.status === 'done' && current.status !== 'done'
  void logAudit({
    action: becameDone ? AUDIT_ACTIONS.taskCompleted : AUDIT_ACTIONS.taskUpdated,
    target_type: AUDIT_TARGET_TYPES.task,
    target_id: data.id,
    pharmacy_id: data.pharmacy_id,
    metadata: { title: data.title, status: data.status },
  })

  return { data, error: null }
}

// ── Suppression ───────────────────────────────────────────────

export async function deleteTask(
  id: string
): Promise<QueryResult<null>> {
  const supabase = createClient()
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)

  if (error) return { data: null, error: mapTasksAccessError(error.message) }

  void logAudit({
    action: AUDIT_ACTIONS.taskDeleted,
    target_type: AUDIT_TARGET_TYPES.task,
    target_id: id,
  })

  return { data: null, error: null }
}