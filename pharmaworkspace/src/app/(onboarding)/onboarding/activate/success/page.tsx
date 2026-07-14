// /onboarding/activate/success : page atterrissage post-Stripe Checkout.
//
// Stripe redirige ici après que l'utilisateur a renseigné son IBAN (mandat SEPA). Le webhook
// `checkout.session.completed` peut mettre 1-3 secondes à mettre à jour la DB
// après ce redirect (Stripe envoie le webhook en parallèle, pas avant). On
// fait donc un fetch initial server-side ; si la subscription n'est pas
// encore en `trialing` / `active`, le composant client polle jusqu'à 10s
// avant de proposer un retry manuel.

import { createClient } from '@/lib/supabase/server'
import { ActivationSuccessClient } from './activation-success-client'

export const dynamic = 'force-dynamic'

export default async function ActivationSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id: sessionId } = await searchParams

  // On ne redirige PAS vers /login si getUser() est null : au retour de Stripe,
  // le cookie de session peut manquer côté serveur sur cette 1ʳᵉ requête cross-site.
  // Le client récupère l'état via des appels same-origin (cookie toujours envoyé).
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Les colonnes Stripe ne sont pas dans le type Pharmacy généré (database.types
  // pas régénéré depuis la migration 0042) → on type à la main, comme billing-settings-form.
  type StripeFields = {
    subscription_status: string | null
    trial_end: string | null
    subscription_tier: string | null
    subscription_billing: string | null
  }

  let pharmacyId: string | null = null
  let pharmacy: StripeFields | null = null

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('pharmacy_id')
      .eq('id', user.id)
      .maybeSingle()
    pharmacyId = (profile?.pharmacy_id as string | null) ?? null

    if (pharmacyId) {
      const { data } = await supabase
        .from('pharmacies')
        .select('subscription_status, trial_end, subscription_tier, subscription_billing')
        .eq('id', pharmacyId)
        .maybeSingle()
      pharmacy = (data as StripeFields | null) ?? null
    }
  }

  return (
    <ActivationSuccessClient
      pharmacyId={pharmacyId}
      sessionId={sessionId ?? null}
      initialStatus={pharmacy?.subscription_status ?? null}
      initialTrialEnd={pharmacy?.trial_end ?? null}
      tier={pharmacy?.subscription_tier ?? null}
      billing={pharmacy?.subscription_billing ?? null}
    />
  )
}
