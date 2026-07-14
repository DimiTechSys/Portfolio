// Étape "waiting" : état d'attente affiché aux invités (adjoints/préparateurs)
// dont le titulaire n'a pas encore activé l'abonnement de la pharmacie. Le
// middleware route automatiquement ici quand `getWizardStep` retourne 'waiting'
// (cf. src/lib/onboarding/wizard-state.ts).
//
// On RSC-fetch le nom de l'officine pour personnaliser le message. Le composant
// client adjacent gère le polling auto (re-check du subscription_status toutes
// les 30s) + l'auto-redirect quand l'activation est faite.

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WaitingClient } from './waiting-client'

export const dynamic = 'force-dynamic'

export default async function WaitingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('pharmacy_id, role')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile?.pharmacy_id) redirect('/onboarding/create')

  // Récupère le nom de la pharma pour personnaliser le message.
  const { data: pharmacy } = await supabase
    .from('pharmacies')
    .select('name')
    .eq('id', profile.pharmacy_id)
    .maybeSingle()

  return (
    <WaitingClient
      pharmacyId={profile.pharmacy_id as string}
      pharmacyName={(pharmacy?.name as string | null) ?? "votre officine"}
    />
  )
}
