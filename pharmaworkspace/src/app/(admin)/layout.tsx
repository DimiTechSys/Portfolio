'use client'

import { type ReactNode } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { useProfile } from '@/contexts/profile-context'
import { SessionProvider } from '@/contexts/session-context'
import { NotificationsProvider } from '@/contexts/notifications-context'

function AdminLayoutInner({ children }: { children: ReactNode }) {
  const { profile, signOut } = useProfile()

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-b from-slate-100 via-slate-50 to-white">
      <Sidebar className="hidden lg:block" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          firstName={profile?.first_name ?? ''}
          lastName={profile?.last_name ?? ''}
          onSignOut={signOut}
        />
        <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-4 sm:py-5 lg:px-8 lg:py-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <NotificationsProvider>
        <AdminLayoutInner>{children}</AdminLayoutInner>
      </NotificationsProvider>
    </SessionProvider>
  )
}