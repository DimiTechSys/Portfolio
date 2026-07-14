import { createClient } from '@/lib/supabase/client'
import type {
  ChatChannel,
  ChatMessageWithAuthor,
  QueryResult,
} from '@/types/index'

const MESSAGE_SELECT = `
  *,
  author:profiles!chat_messages_author_id_fkey(id, display_name, first_name, last_name, avatar_url)
`

export async function getGeneralChannel(
  pharmacyId: string
): Promise<QueryResult<ChatChannel>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('chat_channels')
    .select('*')
    .eq('pharmacy_id', pharmacyId)
    .eq('slug', 'general')
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: 'Canal Général introuvable.' }
  return { data: data as ChatChannel, error: null }
}

export async function getChatMessageById(
  messageId: string
): Promise<QueryResult<ChatMessageWithAuthor>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('chat_messages')
    .select(MESSAGE_SELECT)
    .eq('id', messageId)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as ChatMessageWithAuthor, error: null }
}

export async function getChatMessages(
  channelId: string,
  options?: { limit?: number; before?: string }
): Promise<QueryResult<ChatMessageWithAuthor[]>> {
  const supabase = createClient()
  const limit = options?.limit ?? 50

  let query = supabase
    .from('chat_messages')
    .select(MESSAGE_SELECT)
    .eq('channel_id', channelId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (options?.before) {
    query = query.lt('created_at', options.before)
  }

  const { data, error } = await query
  if (error) return { data: null, error: error.message }
  const rows = ((data as ChatMessageWithAuthor[]) ?? []).slice().reverse()
  return { data: rows, error: null }
}

export async function getPharmacyMessageCount(
  pharmacyId: string
): Promise<QueryResult<number>> {
  const supabase = createClient()
  const { count, error } = await supabase
    .from('chat_messages')
    .select('*', { count: 'exact', head: true })
    .eq('pharmacy_id', pharmacyId)

  if (error) return { data: null, error: error.message }
  return { data: count ?? 0, error: null }
}

export async function insertChatMessage(payload: {
  channel_id: string
  pharmacy_id: string
  author_id: string
  body: string
}): Promise<QueryResult<ChatMessageWithAuthor>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('chat_messages')
    .insert(payload)
    .select(MESSAGE_SELECT)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as ChatMessageWithAuthor, error: null }
}

export async function updateChatMessage(
  messageId: string,
  body: string
): Promise<QueryResult<ChatMessageWithAuthor>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('chat_messages')
    .update({ body: body.trim(), edited_at: new Date().toISOString() })
    .eq('id', messageId)
    .is('deleted_at', null)
    .select(MESSAGE_SELECT)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as ChatMessageWithAuthor, error: null }
}

export async function softDeleteChatMessage(
  messageId: string
): Promise<QueryResult<ChatMessageWithAuthor>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('chat_messages')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', messageId)
    .is('deleted_at', null)
    .select(MESSAGE_SELECT)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as ChatMessageWithAuthor, error: null }
}

export async function markChannelRead(
  channelId: string,
  pharmacyId: string,
  userId: string
): Promise<QueryResult<null>> {
  const supabase = createClient()
  const now = new Date().toISOString()
  const { error } = await supabase.from('chat_read_states').upsert(
    {
      user_id: userId,
      channel_id: channelId,
      pharmacy_id: pharmacyId,
      last_read_at: now,
    },
    { onConflict: 'user_id,channel_id' }
  )

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

export async function getChatUnreadCount(
  channelId: string,
  userId: string
): Promise<QueryResult<number>> {
  const supabase = createClient()

  const { data: readState } = await supabase
    .from('chat_read_states')
    .select('last_read_at')
    .eq('user_id', userId)
    .eq('channel_id', channelId)
    .maybeSingle()

  const lastRead = readState?.last_read_at ?? '1970-01-01T00:00:00.000Z'

  const { count, error } = await supabase
    .from('chat_messages')
    .select('*', { count: 'exact', head: true })
    .eq('channel_id', channelId)
    .gt('created_at', lastRead)
    .neq('author_id', userId)

  if (error) return { data: null, error: error.message }
  return { data: count ?? 0, error: null }
}
