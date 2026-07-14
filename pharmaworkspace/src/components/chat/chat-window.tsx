'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Users } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { capture } from '@/lib/analytics/posthog'
import { CHAT_EVENTS } from '@/lib/analytics/events'
import { useProfile } from '@/contexts/profile-context'
import { useRealtimeChat } from '@/hooks/use-realtime-chat'
import { chatService } from '@/features/chat'
import {
  getChatMessageById,
  getChatMessages,
  getGeneralChannel,
} from '@/lib/queries/chat'
import { MessageBubble } from '@/components/chat/message-bubble'
import { MessageComposer } from '@/components/chat/message-composer'
import type { ChatMessageWithAuthor } from '@/types/index'

export function ChatWindow({
  showHeader = true,
  className,
}: {
  showHeader?: boolean
  // Le conteneur appelant (carte) passe ses styles ici : ChatWindow EST la
  // carte, pas de div blanc intermédiaire redondant.
  className?: string
}) {
  const { pharmacy, profile, role } = useProfile()
  const pharmacyId = pharmacy?.id ?? null
  const userId = profile?.id ?? null
  const isTitulaire = role === 'titulaire'

  const [channelId, setChannelId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessageWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const loadInitial = useCallback(async () => {
    if (!pharmacyId) return
    setLoading(true)
    const channelResult = await getGeneralChannel(pharmacyId)
    if (!channelResult.data) {
      toast.error(channelResult.error ?? 'Canal introuvable')
      setLoading(false)
      return
    }
    setChannelId(channelResult.data.id)
    const messagesResult = await getChatMessages(channelResult.data.id, { limit: 50 })
    if (messagesResult.error) {
      toast.error(messagesResult.error)
    } else {
      setMessages(messagesResult.data ?? [])
    }
    setLoading(false)
  }, [pharmacyId])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadInitial()
      capture(CHAT_EVENTS.chat_window_opened)
    }, 0)
    return () => clearTimeout(timeoutId)
  }, [loadInitial])

  useEffect(() => {
    if (!loading && messages.length > 0) {
      scrollToBottom()
    }
  }, [loading, messages.length, scrollToBottom])

  const upsertMessage = useCallback((incoming: ChatMessageWithAuthor) => {
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.id === incoming.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], ...incoming }
        return next
      }
      return [...prev, incoming]
    })
  }, [])

  const handleRealtimeInsert = useCallback(
    async (row: ChatMessageWithAuthor) => {
      const full = row.author ? { data: row } : await getChatMessageById(row.id)
      if (!full.data) return

      setMessages((prev) => {
        if (prev.some((m) => m.id === full.data!.id)) return prev
        const optIdx = prev.findIndex(
          (m) => m.id.startsWith('optimistic-') && m.author_id === full.data!.author_id
        )
        if (optIdx >= 0) {
          const next = [...prev]
          next[optIdx] = full.data!
          return next
        }
        return [...prev, full.data!]
      })
      scrollToBottom()
    },
    [scrollToBottom]
  )

  const handleRealtimeUpdate = useCallback(
    async (row: ChatMessageWithAuthor) => {
      const full = await getChatMessageById(row.id)
      if (full.data) upsertMessage(full.data)
    },
    [upsertMessage]
  )

  useRealtimeChat({
    channelId,
    onInsert: (row) => void handleRealtimeInsert(row),
    onUpdate: (row) => void handleRealtimeUpdate(row),
  })

  const loadOlder = async () => {
    if (!channelId || loadingMore || messages.length === 0) return
    setLoadingMore(true)
    const oldest = messages[0]?.created_at
    const result = await getChatMessages(channelId, { limit: 50, before: oldest })
    setLoadingMore(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    const older = result.data ?? []
    if (older.length === 0) return
    setMessages((prev) => {
      const ids = new Set(prev.map((m) => m.id))
      const merged = [...older.filter((m) => !ids.has(m.id)), ...prev]
      return merged
    })
  }

  const handleSend = async (body: string) => {
    if (!channelId || !pharmacyId || !userId) return

    const optimisticId = `optimistic-${Date.now()}`
    const optimistic: ChatMessageWithAuthor = {
      id: optimisticId,
      channel_id: channelId,
      pharmacy_id: pharmacyId,
      author_id: userId,
      body,
      edited_at: null,
      deleted_at: null,
      created_at: new Date().toISOString(),
      author: profile
        ? {
            id: profile.id,
            display_name: profile.display_name,
            first_name: profile.first_name,
            last_name: profile.last_name,
            avatar_url: profile.avatar_url,
          }
        : null,
    }

    setMessages((prev) => [...prev, optimistic])
    scrollToBottom()

    const result = await chatService.sendChatMessage({
      channelId,
      pharmacyId,
      body,
    })

    if (result.error || !result.data) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
      toast.error(result.error ?? 'Envoi impossible')
      return
    }

    setMessages((prev) =>
      prev.map((m) => (m.id === optimisticId ? result.data! : m))
    )

    capture(CHAT_EVENTS.chat_message_sent, { body_length: body.length })
    if (result.isFirstInPharmacy) {
      capture(CHAT_EVENTS.chat_first_message_in_pharmacy)
    }
  }

  if (loading) {
    return (
      <div
        className={cn(
          'flex min-h-0 items-center justify-center overflow-hidden bg-white text-sm text-slate-500',
          className
        )}
      >
        Chargement du chat…
      </div>
    )
  }

  return (
    <div className={cn('flex min-h-0 flex-col overflow-hidden bg-white', className)}>
      {showHeader && (
        <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white shadow-sm">
            <Users className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-slate-900">Salon d&apos;équipe</h2>
            <p className="truncate text-xs text-slate-500">Canal général · {pharmacy?.name}</p>
          </div>
        </div>
      )}

      <div
        ref={listRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4"
        onScroll={(e) => {
          if (e.currentTarget.scrollTop < 40) void loadOlder()
        }}
      >
        {loadingMore ? (
          <p className="text-center text-xs text-slate-500">Chargement…</p>
        ) : null}
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.author_id === userId}
            canModerate={isTitulaire}
            onUpdated={upsertMessage}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <MessageComposer onSend={handleSend} disabled={!channelId} />
    </div>
  )
}
