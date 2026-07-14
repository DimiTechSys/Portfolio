// Mission M3 invité ("Lire une note de transmission"), choix d'implémentation :
// flag `user_metadata.has_opened_transmission_note` posé côté client à la 1ère
// ouverture d'une tâche en lecture, plutôt qu'une table `task_read_events`
// (pas de nouvelle table + RLS + index) ou qu'une lecture PostHog en SSR
// (coupling externe). user_metadata est déjà le mécanisme utilisé pour
// `invitation_token` (P2-01) et `onboarding_invites_handled`.

import { createClient } from '@/lib/supabase/client'

export async function markTransmissionNoteOpened(): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.has_opened_transmission_note) return
  await supabase.auth.updateUser({
    data: { has_opened_transmission_note: true },
  })
}
