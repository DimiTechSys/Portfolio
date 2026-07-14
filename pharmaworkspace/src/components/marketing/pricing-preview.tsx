import Link from 'next/link'
import { Check } from 'lucide-react'

type Tier = {
  code: string
  name: string
  fullName: string
  capacity: string
  price: string
  priceSuffix: string
  href: string
  cta: string
  external?: boolean
  features: string[]
  highlighted?: boolean
}

// PRICING-V2 (cf. legal/internal/PRICING-2026-v2.md). 4 tiers par ETP, toutes
// les fonctionnalités incluses partout ; la différenciation porte sur la
// capacité (comptes) et le niveau de service. EP = sur devis (pas self-serve).
const TIERS: Tier[] = [
  {
    code: 'po',
    name: 'PO',
    fullName: 'Petite Officine',
    capacity: '1 à 3 comptes équipe',
    price: '49 €',
    priceSuffix: 'HT/mois',
    href: '/signup?tier=po&source=tarifs',
    cta: 'Démarrer 30 jours gratuits',
    features: [
      'Tâches et transmissions d’équipe',
      'Ordonnances avec OCR Mistral (France)',
      'Ruptures CIP13 et alertes ANSM',
      'Locations, planning, formation, salon d’équipe',
      'Support email sous 24 h',
    ],
  },
  {
    code: 'otm',
    name: 'OM',
    fullName: 'Officine Moyenne',
    capacity: '4 à 9 comptes équipe',
    price: '99 €',
    priceSuffix: 'HT/mois',
    href: '/signup?tier=otm&source=tarifs',
    cta: 'Démarrer 30 jours gratuits',
    highlighted: true,
    features: [
      'Toutes les fonctionnalités de PO',
      'Jusqu’à 9 comptes équipe',
      'Support prioritaire sous 24 h',
      'Onboarding équipe en visio (30 min)',
    ],
  },
  {
    code: 'go',
    name: 'GO',
    fullName: 'Grande Officine',
    capacity: '10 à 15 comptes équipe',
    price: '179 €',
    priceSuffix: 'HT/mois',
    href: '/signup?tier=go&source=tarifs',
    cta: 'Démarrer 30 jours gratuits',
    features: [
      'Toutes les fonctionnalités de OM',
      'Jusqu’à 15 comptes équipe',
      'Audit log avancé + exports compta / paie',
      'Dashboard manager + hotline fondateur',
    ],
  },
  {
    code: 'ep',
    name: 'EP',
    fullName: 'Enterprise / Pôle',
    capacity: '15+ ou groupement',
    price: 'Sur devis',
    priceSuffix: '',
    href: 'https://hotline.baseflow.fr',
    cta: 'Réserver un appel',
    external: true,
    features: [
      'Comptes équipe illimités',
      'Account manager dédié',
      'SLA contractuel 99,5 %',
      'Facturation consolidée groupement',
    ],
  },
]

export function PricingPreview() {
  return (
    <section id="tarifs" className="bg-slate-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-teal-700">Tarifs</span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-balance text-slate-900 sm:text-5xl">
            Une formule par taille d’équipe.
            <br />
            Toutes les fonctionnalités incluses.
          </h2>
          <p className="mt-6 text-lg text-slate-600">
            30 jours d’essai, IBAN renseigné à l’inscription, 0 € prélevé avant J+30.
            Engagement annuel optionnel à <strong>-20 %</strong>. Sans engagement, annulable en 2 clics.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((tier) => (
            <div
              key={tier.code}
              className={
                tier.highlighted
                  ? 'ring-teal relative flex flex-col rounded-3xl border border-teal-300 bg-white p-8 lg:-mt-4'
                  : 'card-shadow flex flex-col rounded-3xl border border-slate-200 bg-white p-8'
              }
            >
              {tier.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 px-4 py-1 text-xs font-semibold text-white">
                  Recommandé
                </span>
              )}
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {tier.name} <span className="font-normal text-slate-500">({tier.fullName})</span>
                </h3>
                <p className="mt-1 text-sm text-slate-500">{tier.capacity}</p>
              </div>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight text-slate-900">{tier.price}</span>
                {tier.priceSuffix && <span className="text-sm text-slate-500">{tier.priceSuffix}</span>}
              </div>
              <Link
                href={tier.href}
                {...(tier.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className={
                  tier.highlighted
                    ? 'mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-90'
                    : 'mt-8 inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-50'
                }
              >
                {tier.cta}
              </Link>
              <ul className="mt-8 space-y-3 border-t border-slate-100 pt-6 text-sm text-slate-700">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" strokeWidth={2.5} aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-12 max-w-3xl text-center text-base text-slate-600">
          Toutes les formules donnent accès à <strong>tous les modules</strong>.
          Ce qui change selon la taille de votre équipe : le nombre de comptes et le niveau de service.
        </p>
      </div>
    </section>
  )
}
