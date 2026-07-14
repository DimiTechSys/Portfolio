import { ChevronDown } from 'lucide-react'
import { SUPPORT_EMAIL } from '@/config/constants'

const FAQ_ITEMS: { question: string; answer: string }[] = [
  {
    question: 'Comment fonctionne l\'essai gratuit ?',
    answer:
      "30 jours d'accès complet à toutes les fonctionnalités. Nous demandons votre IBAN (mandat de prélèvement SEPA) à l'inscription pour valider votre compte (standard SaaS B2B), mais aucun prélèvement n'est effectué pendant les 30 jours. Premier prélèvement au tarif de votre formule le 31ᵉ jour, sauf annulation.",
  },
  {
    question: 'Comment être sûr que mon équipe va l\'adopter ?',
    answer:
      "C'est la question la plus fréquente. 40 % des pharmaciens nous l'ont posée pendant notre enquête. Notre réponse : on a conçu PharmaWorkspace pour qu'un préparateur puisse l'utiliser sans formation. Concrètement, votre essai 30 jours inclut un onboarding équipe accompagné en visio (gratuit, 30 min) pour vous aider à le présenter à votre équipe, et un widget de missions guide chaque membre dans la prise en main pendant la première semaine.",
  },
  {
    question: 'Combien de comptes équipe sont inclus par formule ?',
    answer:
      'PO (Petite Officine) : jusqu\'à 3 comptes équipe. OM (Officine Moyenne) : 4 à 9 comptes. GO (Grande Officine) : 10 à 15 comptes. EP (Enterprise / groupement, sur devis) : comptes illimités. Si vous dépassez votre formule en cours d\'abonnement, vous changez en un clic depuis votre espace facturation, sans interruption de service.',
  },
  {
    question: 'Puis-je changer de formule en cours d\'abonnement ?',
    answer:
      "Oui, à tout moment depuis votre espace facturation. Le passage à une formule supérieure (PO → OM, OM → GO) est effectif immédiatement avec proratisation. Le passage à une formule inférieure prend effet à la prochaine période de facturation.",
  },
  {
    question: 'Quelles méthodes de paiement acceptez-vous ?',
    answer:
      'Prélèvement SEPA (mandat signé via votre IBAN) géré par Stripe. Le paiement est sécurisé et conforme, et aucune coordonnée bancaire n\'est stockée sur nos serveurs.',
  },
  {
    question: 'Y a-t-il un engagement de durée ?',
    answer:
      'Mensuel : sans engagement, annulable à tout moment depuis votre espace facturation. Annuel : -20 % à vie de l\'engagement, payé en une fois à la souscription.',
  },
  {
    question: 'Comment annuler mon abonnement ?',
    answer:
      'Dans votre compte → Facturation → Annuler l\'abonnement. Si vous annulez pendant les 30 jours d\'essai, aucun prélèvement. Après J+30, le prélèvement en cours est annulé pour la prochaine échéance et votre accès reste actif jusqu\'à la fin de la période payée.',
  },
  {
    question: 'Y a-t-il une offre de lancement ?',
    answer:
      "Oui : les 20 premières officines qui activent un abonnement mensuel reçoivent le code PILOTE20 (-20 % sur leur premier mois), communiqué à la fin de l'essai. Offre limitée aux 20 premières conversions payantes. En annuel, vous bénéficiez déjà de -20 % via l'engagement.",
  },
  {
    question: 'Y a-t-il une remise pour les pharmacies en groupement ?',
    answer:
      `Si votre groupement (Giphar, Aprium, Giropharm, Pharmavie, Totum, Pharmuni et autres) souhaite déployer PharmaWorkspace sur plusieurs officines, nous pouvons mettre en place un accord cadre avec conditions tarifaires adaptées. Écrivez à ${SUPPORT_EMAIL} en mentionnant votre groupement.`,
  },
]

export function PricingFaq() {
  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Questions fréquentes
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Vous avez une autre question ?{' '}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="font-medium text-teal-700 underline-offset-4 hover:underline"
          >
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </div>

      <div className="space-y-3">
        {FAQ_ITEMS.map((item) => (
          <details
            key={item.question}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left">
              <span className="text-sm font-medium text-slate-900 sm:text-base">
                {item.question}
              </span>
              <ChevronDown
                className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  )
}
