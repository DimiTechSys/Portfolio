import { createClient } from '@/lib/supabase/client'
import type { TaskItem, TaskPriority, TaskStatus } from '@/types'

export async function getTasks(filters?: { status?: string; priority?: string }) {
  const supabase = createClient()
  let query = supabase
    .from('tasks')
    .select('*')
    .order('due_at', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (filters?.status && filters.status !== 'tous') query = query.eq('status', filters.status)
  if (filters?.priority && filters.priority !== 'tous') query = query.eq('priority', filters.priority)

  const { data, error } = await query
  if (error) throw error
  return data as TaskItem[]
}

export async function createTask(input: {
  title: string
  due_at?: string | null
  status?: TaskStatus
  priority?: TaskPriority
  assigned_to?: string | null
  related_type?: string | null
  related_id?: string | null
}) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: input.title,
      due_at: input.due_at ?? null,
      status: input.status ?? 'todo',
      priority: input.priority ?? 'moyenne',
      assigned_to: input.assigned_to ?? null,
      related_type: input.related_type ?? null,
      related_id: input.related_id ?? null,
    })
    .select('*')
    .single()
  if (error) throw error
  return data as TaskItem
}

export async function updateTask(id: string, updates: Partial<TaskItem>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data as TaskItem
}
