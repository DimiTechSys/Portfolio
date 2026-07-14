'use client'

import { type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { useProfile } from '@/contexts/profile-context'
import { SessionProvider } from '@/contexts/session-context'
import { NotificationsProvider } from '@/contexts/notifications-context'
import { Toaster } from 'sonner'
import { FeedbackDialog } from '@/components/shared/feedback-button'
import { ChatBubble } from '@/components/chat/chat-bubble'
import { TrialBanner } from '@/components/app/trial-banner'

function AppLayoutInner({ children }: { children: ReactNode }) {
  const { profile, signOut } = useProfile()
  const pathname = usePathname()
  const useWideContent = pathname === '/dashboard'

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-b from-slate-100 via-slate-50 to-white">
      <Sidebar className="hidden lg:block" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Toaster
          position="top-center"
          closeButton
          expand
          visibleToasts={3}
          toastOptions={{
            duration: 5000,
          }}
        />
        <Header
          firstName={profile?.first_name ?? ''}
          lastName={profile?.last_name ?? ''}
          onSignOut={signOut}
          avatarPath={profile?.avatar_url}
        />
        <TrialBanner />
        <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-4 sm:py-5 lg:px-8 lg:py-6">
          <div className={useWideContent ? 'h-full w-full' : 'mx-auto h-full w-full max-w-6xl'}>{children}</div>
        </main>
        <ChatBubble />
        <FeedbackDialog />
      </div>
    </div>
  )
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <NotificationsProvider>
        <AppLayoutInner>{children}</AppLayoutInner>
      </NotificationsProvider>
    </SessionProvider>
  )
}
