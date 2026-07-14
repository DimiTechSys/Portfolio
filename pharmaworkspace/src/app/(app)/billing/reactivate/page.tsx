// /billing/reactivate : page de réactivation pour les pharmacies en
// `canceled` ou `unpaid`. Le middleware (à wirer dans src/proxy.ts en étape
// hors-ticket) redirigera ces statuts ici. Pour l'instant la page est
// accessible directement par URL ; elle est bénigne pour les autres états
// (le bouton Customer Portal fonctionne toujours).

import { ReactivateActions } from './reactivate-actions'

export const metadata = {
  title: 'Réactiver votre abonnement | PharmaWorkspace',
}

export default function ReactivatePage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-3xl font-semibold text-slate-900">Réactivez votre abonnement</h1>
      <p className="mt-3 text-slate-600">
        Votre abonnement a été annulé ou suspendu. Mettez à jour votre IBAN ou réactivez votre
        formule directement depuis l&apos;espace de facturation Stripe.
      </p>
      <ReactivateActions />
    </main>
  )
}
