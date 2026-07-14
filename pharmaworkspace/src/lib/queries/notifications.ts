import { createClient } from '@/lib/supabase/client'
import type { NewNotification, Notification, QueryResult } from '@/types/index'

export async function getNotifications(
  userId: string,
  limit = 20
): Promise<QueryResult<Notification[]>> {
  const supabase = createClient()
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (limit > 0) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) return { data: null, error: error.message }
  return { data: (data as Notification[]) ?? [], error: null }
}

export async function getUnreadCount(
  userId: string
): Promise<QueryResult<number>> {
  const supabase = createClient()
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null)

  if (error) return { data: null, error: error.message }
  return { data: count ?? 0, error: null }
}

export async function markAsRead(
  notificationId: string
): Promise<QueryResult<null>> {
  const supabase = createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

export async function markAllAsRead(
  userId: string
): Promise<QueryResult<null>> {
  const supabase = createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null)

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

export async function deleteNotification(
  notificationId: string
): Promise<QueryResult<null>> {
  const supabase = createClient()
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

export async function createNotification(
  payload: NewNotification
): Promise<QueryResult<Notification>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('notifications')
    .insert(payload)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Notification, error: null }
}
