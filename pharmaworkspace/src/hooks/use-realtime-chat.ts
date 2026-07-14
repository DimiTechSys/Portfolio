'use client'

import { useEffect, useId, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ChatMessageWithAuthor } from '@/types/index'

type UseRealtimeChatOptions = {
  channelId: string | null
  onInsert: (message: ChatMessageWithAuthor) => void
  onUpdate: (message: ChatMessageWithAuthor) => void
}

export function useRealtimeChat({
  channelId,
  onInsert,
  onUpdate,
}: UseRealtimeChatOptions) {
  // Les callbacks sont souvent passés en arrow inline (nouvelle identité à
  // chaque render). On les lit via des refs pour que l'abonnement ne dépende
  // que de channelId : sinon on se ré-abonne au même topic à chaque render
  // alors que removeChannel() (async) n'a pas fini → .on() sur un channel déjà
  // subscribe() → crash Realtime.
  const onInsertRef = useRef(onInsert)
  const onUpdateRef = useRef(onUpdate)
  useEffect(() => {
    onInsertRef.current = onInsert
    onUpdateRef.current = onUpdate
  }, [onInsert, onUpdate])

  // Topic unique par instance : évite que deux montages (ou un unmount/mount
  // rapide dont le removeChannel async n'a pas fini) ne partagent un channel
  // déjà subscribe() → .on() dessus → crash Realtime.
  const instanceId = useId().replace(/:/g, '')

  useEffect(() => {
    if (!channelId) return

    const supabase = createClient()
    const channel = supabase
      .channel(`chat:${channelId}:${instanceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          onInsertRef.current(payload.new as ChatMessageWithAuthor)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          onUpdateRef.current(payload.new as ChatMessageWithAuthor)
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [channelId, instanceId])
}
