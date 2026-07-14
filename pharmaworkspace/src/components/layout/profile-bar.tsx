'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Pencil, LogOut } from 'lucide-react'
import { useProfile } from '@/contexts/profile-context'
import { useSessionContext } from '@/contexts/session-context'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ROLE_LABELS } from '@/config/constants'
import { Profile } from '@/types'
import type { UserRole } from '@/types/index'
import { useSignedUrl } from '@/lib/storage/get-signed-url'
import Image from 'next/image'

interface ProfileSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileSheet({ open, onOpenChange }: ProfileSheetProps) {
  const router = useRouter()
  const { profile, pharmacy, loading, signOut } = useProfile()
  const { session, isActive } = useSessionContext()
  const { data: avatarSignedUrl } = useSignedUrl('attachments', profile?.avatar_url ?? undefined)

  const [nowMs, setNowMs] = useState(() => Date.now())
  useEffect(() => {
    if (!isActive) return
    const id = setInterval(() => setNowMs(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [isActive])

  if (loading || !profile) return null

  // Le champ full_name n'existe pas dans le type Profile, on utilise display_name ou first_name + last_name
  const fullName = profile.display_name || [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Utilisateur'
  
  const parts = fullName.trim().split(' ')
  let initials = parts.length >= 2
    ? parts[0][0] + parts[parts.length - 1][0]
    : (fullName.slice(0, 2) || 'U')
  initials = initials.toUpperCase()

  const roleLabel = profile.role
    ? ROLE_LABELS[profile.role as UserRole] ?? profile.role
    : 'Utilisateur'

  const memberSince = new Intl.DateTimeFormat('fr-FR', {
    month: 'short', 
    year: 'numeric'
  }).format(new Date(profile.created_at))

  const handleEditProfile = () => {
    onOpenChange(false)
    router.push('/profile')
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  let sessionDuration = ''
  if (isActive && session?.started_at) {
    const start = new Date(session.started_at).getTime()
    const diff = Math.max(0, nowMs - start)
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    sessionDuration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-8 focus-visible:outline-none" aria-describedby={undefined}>
        <SheetTitle className="sr-only">Profil de l&apos;utilisateur</SheetTitle>

        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5 mt-1" />
        
        <SheetHeader className="px-6 pb-5 border-b border-slate-100 flex flex-col items-center space-y-0">
          <div className="relative w-14 h-14 rounded-full bg-teal-600 flex items-center justify-center text-white text-xl font-medium mb-3 shrink-0 overflow-hidden shadow-sm">
            {avatarSignedUrl ? (
              <Image src={avatarSignedUrl} alt="Avatar" fill className="object-cover" sizes="56px" />
            ) : (
              initials
            )}
          </div>
          <h2 className="text-lg font-semibold text-slate-800 text-center leading-none">{fullName}</h2>
          <div className="inline-flex items-center gap-1.5 mt-1.5 bg-teal-50 text-teal-700 text-xs font-medium px-2.5 py-1 rounded-lg">
            <Shield size={11} />
            {roleLabel}
          </div>
        </SheetHeader>

        <div className="px-6 pt-4 pb-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Informations
          </h3>
          
          <div className="flex justify-between items-center py-2.5 border-b border-slate-50">
            <span className="text-xs text-slate-400">Email</span>
            <span className="text-xs font-medium text-slate-700 truncate max-w-[180px]">
              {(profile as Profile & { email?: string }).email || "-"}
            </span>
          </div>
          
          <div className="flex justify-between items-center py-2.5 border-b border-slate-50">
            <span className="text-xs text-slate-400">Pharmacie</span>
            <span className="text-xs font-medium text-slate-700 truncate max-w-[180px]">{pharmacy?.name ?? "-"}</span>
          </div>
          
          <div className="flex justify-between items-center py-2.5 border-b border-slate-50">
            <span className="text-xs text-slate-400">Rôle</span>
            <span className="text-xs font-medium text-slate-700">{roleLabel}</span>
          </div>
          
          <div className="flex justify-between items-center py-2.5 border-b border-slate-50">
            <span className="text-xs text-slate-400">Membre depuis</span>
            <span className="text-xs font-medium text-slate-700">{memberSince}</span>
          </div>
        </div>

        {isActive && (
          <div className="mx-6 mt-3 mb-1 bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-teal-700">Session active</span>
            </div>
            <span className="text-sm text-teal-600">{sessionDuration}</span>
          </div>
        )}

        <div className="px-6 pt-3 flex flex-col gap-2">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 h-11 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-normal"
            onClick={handleEditProfile}
          >
            <Pencil size={15} />
            Modifier mon profil
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 h-11 border-red-100 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-normal hover:text-red-700"
            onClick={handleLogout}
          >
            <LogOut size={15} />
            Se déconnecter
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
