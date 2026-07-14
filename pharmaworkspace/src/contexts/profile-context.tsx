'use client'

import { createContext, useContext, useCallback, useEffect, useState, useRef, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { postInviteComplete } from '@/lib/invite/post-invite-complete'
import type { Profile, Pharmacy, UserRole } from '@/types/index'

type UserContext = {
  profile: Profile | null
  pharmacy: Pharmacy | null
  role: UserRole | null
  isAdmin: boolean
  canWrite: boolean
  /** Tâches : tous les rôles pharmacie (y compris préparateur) peuvent créer, prendre, réassigner, éditer. */
  canWriteTasks: boolean
  /**
   * Signal canonique invité vs titulaire, basé sur `user.user_metadata.invitation_token`
   * (posé par generateLink dans /api/invitations/create-native pour les invités,
   * absent pour les titulaires qui signup via signInWithOtp).
   *
   * À utiliser de préférence à `profile.role` pour la discrimination invité/titulaire
   * pendant l'onboarding : profiles.role a une valeur par défaut 'preparateur'
   * en DB qui crée un état transitoire trompeur pour les titulaires fraîchement
   * signed up (avant que /api/onboarding/create-pharmacy n'écrase à 'titulaire').
   */
  isInvitee: boolean
  loading: boolean
  signOut: () => Promise<void>
  refetch: () => Promise<void>
}

const ProfileContext = createContext<UserContext | null>(null)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null)
  const [isInvitee, setIsInvitee] = useState(false)
  const [loading, setLoading] = useState(true)
  const inviteCompleteOnceRef = useRef(false)

  const fetchProfile = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setProfile(null); setPharmacy(null); setIsInvitee(false); setLoading(false); return
    }

    // Signal invité = user_metadata.invitation_token présent. Set en premier
    // pour qu'il soit dispo dès le 1er render même si la query profiles met
    // du temps à répondre.
    const meta = user.user_metadata as Record<string, unknown> | null
    setIsInvitee(typeof meta?.invitation_token === 'string' && meta.invitation_token.length > 0)

    const { data: profileRow } = await supabase
      .from('profiles')
      .select('*, pharmacies(*)')
      .eq('id', user.id)
      .single()

    if (!profileRow) { setProfile(null); setPharmacy(null); setLoading(false); return }

    const { pharmacies: pharmacyJoin, ...profileFields } = profileRow as Profile & {
      pharmacies: Pharmacy | Pharmacy[] | null
    }
    const pharmacyData = Array.isArray(pharmacyJoin) ? pharmacyJoin[0] ?? null : pharmacyJoin

    setProfile(profileFields as Profile)
    setPharmacy(pharmacyData)

    setLoading(false)
  }, [])

  /** Rattrapage : si /api/invite/complete n’a pas vu la session (cookies), on réessaie une fois avec Bearer.
   *
   * IMPORTANT : on ne s'exécute QUE si `user_metadata.invitation_token` est présent.
   * Sans ce garde-fou, l'endpoint tomberait sur sa branche fallback "lookup par
   * email" qui matche n'importe quelle invitation pending pour l'email du user.
   * Conséquence vue en prod : un titulaire fraîchement signed up dont l'email
   * a une invitation orpheline (test précédent, recyclage d'email) se voyait
   * brièvement attribuer `role='preparateur'` jusqu'à ce que /api/onboarding/create-pharmacy
   * écrase à `role='titulaire'` → flash bar invitée → bar titulaire.
   */
  useEffect(() => {
    if (loading) return
    if (profile?.pharmacy_id) return
    if (inviteCompleteOnceRef.current) return

    const supabase = createClient()
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Seuls les invités ont `invitation_token` posé dans user_metadata
      // (par /api/invitations/create-native via generateLink). Les titulaires
      // ne l'ont jamais → on skip pour ne pas déclencher le fallback email
      // de /api/invite/complete.
      const meta = user.user_metadata as Record<string, unknown> | null
      const token =
        typeof meta?.invitation_token === 'string'
          ? (meta.invitation_token as string)
          : ''
      if (!token) {
        inviteCompleteOnceRef.current = true
        return
      }

      inviteCompleteOnceRef.current = true
      const res = await postInviteComplete({ token })
      if (!res.ok) {
        inviteCompleteOnceRef.current = false
        return
      }

      const payload = (await res.json()) as { ok?: boolean; skipped?: boolean }
      if (payload.ok && !payload.skipped) void fetchProfile()
    })()
  }, [loading, profile?.pharmacy_id, fetchProfile])

  useEffect(() => {
    const isAuthCallback = typeof window !== 'undefined' && window.location.pathname.startsWith('/auth/callback')
    
    // Avoid Supabase NavigatorLockAcquireTimeoutError by not heavily fetching session concurrently on the callback page.
    let timeoutId: NodeJS.Timeout | undefined
    if (!isAuthCallback) {
      timeoutId = setTimeout(() => {
        void fetchProfile()
      }, 0)
    }
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') void fetchProfile()
      if (event === 'SIGNED_OUT') {
        inviteCompleteOnceRef.current = false
        setProfile(null)
        setPharmacy(null)
      }
    })
    return () => {
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const signOut = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    inviteCompleteOnceRef.current = false
    setProfile(null); setPharmacy(null)
    window.location.href = '/login'
  }, [])

  const role = profile?.role as UserRole | null
  const canWriteTasks = Boolean(profile?.pharmacy_id && role)

  return (
    <ProfileContext.Provider value={{
      profile, pharmacy, role,
      isAdmin: role === 'titulaire',
      canWrite: role === 'titulaire' || role === 'adjoint',
      canWriteTasks,
      isInvitee,
      loading, signOut, refetch: fetchProfile,
    }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile(): UserContext {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider')
  return ctx
}