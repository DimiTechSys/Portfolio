'use client'

import { useEffect, useRef, useState } from 'react'
import { useProfile } from '@/contexts/profile-context'
import { capture } from '@/lib/analytics/posthog'
import {
  getDaysUntilCharge,
  shouldShowPastDueBanner,
  shouldShowTrialBanner,
  type PharmacySubscriptionFields,
} from '@/lib/subscription'
import { toast } from 'sonner'

// Mapping (tier, billing) → libellé prix affiché dans le banner.
// PRICING-V2 (cf. legal/internal/PRICING-2026-v2.md). Reste cohérent avec les
// montants des price IDs Stripe.
const TIER_PRICE_LABEL: Record<string, string> = {
  'po-monthly': '49 € HT/mois',
  'po-yearly': '468 € HT/an',
  'otm-monthly': '99 € HT/mois',
  'otm-yearly': '948 € HT/an',
  'go-monthly': '179 € HT/mois',
  'go-yearly': '1 716 € HT/an',
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
    }).format(new Date(iso))
  } catch {
    return ''
  }
}

/**
 * Lit pharmacy depuis useProfile et la cast vers les champs Stripe.
 * Le type Pharmacy autogénéré ne contient pas encore les colonnes ajoutées
 * par la migration 0042 (les types DB seront regen après merge). On force
 * la lecture via `as unknown as` : au runtime les champs existent (lus par
 * le ProfileContext via select('*')).
 */
function usePharmacySubscription(): {
  fields: PharmacySubscriptionFields | null
  tier: string | null
  billing: string | null
} {
  const { pharmacy } = useProfile()
  if (!pharmacy) return { fields: null, tier: null, billing: null }

  const fields = pharmacy as unknown as PharmacySubscriptionFields & {
    subscription_tier: string | null
    subscription_billing: string | null
  }
  return {
    fields,
    tier: fields.subscription_tier ?? null,
    billing: fields.subscription_billing ?? null,
  }
}

export function TrialBanner() {
  const { fields, tier, billing } = usePharmacySubscription()
  const [loading, setLoading] = useState(false)
  const captureFired = useRef<string | null>(null)

  const showTrial = fields ? shouldShowTrialBanner(fields) : false
  const showPastDue = fields ? shouldShowPastDueBanner(fields) : false
  const variant = showTrial ? 'trialing' : showPastDue ? 'past_due' : null

  useEffect(() => {
    if (!variant) return
    // Une seule émission PostHog par variant pour éviter le spam au re-render.
    if (captureFired.current === variant) return
    captureFired.current = variant
    capture('trial_banner_shown', { variant })
  }, [variant])

  if (!variant) return null

  async function openPortal() {
    setLoading(true)
    capture('trial_banner_clicked', { variant })
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      if (!res.ok) {
        toast.error('Impossible d’ouvrir le portail Stripe. Réessayez dans un instant.')
        setLoading(false)
        return
      }
      const { portal_url } = (await res.json()) as { portal_url: string }
      window.location.href = portal_url
    } catch {
      toast.error('Erreur réseau. Vérifiez votre connexion et réessayez.')
      setLoading(false)
    }
  }

  if (variant === 'trialing') {
    const days = fields ? getDaysUntilCharge(fields) ?? 0 : 0
    const dateLabel = formatDate(fields?.trial_end ?? null)
    const priceLabel =
      tier && billing ? TIER_PRICE_LABEL[`${tier}-${billing}`] ?? '' : ''

    return (
      <div className="border-b border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-900">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <span>
            🗓️ Votre essai se termine dans <strong>{days} {days <= 1 ? 'jour' : 'jours'}</strong>
            {dateLabel ? ` (le ${dateLabel})` : ''}
            {priceLabel ? `. Premier prélèvement : ${priceLabel}.` : '.'}
          </span>
          <button
            type="button"
            onClick={openPortal}
            disabled={loading}
            className="rounded-full bg-blue-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-800 disabled:opacity-50"
          >
            {loading ? 'Ouverture…' : 'Gérer mon abonnement'}
          </button>
        </div>
      </div>
    )
  }

  // past_due
  return (
    <div className="border-b border-orange-200 bg-orange-50 px-4 py-2 text-sm text-orange-900">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <span>
          ⚠️ Votre prélèvement a échoué. Mettez à jour votre IBAN pour ne pas perdre l’accès.
        </span>
        <button
          type="button"
          onClick={openPortal}
          disabled={loading}
          className="rounded-full bg-orange-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-800 disabled:opacity-50"
        >
          {loading ? 'Ouverture…' : 'Mettre à jour mon IBAN'}
        </button>
      </div>
    </div>
  )
}
