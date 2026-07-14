// ONBOARD-01 : missions d'activation in-app.
//
// Détection AUTOMATIQUE par counts SQL (RLS scoped pharmacy_id) : pas de coche
// manuelle, pas de cache : recalculé à chaque appel. Les missions chat (M6
// titulaire / M4 invité) sont skippées AU NIVEAU DU COMPUTE quand
// MISSIONS_REQUIRE_CHAT est false : aucune query sur `chat_messages` n'est
// émise, la mission sort en `status: 'hidden'` et ne compte pas dans le total.
//
// M3 invité ("Lire une note de transmission") se base sur le flag
// `user_metadata.has_opened_transmission_note` (posé côté client à la 1ère
// ouverture d'une tâche, cf. transmission-note-flag.ts) : pas de table
// `task_read_events`, pas de dépendance PostHog en SSR.

import type { SupabaseClient } from '@supabase/supabase-js'
import { computeOwnerMissions, type OwnerCounts } from './missions-owner'
import { computeMemberMissions, type MemberState } from './missions-member'

export type MissionStatus = 'pending' | 'done' | 'hidden'
export type MissionVariant = 'wizard' | 'dashboard'

export type Mission = {
  id: string
  label: string
  tooltip?: string
  cta?: { href: string } | { feedback: true } | null
  status: MissionStatus
  variant: MissionVariant
}

export type MissionsResult = {
  missions: Mission[]
  progress: { done: number; total: number }
  allCompleted: boolean
  dismissed: boolean
}

/** Flag CHAT : tant que false, M6 titulaire et M4 invité sont masquées. */
export function missionsRequireChat(): boolean {
  return process.env.NEXT_PUBLIC_MISSIONS_REQUIRE_CHAT === 'true'
}

async function countRows(
  supabase: SupabaseClient,
  table: string,
  column: string,
  value: string,
): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq(column, value)
  if (error) return 0
  return count ?? 0
}

export async function getMissionsForUser(
  supabase: SupabaseClient,
  userId: string,
  options?: { requireChat?: boolean },
): Promise<MissionsResult> {
  const requireChat = options?.requireChat ?? missionsRequireChat()

  // L'appartenance se lit dans `profiles.pharmacy_id` (pas de table
  // pharmacy_members). `missions_dismissed_at` est posé par-utilisateur
  // depuis la migration 0060 (refactor per-user — chaque membre gère son
  // confort visuel sans impacter ses collègues).
  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'role, pharmacy_id, first_name, last_name, avatar_url, missions_dismissed_at',
    )
    .eq('id', userId)
    .maybeSingle()

  const empty: MissionsResult = {
    missions: [],
    progress: { done: 0, total: 0 },
    allCompleted: false,
    dismissed: false,
  }
  if (!profile?.pharmacy_id) return empty
  const pharmacyId = profile.pharmacy_id as string
  const dismissed = Boolean(profile.missions_dismissed_at)

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>

  if (profile.role === 'titulaire') {
    const [pharmacyRow, members, tasks, prescriptions, shortages, rentals, feedback, chatMessages] =
      await Promise.all([
        // subscription_status uniquement — `onboarding_dismissed_at` est mort
        // depuis la migration 0060 (per-user flag sur profiles).
        supabase
          .from('pharmacies')
          .select('subscription_status')
          .eq('id', pharmacyId)
          .maybeSingle(),
        countRows(supabase, 'profiles', 'pharmacy_id', pharmacyId),
        countRows(supabase, 'tasks', 'pharmacy_id', pharmacyId),
        countRows(supabase, 'prescriptions', 'pharmacy_id', pharmacyId),
        countRows(supabase, 'shortages', 'pharmacy_id', pharmacyId),
        countRows(supabase, 'rentals', 'pharmacy_id', pharmacyId),
        countRows(supabase, 'feedback', 'pharmacy_id', pharmacyId),
        // Query chat UNIQUEMENT si le flag est actif (table absente sinon).
        requireChat
          ? countRows(supabase, 'chat_messages', 'pharmacy_id', pharmacyId)
          : Promise.resolve(0),
      ])

    const status = (pharmacyRow?.data?.subscription_status as string | null) ?? null
    const counts: OwnerCounts = {
      members,
      tasks,
      prescriptions,
      shortages,
      rentals,
      feedback,
      chatMessages,
      hasPharmacy: true,
      profileComplete: Boolean(
        (profile.first_name as string | null)?.trim() &&
          (profile.last_name as string | null)?.trim(),
      ),
      invitesHandled: metadata.onboarding_invites_handled === true,
      subscriptionActive:
        status === 'trialing' || status === 'active' || status === 'past_due',
    }

    const missions = computeOwnerMissions(counts, requireChat)
    const visible = missions.filter((m) => m.status !== 'hidden')
    const done = visible.filter((m) => m.status === 'done').length
    const total = visible.length
    return {
      missions,
      progress: { done, total },
      allCompleted: total > 0 && done === total,
      dismissed,
    }
  }

  // Branche invité (adjoint / preparateur / student / shelver).
  const myTasks = await countRows(supabase, 'tasks', 'created_by', userId)
  const myChatMessages = requireChat
    ? await countRows(supabase, 'chat_messages', 'author_id', userId)
    : 0

  const state: MemberState = {
    profileComplete: Boolean(
      (profile.first_name as string | null)?.trim() &&
        (profile.last_name as string | null)?.trim(),
    ),
    hasAvatar: Boolean(profile.avatar_url),
    tasksCreated: myTasks,
    hasOpenedTransmissionNote: metadata.has_opened_transmission_note === true,
    chatMessages: myChatMessages,
  }

  const missions = computeMemberMissions(state, requireChat)
  const visible = missions.filter((m) => m.status !== 'hidden')
  const done = visible.filter((m) => m.status === 'done').length
  const total = visible.length
  return {
    missions,
    progress: { done, total },
    allCompleted: total > 0 && done === total,
    // Per-user depuis la migration 0060 — chaque membre gère son propre flag.
    dismissed,
  }
}
