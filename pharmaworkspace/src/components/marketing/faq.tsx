import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { SUPPORT_EMAIL } from '@/config/constants'

type FaqEntry = {
  question: string
  answer: ReactNode
}

const ENTRIES: FaqEntry[] = [
  {
    question: 'Comment fonctionne l’essai gratuit ?',
    answer: (
      <>
        30 jours d’accès complet à toutes les fonctionnalités. Nous demandons votre IBAN
        (mandat de prélèvement SEPA) à l’inscription pour valider votre compte (standard SaaS
        B2B), mais <strong>0 € sont prélevés pendant 30 jours</strong>. Premier prélèvement au
        tarif de votre formule le 31ᵉ jour, sauf annulation.
      </>
    ),
  },
  {
    question: 'Comment être sûr que mon équipe va l’adopter ?',
    answer: (
      <>
        C’est la question la plus fréquente. 40 % des pharmaciens nous l’ont posée pendant
        notre enquête. PharmaWorkspace est conçu pour qu’un préparateur l’utilise sans
        formation. L’essai inclut un onboarding équipe en visio gratuite (30 min) et un widget
        de missions guide chaque membre dans la prise en main pendant la première semaine.
      </>
    ),
  },
  {
    question: 'Mes données patient quittent-elles l’Europe ?',
    answer: <>Non. Hébergement Supabase Paris, OCR Mistral France. Aucun transfert hors UE.</>,
  },
  {
    question: 'PharmaWorkspace remplace-t-il mon LGO ?',
    answer: (
      <>
        Non, et c’est volontaire. Votre LGO (Winpharma, LGPI, LEO, Smart Rx…) gère la vente,
        le tiers payant, la traçabilité. PharmaWorkspace gère l’organisation interne de votre
        équipe : qui fait quoi, qui transmet quoi à qui, où en sont vos ruptures, qui a loué
        quel matériel. Les deux outils coexistent sans conflit.
      </>
    ),
  },
  {
    question: 'Comment annuler ?',
    answer: (
      <>
        Dans votre compte → Facturation → Annuler l’abonnement. Si vous annulez avant J+30,
        0 € prélevés. Si après, prélèvement annulé pour la prochaine échéance.
      </>
    ),
  },
  {
    question: 'Y a-t-il une remise pour les pharmacies en groupement ?',
    answer: (
      <>
        Si votre groupement (Giphar, Aprium, Giropharm, Pharmavie, Totum, Pharmuni et autres)
        souhaite déployer PharmaWorkspace sur plusieurs officines, nous pouvons mettre en place
        un accord cadre avec conditions tarifaires adaptées. Écrivez à{' '}
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="font-medium text-teal-700 underline-offset-4 hover:underline"
        >
          {SUPPORT_EMAIL}
        </a>{' '}
        en mentionnant votre groupement.
      </>
    ),
  },
]

export function Faq() {
  return (
    <section id="faq" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-teal-700">FAQ</span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-balance text-slate-900 sm:text-4xl">
            Les questions qu’on nous pose le plus
          </h2>
        </div>
        <div className="mt-12 space-y-3">
          {ENTRIES.map((entry) => (
            <details key={entry.question} className="group rounded-2xl border border-slate-200 bg-white">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 text-left text-base font-semibold text-slate-900">
                {entry.question}
                <ChevronDown
                  className="h-5 w-5 text-slate-400 transition group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <div className="border-t border-slate-100 px-6 py-4 text-sm leading-relaxed text-slate-600">
                {entry.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
