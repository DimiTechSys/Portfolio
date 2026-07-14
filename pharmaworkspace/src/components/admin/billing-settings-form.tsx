'use client'

// Section "Abonnement" dans /admin/settings — visible par le titulaire pour
// consulter l'état de son abonnement Stripe et accéder au Customer Portal.
// Sans cette section, le titulaire n'a aucun point d'entrée vers la gestion
// de son abonnement en usage normal (le middleware ne redirige vers
// /billing/reactivate qu'en cas de statut 'canceled' ou 'unpaid').

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Landmark, ExternalLink } from 'lucide-react'
import { useProfile } from '@/contexts/profile-context'
import { createClient } from '@/lib/supabase/client'
import { capture } from '@/lib/analytics/posthog'

// Type local — les colonnes Stripe ne sont pas dans le type Pharmacy généré
// (database.types.ts n'a pas été régénéré depuis migration 0042). On query
// directement pour éviter de toucher le type généré qui cascade ailleurs.
type StripeFields = {
  subscription_status:
    | 'incomplete'
    | 'trialing'
    | 'active'
    | 'past_due'
    | 'canceled'
    | 'unpaid'
    | null
  subscription_tier: 'po' | 'otm' | 'go' | null
  subscription_billing: 'monthly' | 'yearly' | null
  trial_end: string | null
  current_period_end: string | null
  stripe_customer_id: string | null
}

const STATUS_LABELS: Record<NonNullable<StripeFields['subscription_status']>, string> = {
  incomplete: 'Inscription incomplète',
  trialing: 'Essai gratuit en cours',
  active: 'Abonnement actif',
  past_due: 'Paiement en retard',
  canceled: 'Abonnement annulé',
  unpaid: 'Impayé',
}

const STATUS_TONE: Record<NonNullable<StripeFields['subscription_status']>, string> = {
  incomplete: 'bg-slate-100 text-slate-700',
  trialing: 'bg-teal-50 text-teal-800 border border-teal-100',
  active: 'bg-emerald-50 text-emerald-800 border border-emerald-100',
  past_due: 'bg-amber-50 text-amber-900 border border-amber-100',
  canceled: 'bg-rose-50 text-rose-800 border border-rose-100',
  unpaid: 'bg-rose-50 text-rose-800 border border-rose-100',
}

const TIER_LABELS: Record<NonNullable<StripeFields['subscription_tier']>, string> = {
  po: 'PO — Petite Officine',
  otm: 'OTM — Officine Taille Moyenne',
  go: 'GO — Grande Officine',
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

export function BillingSettingsForm() {
  const { pharmacy } = useProfile()
  const [billing, setBilling] = useState<StripeFields | null>(null)
  const [loading, setLoading] = useState(true)
  const [opening, setOpening] = useState(false)

  useEffect(() => {
    if (!pharmacy?.id) return
    const supabase = createClient()
    void supabase
      .from('pharmacies')
      .select(
        'subscription_status, subscription_tier, subscription_billing, trial_end, current_period_end, stripe_customer_id',
      )
      .eq('id', pharmacy.id)
      .maybeSingle()
      .then(({ data }) => {
        setBilling((data as StripeFields | null) ?? null)
        setLoading(false)
      })
  }, [pharmacy?.id])

  async function openPortal() {
    setOpening(true)
    capture('billing_portal_opened', { source: 'admin_settings' })
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      if (!res.ok) {
        const { error } = (await res.json().catch(() => ({ error: 'unknown' }))) as {
          error?: string
        }
        if (error === 'no_stripe_customer') {
          toast.error(
            'Aucun abonnement Stripe rattaché à votre officine. Contactez le support.',
          )
        } else if (error === 'titulaire_only') {
          toast.error('Seul le titulaire peut gérer l’abonnement.')
        } else {
          toast.error(
            'Impossible d’ouvrir le portail Stripe. Réessayez dans un instant.',
          )
        }
        setOpening(false)
        return
      }
      const { portal_url } = (await res.json()) as { portal_url: string }
      window.location.href = portal_url
    } catch {
      toast.error('Erreur réseau. Vérifiez votre connexion et réessayez.')
      setOpening(false)
    }
  }

  const status = billing?.subscription_status ?? null
  const tier = billing?.subscription_tier ?? null
  const billingPeriod = billing?.subscription_billing ?? null
  const trialEnd = billing?.trial_end ?? null
  const nextCharge = billing?.current_period_end ?? null
  const hasStripeCustomer = Boolean(billing?.stripe_customer_id)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Landmark className="h-5 w-5" />
          Abonnement
        </CardTitle>
        <CardDescription>
          Consultez l&apos;état de votre abonnement et accédez à votre espace de
          facturation Stripe pour mettre à jour votre IBAN / mandat SEPA, changer
          de formule ou annuler.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Chargement…
          </div>
        ) : (
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Statut
              </dt>
              <dd className="mt-1">
                {status ? (
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_TONE[status]}`}
                  >
                    {STATUS_LABELS[status]}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Formule
              </dt>
              <dd className="mt-1 font-medium text-slate-900">
                {tier ? TIER_LABELS[tier] : '—'}
                {billingPeriod ? (
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                    ({billingPeriod === 'monthly' ? 'mensuel' : 'annuel'})
                  </span>
                ) : null}
              </dd>
            </div>

            {status === 'trialing' && trialEnd ? (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Premier prélèvement
                </dt>
                <dd className="mt-1 text-slate-900">{formatDate(trialEnd)}</dd>
              </div>
            ) : null}

            {(status === 'active' || status === 'past_due') && nextCharge ? (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Prochain prélèvement
                </dt>
                <dd className="mt-1 text-slate-900">{formatDate(nextCharge)}</dd>
              </div>
            ) : null}
          </dl>
        )}

        {!loading && !hasStripeCustomer ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Aucun abonnement Stripe n&apos;est encore rattaché à votre officine.
            Terminez le parcours d&apos;activation depuis l&apos;onboarding pour
            accéder au portail de facturation.
          </p>
        ) : null}
      </CardContent>

      <CardFooter className="flex flex-col items-stretch gap-2 border-t px-3 pt-4 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:pt-6">
        <p className="text-xs text-muted-foreground">
          Vous serez redirigé·e vers le portail sécurisé Stripe.
        </p>
        <Button
          type="button"
          onClick={openPortal}
          disabled={opening || loading || !hasStripeCustomer}
        >
          {opening ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
          )}
          Gérer mon abonnement
        </Button>
      </CardFooter>
    </Card>
  )
}
