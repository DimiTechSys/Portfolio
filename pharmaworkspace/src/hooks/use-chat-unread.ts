'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/contexts/profile-context'
import { getChatUnreadCount, getGeneralChannel, markChannelRead } from '@/lib/queries/chat'

export function useChatUnread() {
  const { pharmacy, profile } = useProfile()
  const pathname = usePathname()
  const pharmacyId = pharmacy?.id ?? null
  const userId = profile?.id ?? null
  const [channelId, setChannelId] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  // ChatUnreadBadge est monté plusieurs fois en même temps (sidebar desktop +
  // bulle flottante). Sans suffixe unique, les deux instances créent un channel
  // au MÊME topic ; supabase-js dédoublonne par topic et renvoie à la 2ᵉ le
  // channel déjà subscribe() → .on() dessus → crash Realtime. Un id par instance
  // donne à chaque badge son propre channel.
  const instanceId = useId().replace(/:/g, '')

  const refresh = useCallback(async () => {
    if (!pharmacyId || !userId) {
      setUnreadCount(0)
      setChannelId(null)
      return
    }

    const channelResult = await getGeneralChannel(pharmacyId)
    if (!channelResult.data) {
      setUnreadCount(0)
      return
    }

    setChannelId(channelResult.data.id)
    const countResult = await getChatUnreadCount(channelResult.data.id, userId)
    if (!countResult.error && countResult.data !== null) {
      setUnreadCount(countResult.data)
    }
  }, [pharmacyId, userId])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void refresh()
    }, 0)
    return () => clearTimeout(timeoutId)
  }, [refresh])

  // pathname/refresh sont lus dans le callback via des refs pour ne PAS être des
  // dépendances de l'effet d'abonnement : sinon chaque navigation recrée un
  // channel au même topic alors que removeChannel() (async) n'a pas fini → on
  // rappelle .on() sur un channel déjà subscribe() → crash Realtime.
  const pathnameRef = useRef(pathname)
  const refreshRef = useRef(refresh)
  useEffect(() => {
    pathnameRef.current = pathname
    refreshRef.current = refresh
  }, [pathname, refresh])

  useEffect(() => {
    if (!channelId || !userId) return
    const supabase = createClient()
    const channel = supabase
      .channel(`chat-unread:${channelId}:${userId}:${instanceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${channelId}`,
        },
        () => {
          if (pathnameRef.current === '/chat') return
          void refreshRef.current()
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [channelId, userId, instanceId])

  const markRead = useCallback(async () => {
    if (!channelId || !pharmacyId || !userId) return
    await markChannelRead(channelId, pharmacyId, userId)
    setUnreadCount(0)
  }, [channelId, pharmacyId, userId])

  useEffect(() => {
    if (pathname !== '/chat' || !channelId) return
    const timeoutId = setTimeout(() => {
      void markRead()
    }, 0)
    return () => clearTimeout(timeoutId)
  }, [pathname, channelId, markRead])

  return { unreadCount, refresh, markRead, channelId }
}
