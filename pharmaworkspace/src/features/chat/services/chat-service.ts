import { createClient } from '@/lib/supabase/client'
import { canEditMessage } from '@/lib/chat/message-utils'
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '@/lib/audit/actions'
import { logAudit } from '@/lib/audit/log'
import {
  getPharmacyMessageCount,
  insertChatMessage,
  softDeleteChatMessage,
  updateChatMessage,
} from '@/lib/queries/chat'
import type { ChatMessageWithAuthor } from '@/types/index'

export async function getCurrentUserId(): Promise<string | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

export async function sendChatMessage(payload: {
  channelId: string
  pharmacyId: string
  body: string
}): Promise<{ data: ChatMessageWithAuthor | null; error: string | null; isFirstInPharmacy?: boolean }> {
  const trimmed = payload.body.trim()
  if (trimmed.length < 1 || trimmed.length > 4000) {
    return { data: null, error: 'Message invalide (1–4000 caractères).' }
  }

  const userId = await getCurrentUserId()
  if (!userId) return { data: null, error: 'Non authentifié' }

  const countResult = await getPharmacyMessageCount(payload.pharmacyId)
  const isFirstInPharmacy = (countResult.data ?? 0) === 0

  const result = await insertChatMessage({
    channel_id: payload.channelId,
    pharmacy_id: payload.pharmacyId,
    author_id: userId,
    body: trimmed,
  })

  return { ...result, isFirstInPharmacy }
}

export async function editChatMessage(
  message: ChatMessageWithAuthor,
  newBody: string
): Promise<{ data: ChatMessageWithAuthor | null; error: string | null }> {
  const trimmed = newBody.trim()
  if (trimmed.length < 1 || trimmed.length > 4000) {
    return { data: null, error: 'Message invalide.' }
  }

  if (!canEditMessage(message.created_at)) {
    return { data: null, error: 'Délai d’édition dépassé (15 minutes).' }
  }

  return updateChatMessage(message.id, trimmed)
}

export async function deleteChatMessage(
  message: ChatMessageWithAuthor,
  options?: { moderatedByTitulaire?: boolean }
): Promise<{ data: ChatMessageWithAuthor | null; error: string | null }> {
  const result = await softDeleteChatMessage(message.id)
  if (!result.error && result.data) {
    void logAudit({
      action: AUDIT_ACTIONS.chatMessageDeleted,
      target_type: AUDIT_TARGET_TYPES.chatMessage,
      target_id: message.id,
      pharmacy_id: message.pharmacy_id,
      metadata: {
        moderated: Boolean(options?.moderatedByTitulaire),
        channel_id: message.channel_id,
      },
    })
  }
  return result
}

export const chatService = {
  getCurrentUserId,
  sendChatMessage,
  editChatMessage,
  deleteChatMessage,
}
