// Client Resend : usage SERVEUR UNIQUEMENT.
//
// Ne JAMAIS importer depuis un Client Component. `RESEND_API_KEY` est non
// `NEXT_PUBLIC_` exprès. Tous les envois passent par les helpers
// `src/lib/email/send-*.ts` qui consomment ce client.
//
// Init paresseuse (même pattern que `src/lib/stripe/server.ts`) : si la clé
// n'est pas configurée, on retourne null et l'appelant gère l'absence en
// retournant 503 / en loguant. Pas de crash au boot.

import { Resend } from 'resend'

let cached: Resend | null | undefined

export function getResend(): Resend | null {
  if (cached !== undefined) return cached

  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn('[email/client] RESEND_API_KEY missing: email sending disabled')
    cached = null
    return null
  }

  cached = new Resend(key)
  return cached
}

// Adresse "From" par défaut. Surchargeable via `RESEND_FROM_EMAIL` si besoin
// (utile pour des sous-domaines de test type `staging-noreply@…`).
export function getFromAddress(): string {
  return (
    process.env.RESEND_FROM_EMAIL ??
    'PharmaWorkspace <noreply@pharmaworkspace.fr>'
  )
}

// Reply-To pour les emails transactionnels. Quand le destinataire clique "Répondre"
// dans Gmail, ça atterrit ici plutôt que sur le noreply.
export function getReplyToAddress(): string {
  return process.env.RESEND_REPLY_TO ?? 'support@pharmaworkspace.fr'
}
