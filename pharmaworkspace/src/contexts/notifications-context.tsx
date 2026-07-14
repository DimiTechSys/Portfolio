'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/contexts/profile-context'
import { getNotificationTargetUrl } from '@/lib/notification-url'
import {
  getNotifications,
  getUnreadCount,
  markAllAsRead as markAllAsReadQuery,
  markAsRead as markAsReadQuery,
  deleteNotification as deleteNotificationQuery,
} from '@/lib/queries/notifications'
import type { Notification } from '@/types/index'
import { scheduleIdleTask } from '@/lib/perf/schedule-idle'

// Source UNIQUE des notifications : un seul abonnement Realtime + un seul état
// partagé, monté une fois via NotificationsProvider (cf. (app)/layout.tsx et
// (admin)/layout.tsx). Avant, useNotifications() était appelé en parallèle dans
// le Header ET la page /notifications → deux abonnements au même topic
// `notifications_<user>` → supabase-js renvoyait à la 2ᵉ instance le channel
// déjà subscribe() → crash Realtime ; et le toast d'arrivée pouvait doubler.

type NotificationsContextValue = {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  refresh: (params?: { silent?: boolean }) => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null)

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { profile } = useProfile()
  const userId = profile?.id ?? null
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const seenNotificationIdsRef = useRef<Set<string>>(new Set())
  const initializedRef = useRef(false)
  // Suffixe unique par instance : évite la collision de topic lors de la
  // transition entre layouts (app)↔(admin), où l'ancien provider se démonte
  // (removeChannel async) pendant que le nouveau s'abonne.
  const instanceId = useId().replace(/:/g, '')

  const showIncomingNotificationToast = useCallback(
    (notification: Notification) => {
      const url = getNotificationTargetUrl(notification.metadata)
      const canNavigate = url !== '/notifications'
      toast(notification.title, {
        description: notification.body ?? undefined,
        duration: 8000,
        className: '!bg-slate-900 !text-white !border-slate-700 !rounded-3xl !px-4 !py-3 !shadow-2xl',
        descriptionClassName: '!text-slate-200',
        action: canNavigate
          ? {
              label: 'Voir',
              onClick: () => router.push(url),
            }
          : undefined,
      })
    },
    [router]
  )

  // Le provider détient la liste COMPLÈTE (limit 0) ; les consommateurs la
  // tronquent eux-mêmes via useNotifications({ limit }).
  const refresh = useCallback(async (params?: { silent?: boolean }) => {
    const silent = params?.silent ?? false
    if (!userId) {
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
      return
    }
    if (!silent) {
      setLoading(true)
    }
    const [notificationsResult, unreadResult] = await Promise.all([
      getNotifications(userId, 0),
      getUnreadCount(userId),
    ])

    if (!notificationsResult.error && notificationsResult.data) {
      setNotifications(() => {
        const next = notificationsResult.data ?? []
        // Skip toast burst on very first hydration.
        if (initializedRef.current) {
          const unseen = next.filter((item) => !seenNotificationIdsRef.current.has(item.id))
          unseen.forEach((item) => {
            showIncomingNotificationToast(item)
          })
        }
        seenNotificationIdsRef.current = new Set(next.map((item) => item.id))
        initializedRef.current = true
        return next
      })
    }
    if (!unreadResult.error && unreadResult.data !== null) {
      setUnreadCount(unreadResult.data)
    }
    if (!silent) {
      setLoading(false)
    }
  }, [userId, showIncomingNotificationToast])

  useEffect(() => {
    const cancel = scheduleIdleTask(() => {
      void refresh()
    })
    return cancel
  }, [refresh])

  useEffect(() => {
    if (!userId) return
    const supabase = createClient()
    const channel = supabase
      .channel(`notifications_${userId}_${instanceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification
          if (seenNotificationIdsRef.current.has(newNotification.id)) return
          seenNotificationIdsRef.current.add(newNotification.id)
          initializedRef.current = true
          setNotifications((prev) => [newNotification, ...prev])
          setUnreadCount((prev) => prev + 1)
          showIncomingNotificationToast(newNotification)
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId, showIncomingNotificationToast, instanceId])

  const markAsRead = useCallback(async (id: string) => {
    const result = await markAsReadQuery(id)
    if (result.error) return

    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, read_at: item.read_at ?? new Date().toISOString() } : item
      )
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }, [])

  const markAllAsRead = useCallback(async () => {
    if (!userId) return
    const result = await markAllAsReadQuery(userId)
    if (result.error) return

    const now = new Date().toISOString()
    setNotifications((prev) => prev.map((item) => ({ ...item, read_at: item.read_at ?? now })))
    setUnreadCount(0)
  }, [userId])

  const deleteNotification = useCallback(async (id: string) => {
    const removed = notifications.find((item) => item.id === id)
    const result = await deleteNotificationQuery(id)
    if (result.error) return

    setNotifications((prev) => prev.filter((item) => item.id !== id))
    if (removed?.read_at === null) {
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
  }, [notifications])

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        refresh,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications(options?: { limit?: number }) {
  const ctx = useContext(NotificationsContext)
  if (!ctx) {
    throw new Error('useNotifications doit être utilisé dans un NotificationsProvider')
  }
  // limit non fourni → 20 (comportement historique du Header) ; limit 0 → tout.
  const limit = options?.limit ?? 20
  const notifications = limit > 0 ? ctx.notifications.slice(0, limit) : ctx.notifications
  return { ...ctx, notifications }
}
