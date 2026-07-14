'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

type BillingPeriod = 'monthly' | 'yearly'

type Tier = {
  id: 'po' | 'otm' | 'go' | 'ep'
  name: string
  fullName: string
  audience: string
  // Montants HT en euros. `quote` = tier sur devis (EP), pas de prix chiffré.
  priceMonthly?: number
  priceYearly?: number
  yearlyEquiv?: number
  quote?: boolean
  cta: string
  href: string
  external?: boolean
  features: string[]
  highlighted?: boolean
  badge?: string
}

const COMMON_FEATURES = [
  'Tâches et transmissions d\'équipe',
  'Ordonnances avec OCR Mistral (France)',
  'Ruptures CIP13 et alertes ANSM',
  'Locations matériel + photos',
  'Salon textuel d\'équipe',
  'Planning de présence et congés',
  'Formation interne',
] as const

// PRICING-V2 (cf. legal/internal/PRICING-2026-v2.md). Annuel = -20 %, payé
// d'un coup. Toutes les fonctionnalités incluses partout ; la différenciation
// porte sur la capacité (comptes) et le service. EP = sur devis (pas self-serve).
const TIERS: Tier[] = [
  {
    id: 'po',
    name: 'PO',
    fullName: 'Petite Officine',
    audience: '1 à 3 comptes équipe',
    priceMonthly: 49,
    priceYearly: 468,
    yearlyEquiv: 39,
    cta: 'Démarrer 30 jours gratuits',
    href: '/signup?tier=po&billing=%BILLING%&source=tarifs',
    features: [...COMMON_FEATURES, 'Support email sous 24 h'],
  },
  {
    id: 'otm',
    name: 'OM',
    fullName: 'Officine Moyenne',
    audience: '4 à 9 comptes équipe',
    priceMonthly: 99,
    priceYearly: 948,
    yearlyEquiv: 79,
    highlighted: true,
    badge: 'Recommandé',
    cta: 'Démarrer 30 jours gratuits',
    href: '/signup?tier=otm&billing=%BILLING%&source=tarifs',
    features: [
      ...COMMON_FEATURES,
      'Jusqu\'à 9 comptes équipe',
      'Support prioritaire sous 24 h',
      'Onboarding équipe accompagné (visio 30 min)',
    ],
  },
  {
    id: 'go',
    name: 'GO',
    fullName: 'Grande Officine',
    audience: '10 à 15 comptes équipe',
    priceMonthly: 179,
    priceYearly: 1716,
    yearlyEquiv: 143,
    cta: 'Démarrer 30 jours gratuits',
    href: '/signup?tier=go&billing=%BILLING%&source=tarifs',
    features: [
      ...COMMON_FEATURES,
      'Jusqu\'à 15 comptes équipe',
      'Audit log avancé (full-text + export CSV)',
      'Exports comptables / paie + dashboard manager',
      'Hotline directe fondateur',
    ],
  },
  {
    id: 'ep',
    name: 'EP',
    fullName: 'Enterprise / Pôle',
    audience: '15+ ou groupement',
    quote: true,
    cta: 'Réserver un appel',
    href: 'https://hotline.baseflow.fr',
    external: true,
    features: [
      'Comptes équipe illimités',
      'Account manager dédié',
      'SLA contractuel uptime 99,5 %',
      'Facturation consolidée groupement + reporting',
    ],
  },
]

export function PricingTable() {
  const [billing, setBilling] = useState<BillingPeriod>('monthly')

  return (
    <div className="space-y-10">
      {/* Toggle mensuel/annuel */}
      <div className="flex items-center justify-center gap-3">
        <span
          className={cn(
            'text-sm font-medium transition-colors',
            billing === 'monthly' ? 'text-slate-900' : 'text-slate-400'
          )}
        >
          Mensuel
        </span>
        <button
          type="button"
          onClick={() => setBilling(b => (b === 'monthly' ? 'yearly' : 'monthly'))}
          className={cn(
            'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2',
            billing === 'yearly' ? 'bg-teal-600' : 'bg-slate-300'
          )}
          aria-label="Basculer entre tarification mensuelle et annuelle"
        >
          <span
            className={cn(
              'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
              billing === 'yearly' ? 'translate-x-6' : 'translate-x-1'
            )}
          />
        </button>
        <span
          className={cn(
            'text-sm font-medium transition-colors',
            billing === 'yearly' ? 'text-slate-900' : 'text-slate-400'
          )}
        >
          Annuel{' '}
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
            -20 %
          </span>
        </span>
      </div>

      {/* Cartes pricing */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((tier) => {
          const href = tier.href.replace('%BILLING%', billing)
          return (
            <article
              key={tier.id}
              className={cn(
                'relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition-shadow',
                tier.highlighted
                  ? 'border-teal-300 ring-2 ring-teal-500/20 shadow-md'
                  : 'border-slate-200'
              )}
            >
              {tier.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-teal-600 px-3 py-1 text-xs font-medium text-white shadow">
                  {tier.badge}
                </span>
              )}

              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-slate-900">
                  {tier.name}{' '}
                  <span className="text-sm font-normal text-slate-500">({tier.fullName})</span>
                </h3>
                <p className="text-sm text-slate-500">{tier.audience}</p>
              </div>

              {tier.quote ? (
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-slate-900">Sur devis</span>
                </div>
              ) : (
                <>
                  <div className="mt-6 flex items-baseline gap-2">
                    <span className="text-4xl font-bold tracking-tight text-slate-900">
                      {billing === 'monthly' ? tier.priceMonthly : tier.priceYearly} €
                    </span>
                    <span className="text-sm text-slate-500">
                      HT/{billing === 'monthly' ? 'mois' : 'an'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">
                    {billing === 'yearly'
                      ? `≈ ${tier.yearlyEquiv} €/mois · payé en une fois`
                      : 'ou -20 % en annuel'}
                  </p>
                </>
              )}

              <ul className="mt-6 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-teal-600"
                      aria-hidden="true"
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Link
                  href={href}
                  {...(tier.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className={cn(
                    'flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-medium shadow-sm transition-colors',
                    tier.highlighted
                      ? 'bg-teal-600 text-white hover:bg-teal-700'
                      : 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50'
                  )}
                >
                  {tier.cta}
                </Link>
              </div>
            </article>
          )
        })}
      </div>

      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          Toutes les fonctionnalités dans chaque formule.
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          PO, OM, GO ou EP : vous accédez aux mêmes modules. Ce qui change selon la
          taille de votre équipe, c’est le nombre de comptes et le niveau de service
          (support, onboarding, exports, SLA).
        </p>
      </div>

      {/* Mention essai */}
      <p className="text-center text-sm text-slate-500">
        <Sparkles className="mr-1 inline h-4 w-4 text-teal-600" aria-hidden="true" />
        30 jours d&apos;essai · IBAN renseigné à l&apos;inscription · €0 prélevé avant J+30
        · Annulable à tout moment
      </p>
    </div>
  )
}
