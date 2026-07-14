// Helper qui détermine quelle étape du wizard onboarding l'utilisateur doit
// voir, en fonction de l'état réel en base + des metadata Auth + du rôle.
// Consommé par :
//   * Le middleware `src/proxy.ts` pour rediriger automatiquement vers la
//     bonne étape si l'utilisateur tente de naviguer ailleurs.
//   * (Optionnel) Les pages du wizard pour vérifier que l'utilisateur n'est
//     pas en train de revisiter une étape déjà passée.
//
// Contrat §B8 #6 (COORDINATION.md). Signature stable :
//   getWizardStep(supabase, userId): Promise<WizardStep>
//
// Branches :
//   - Titulaire : flow complet create → profile → invite → activate → done
//   - Invité (adjoint/préparateur) : profile → done (si pharma activée) OU
//     profile → waiting (si la pharma est encore en `subscription_status` non-actif)
//
// L'étape `waiting` est spécifique aux invités : ils ont fini leur profil
// mais le titulaire n'a pas encore activé l'abonnement, donc l'app n'est pas
// accessible. La page /onboarding/waiting affiche un état d'attente avec
// auto-refresh.

import type { SupabaseClient } from '@supabase/supabase-js'

export type WizardStep =
  | 'create'
  | 'profile'
  | 'invite'
  | 'activate'
  | 'waiting'
  | 'done'

export async function getWizardStep(
  supabase: SupabaseClient,
  userId: string,
): Promise<WizardStep> {
  // 1. Pas de pharmacy_id sur le profil → étape 1 (création officine).
  const { data: profile } = await supabase
    .from('profiles')
    .select('pharmacy_id, role, first_name, last_name')
    .eq('id', userId)
    .maybeSingle()

  if (!profile?.pharmacy_id) return 'create'

  // 2. first_name ou last_name vide → étape 2 (profil utilisateur).
  if (!profile.first_name?.trim() || !profile.last_name?.trim()) {
    return 'profile'
  }

  // 3. Check le subscription_status de la pharmacy (utilisé pour les deux
  //    branches : titulaire & invité).
  const { data: pharmacy } = await supabase
    .from('pharmacies')
    .select('subscription_status')
    .eq('id', profile.pharmacy_id)
    .maybeSingle()
  const status =
    (pharmacy?.subscription_status as string | null | undefined) ?? null
  const hasActiveSub =
    status === 'trialing' || status === 'active' || status === 'past_due'

  // 4. Branche INVITÉ : pas d'étape invite/activate. Si la pharma est active,
  //    l'invité accède à l'app. Sinon il attend que le titulaire active.
  if (profile.role !== 'titulaire') {
    return hasActiveSub ? 'done' : 'waiting'
  }

  // 5. Branche TITULAIRE : étapes invite + activate.
  //    user_metadata.onboarding_invites_handled !== true → étape 3 (équipe).
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const invitesHandled =
    (user?.user_metadata as Record<string, unknown> | null)
      ?.onboarding_invites_handled === true
  if (!invitesHandled) return 'invite'

  // 6. subscription_status NULL ou 'incomplete' → étape 4 (mandat SEPA obligatoire).
  if (!hasActiveSub) return 'activate'

  return 'done'
}
