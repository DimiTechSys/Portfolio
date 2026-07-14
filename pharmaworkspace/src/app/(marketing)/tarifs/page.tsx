import Link from 'next/link'
import { PricingTable } from '@/components/marketing/pricing-table'
import { PricingFaq } from '@/components/marketing/pricing-faq'
import { HotlineCTA } from '@/components/marketing/hotline-cta'

export const metadata = {
  title: 'Tarifs | PharmaWorkspace',
  alternates: { canonical: '/tarifs' },
  description:
    'À partir de 49 € HT/mois, sans engagement (-20 % en annuel). 30 jours d\'essai gratuit, IBAN renseigné à l\'inscription (mandat SEPA), aucun prélèvement avant J+30.',
}

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      {/* Header */}
      <header className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          Une tarification claire, sans engagement
        </h1>
        <p className="mt-4 text-base text-slate-600 sm:text-lg">
          Toutes les fonctionnalités dans chaque formule. Ce qui change selon la
          taille de votre équipe : le nombre de comptes et le niveau de service.
          Sans engagement, ou <strong>-20 % en annuel</strong>.
        </p>
      </header>

      {/* Cards pricing avec toggle */}
      <div className="mt-12">
        <PricingTable />
      </div>

      {/* Bandeau "vous hésitez ? réservez un appel" */}
      <div className="mx-auto mt-16 max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
        <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
          Vous hésitez sur le tier adapté ?
        </h2>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          Petite officine indépendante, équipe en groupement, multi-comptoirs :
          on a discuté avec plus de 110 pharmaciens pour calibrer ces formules.
          15 minutes avec notre équipe pour valider que la nôtre vous va.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <HotlineCTA
            context="tarifs_cta"
            label="Parler à notre équipe"
          />
          <Link
            href="/signup?source=tarifs_cta"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
          >
            Démarrer maintenant · 30 jours gratuits
          </Link>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-20">
        <PricingFaq />
      </div>

      {/* Footer CTA */}
      <div className="mt-20 text-center">
        <p className="text-sm text-slate-600">
          Toutes les fonctionnalités dans chaque formule. Pas de surprise.{' '}
          <Link
            href="/signup?source=tarifs_footer"
            className="font-medium text-teal-700 underline-offset-4 hover:underline"
          >
            Démarrer un essai gratuit →
          </Link>
        </p>
      </div>
    </div>
  )
}
