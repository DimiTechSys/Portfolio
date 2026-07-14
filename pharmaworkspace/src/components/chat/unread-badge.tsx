'use client'

import { useChatUnread } from '@/hooks/use-chat-unread'

export function ChatUnreadBadge() {
  const { unreadCount } = useChatUnread()

  if (unreadCount <= 0) return null

  return (
    <span className="inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  )
}
