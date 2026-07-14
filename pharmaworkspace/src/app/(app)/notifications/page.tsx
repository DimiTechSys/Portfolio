'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckSquare, MessageSquare, Package, X } from 'lucide-react'
import { useNotifications } from '@/contexts/notifications-context'
import { getNotificationTargetUrl } from '@/lib/notification-url'
import type { Notification } from '@/types/index'

function getNotificationIcon(type: Notification['type'], metadata: Notification['metadata']) {
  if (metadata?.domain === 'rental') return Package
  if (type === 'task_assigned') return CheckSquare
  if (type === 'shortage_reported') return AlertTriangle
  return MessageSquare
}

function getRelativeTime(value: string) {
  const diffMs = Date.now() - new Date(value).getTime()
  const diffMin = Math.max(0, Math.floor(diffMs / 60000))
  if (diffMin < 1) return "à l'instant"
  if (diffMin < 60) return `il y a ${diffMin} min`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `il y a ${diffHours} h`
  const diffDays = Math.floor(diffHours / 24)
  return `il y a ${diffDays} j`
}

function getGroupLabel(createdAt: string) {
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)

  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - 7)

  const created = new Date(createdAt)
  if (created >= todayStart) return "Aujourd'hui"
  if (created >= yesterdayStart) return 'Hier'
  if (created >= weekStart) return 'Cette semaine'
  return 'Plus ancien'
}

export default function NotificationsPage() {
  const router = useRouter()
  const { notifications, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications({ limit: 0 })

  const grouped = useMemo(() => {
    return notifications.reduce<Record<string, Notification[]>>((acc, item) => {
      const key = getGroupLabel(item.created_at)
      if (!acc[key]) acc[key] = []
      acc[key].push(item)
      return acc
    }, {})
  }, [notifications])

  const groupOrder = ["Aujourd'hui", 'Hier', 'Cette semaine', 'Plus ancien']

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-3xl border border-slate-200/70 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-slate-900">Notifications</h1>
          {notifications.length > 0 && (
            <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-semibold text-white">
              {notifications.filter((n) => n.read_at === null).length}
            </span>
          )}
        </div>
        <button
          onClick={() => void markAllAsRead()}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          Tout marquer comme lu
        </button>
      </div>

      <section className="rounded-3xl border border-slate-200/70 bg-white p-4 shadow-sm">
        {loading ? (
          <p className="text-sm text-slate-500">Chargement…</p>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center">
            <MessageSquare className="mx-auto h-5 w-5 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">Aucune notification.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {groupOrder.map((groupName) => {
              const groupItems = grouped[groupName] ?? []
              if (groupItems.length === 0) return null
              return (
                <div key={groupName}>
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {groupName}
                  </h2>
                  <ul className="space-y-2">
                    {groupItems.map((item) => {
                      const Icon = getNotificationIcon(item.type, item.metadata)
                      const targetUrl = getNotificationTargetUrl(item.metadata)
                      return (
                        <li key={item.id}>
                          <div
                            className={
                              'rounded-2xl border px-3 py-3 transition-colors ' +
                              (item.read_at
                                ? 'border-slate-200/70 bg-white hover:bg-slate-50'
                                : 'border-cyan-200/80 bg-cyan-50/70 hover:bg-cyan-50')
                            }
                          >
                            <div className="mb-1 flex items-start justify-end">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  void deleteNotification(item.id)
                                }}
                                className="rounded-full p-1 text-slate-400 transition-colors hover:bg-white hover:text-slate-600"
                                aria-label="Supprimer la notification"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <button
                              onClick={async () => {
                                await markAsRead(item.id)
                                router.push(targetUrl)
                              }}
                              className="flex w-full items-start gap-3 text-left"
                            >
                              <div className="mt-0.5 rounded-full bg-white p-1.5 shadow-sm">
                                <Icon className="h-3.5 w-3.5 shrink-0 text-slate-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-slate-900">{item.title}</p>
                                {item.body && (
                                  <p className="mt-0.5 line-clamp-2 text-sm text-slate-600">{item.body}</p>
                                )}
                                <div className="mt-1 flex items-center justify-between">
                                  <p className="text-xs text-slate-500">{getRelativeTime(item.created_at)}</p>
                                  {!item.read_at && <span className="h-2 w-2 rounded-full bg-cyan-500" />}
                                </div>
                              </div>
                            </button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
