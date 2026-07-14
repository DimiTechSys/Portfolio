import { CookieChoiceButton } from '@/components/marketing/cookie-choice-button'

export const metadata = {
  title: 'Cookies et traceurs | PharmaWorkspace',
  alternates: { canonical: '/cookies' },
  description:
    'Inventaire des cookies déposés par PharmaWorkspace, leur finalité, leur durée et leur base légale. Modifiez votre choix à tout moment.',
}

const COOKIE_ROWS = [
  {
    name: 'sb-<projectref>-auth-token (et dérivés)',
    domain: 'pharmaworkspace.fr',
    purpose: "Session d'authentification Supabase (JWT)",
    duration: 'Session (renouvellement auto)',
    legalBasis: 'Strictement nécessaire au service (art. 82 al. 1 loi 78-17)',
  },
  {
    name: 'pw_cookie_consent',
    domain: 'pharmaworkspace.fr',
    purpose:
      "Mémorisation du choix de l'utilisateur sur les cookies analytics",
    duration: '13 mois',
    legalBasis: 'Strictement nécessaire au respect du choix',
  },
  {
    name: 'ph_<token>_posthog',
    domain: 'pharmaworkspace.fr',
    purpose:
      'Mesure d\'audience produit et analyse comportementale via PostHog Cloud EU',
    duration: '12 mois',
    legalBasis:
      'Consentement (visiteurs anonymes) / Intérêt légitime contractuel (utilisateurs authentifiés)',
  },
  {
    name: 'Cookies Stripe',
    domain: 'stripe.com (tiers)',
    purpose:
      'Sécurisation paiement et lutte contre la fraude lors de Checkout et Customer Portal',
    duration: 'Variable, voir politique Stripe',
    legalBasis: 'Strictement nécessaire au service de paiement',
  },
]

export default function CookiesPage() {
  return (
    <article className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="border-b border-slate-200 pb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Cookies et traceurs
        </h1>
      </header>

      <div className="mt-10 space-y-4 text-sm leading-relaxed text-slate-600 sm:text-base">
        <p>
          PharmaWorkspace dépose un nombre volontairement réduit de cookies.
          Aucun cookie publicitaire, aucun traceur tiers de ciblage. Les seuls
          cookies non strictement nécessaires concernent la mesure
          d&apos;audience de notre produit (PostHog Cloud EU, données hébergées
          à Francfort), et ils ne sont déposés qu&apos;avec votre accord si
          vous n&apos;êtes pas connecté.
        </p>
        <p>
          Lors de votre première visite, un bandeau vous propose
          d&apos;accepter ou de refuser ces cookies de mesure d&apos;audience.
          Votre choix est mémorisé pendant 13 mois et n&apos;affecte en rien
          l&apos;accès au site ou au service. Pour les utilisateurs
          authentifiés, la mesure d&apos;audience repose sur l&apos;intérêt
          légitime contractuel décrit dans notre{' '}
          <a
            href="/privacy"
            className="font-medium text-teal-700 underline-offset-4 hover:underline"
          >
            Politique de Confidentialité
          </a>
          .
        </p>
        <p>
          Vous pouvez modifier votre choix à tout moment via le bouton en bas
          de cette page : le bandeau réapparaîtra et votre nouvelle décision
          sera appliquée immédiatement.
        </p>
      </div>

      <div className="mt-10 overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-900">
              <th className="px-4 py-3 font-semibold">Cookie</th>
              <th className="px-4 py-3 font-semibold">Domaine</th>
              <th className="px-4 py-3 font-semibold">Finalité</th>
              <th className="px-4 py-3 font-semibold">Durée</th>
              <th className="px-4 py-3 font-semibold">Base légale</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {COOKIE_ROWS.map((row) => (
              <tr key={row.name}>
                <td className="px-4 py-3 font-mono text-xs text-slate-900">
                  {row.name}
                </td>
                <td className="px-4 py-3">{row.domain}</td>
                <td className="px-4 py-3">{row.purpose}</td>
                <td className="px-4 py-3">{row.duration}</td>
                <td className="px-4 py-3">{row.legalBasis}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-xs text-slate-500">
        Sentry (détection d&apos;erreurs, instance EU) ne dépose aucun cookie.
        Les cookies Stripe ne sont déposés que sur le domaine stripe.com lors
        d&apos;une visite de leurs pages de paiement (Checkout, Customer
        Portal), conformément à leur propre politique de confidentialité.
      </p>

      <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
        <h2 className="text-base font-semibold text-slate-900">
          Modifier mon choix
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
          Efface votre choix actuel et fait réapparaître le bandeau de
          consentement.
        </p>
        <div className="mt-4">
          <CookieChoiceButton />
        </div>
      </div>
    </article>
  )
}
