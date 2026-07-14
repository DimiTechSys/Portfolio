'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { capture } from '@/lib/analytics/posthog'
import { ONBOARDING_EVENTS } from '@/lib/analytics/events'
import { Button } from '@/components/ui/button'
import { HotlineCTA } from '@/components/marketing/hotline-cta'
import { WizardBackLink } from '@/components/onboarding/back-link'

type Tier = 'po' | 'otm' | 'go'
type Billing = 'monthly' | 'yearly'

type TierInfo = {
  id: Tier
  name: string
  audience: string
  monthly: string
  yearly: string
  yearlyEquiv: string
  recommended?: boolean
}

// PRICING-V2 (cf. legal/internal/PRICING-2026-v2.md). Annuel = -20 %, payé
// d'un coup ; `yearlyEquiv` = équivalent mensuel affiché en annuel. Le tier EP
// (sur devis) n'apparaît pas ici : il n'est pas self-serve.
const TIERS: TierInfo[] = [
  {
    id: 'po',
    name: 'Petite officine',
    audience: '1 à 3 personnes',
    monthly: '49 €',
    yearly: '468 €',
    yearlyEquiv: '39 €',
  },
  {
    id: 'otm',
    name: 'Officine moyenne',
    audience: '4 à 9 personnes',
    monthly: '99 €',
    yearly: '948 €',
    yearlyEquiv: '79 €',
    recommended: true,
  },
  {
    id: 'go',
    name: 'Grande officine',
    audience: '10 à 15 personnes',
    monthly: '179 €',
    yearly: '1 716 €',
    yearlyEquiv: '143 €',
  },
]

export default function ActivatePage() {
  const router = useRouter()
  const [tier, setTier] = useState<Tier>('po')
  const [billing, setBilling] = useState<Billing>('monthly')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    capture(ONBOARDING_EVENTS.onboarding_activate_viewed)
  }, [])

  async function handleCheckout() {
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/stripe/checkout-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, billing }),
      })

      if (!res.ok) {
        const { error: serverError } = (await res.json().catch(() => ({}))) as {
          error?: string
        }
        if (serverError === 'no_pharmacy') {
          setError('Aucune officine rattachée à votre compte. Revenez à l’étape 1.')
        } else if (serverError === 'stripe_not_configured' || serverError === 'price_not_configured') {
          const isLocal =
            typeof window !== 'undefined' &&
            (window.location.hostname === 'localhost' ||
              window.location.hostname === '127.0.0.1')
          setError(
            isLocal
              ? serverError === 'price_not_configured'
                ? 'Variables STRIPE_PRICE_* manquantes dans .env.local. Copiez-les depuis Vercel (Preview), puis redémarrez npm run dev.'
                : 'STRIPE_SECRET_KEY manquante dans .env.local. Copiez-la depuis Vercel (Preview), puis redémarrez npm run dev.'
              : 'Service de paiement temporairement indisponible. Réessayez dans un instant.',
          )
        } else {
          setError('Impossible de démarrer le paiement. Réessayez ou contactez le support.')
        }
        setLoading(false)
        return
      }

      const { checkout_url } = (await res.json()) as { checkout_url: string }
      window.location.href = checkout_url
    } catch {
      setError('Erreur réseau. Vérifiez votre connexion et réessayez.')
      setLoading(false)
    }
  }

  const priceLabel = billing === 'monthly' ? 'mois' : 'an'
  const selected = TIERS.find((t) => t.id === tier)

  // Prevent unused warning on `router` if we later decide not to use it.
  void router

  return (
    <div className="flex flex-col gap-4">
      <WizardBackLink href="/onboarding/invite" label="Équipe" />
      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-semibold tracking-tight">
          Activez votre essai 30 jours
        </h1>
        <p className="text-sm text-muted-foreground">
          €0 prélevés pendant 30 jours. Premier prélèvement à J+30 au tarif de votre
          formule. Annulable à tout moment.
        </p>
      </div>

      {/* Toggle mensuel / annuel */}
      <div
        role="group"
        aria-label="Période de facturation"
        className="grid grid-cols-2 rounded-lg border border-border p-1"
      >
        <button
          type="button"
          onClick={() => setBilling('monthly')}
          className={[
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            billing === 'monthly' ? 'bg-slate-900 text-white' : 'text-muted-foreground',
          ].join(' ')}
        >
          Mensuel
        </button>
        <button
          type="button"
          onClick={() => setBilling('yearly')}
          className={[
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            billing === 'yearly' ? 'bg-slate-900 text-white' : 'text-muted-foreground',
          ].join(' ')}
        >
          Annuel <span className="text-[10px] opacity-80">(-20 %)</span>
        </button>
      </div>

      {/* Tier selector */}
      <div className="flex flex-col gap-2">
        {TIERS.map((t) => {
          const isSelected = tier === t.id
          const price = billing === 'monthly' ? t.monthly : t.yearly
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTier(t.id)}
              aria-pressed={isSelected}
              className={[
                'flex items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors',
                isSelected
                  ? 'border-slate-900 bg-slate-50'
                  : 'border-border bg-background hover:bg-muted/50',
              ].join(' ')}
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-semibold">{t.name}</span>
                  {t.recommended && (
                    <span className="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                      Recommandé
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{t.audience}</span>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-0">
                <div className="flex items-baseline gap-1 whitespace-nowrap">
                  <span className="text-base font-semibold">{price}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  HT / {priceLabel}
                  {billing === 'yearly' ? ` · ≈ ${t.yearlyEquiv}/mois` : ''}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button onClick={handleCheckout} disabled={loading} className="w-full py-2">
        {loading
          ? 'Préparation du prélèvement…'
          : `Renseigner mon IBAN · ${selected?.name ?? ''}`}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Prélèvement SEPA sécurisé via Stripe · IBAN requis (0 € prélevé pendant 30 jours)
      </p>

      <div className="border-t border-border pt-4 text-center">
        <p className="mb-2 text-xs text-muted-foreground">Une question avant de démarrer ?</p>
        <HotlineCTA context="onboarding_activate" variant="link" />
      </div>
    </div>
  )
}
