import { createClient } from '@/lib/supabase/client'
import type { FeedbackCategory, QueryResult } from '@/types/index'

export type SubmitFeedbackPayload = {
  pharmacy_id: string | null
  category: FeedbackCategory
  content: string
  page_url: string | null
}

export async function submitFeedback(
  payload: SubmitFeedbackPayload
): Promise<QueryResult<{ id: string }>> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Non authentifié' }

  const { data, error } = await supabase
    .from('feedback')
    .insert({
      pharmacy_id: payload.pharmacy_id,
      user_id: user.id,
      category: payload.category,
      content: payload.content.trim(),
      page_url: payload.page_url,
    })
    .select('id')
    .single()

  if (error) return { data: null, error: error.message }
  return { data: { id: data.id }, error: null }
}
