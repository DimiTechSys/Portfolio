import { NextResponse } from 'next/server'

/**
 * Réponse d'erreur API qui ne fuite pas le détail Postgres au client.
 *
 * L9 : plusieurs routes renvoyaient `error.message` brut (code SQLSTATE, nom de
 * contrainte, colonne…) → fingerprinting du schéma. Ce helper centralise le
 * comportement déjà appliqué dans signup/stripe/legal : on logge le message brut
 * côté serveur (préfixé par le scope d'origine) et on renvoie au client un libellé
 * FR stable, sans aucun détail interne.
 *
 * @param scope   tag de log (ex. '[onboarding/create-pharmacy]')
 * @param raw     erreur/objet brut (PostgrestError, Error, string…) — loggé seulement
 * @param clientMessage  libellé FR rendu au client
 * @param status  code HTTP à conserver (identique à l'existant)
 */
export function apiError(
  scope: string,
  raw: unknown,
  clientMessage: string,
  status: number
): NextResponse {
  console.error(`${scope} ${clientMessage}`, {
    code: extractCode(raw),
    message: extractMessage(raw),
  })
  return NextResponse.json({ error: clientMessage }, { status })
}

function extractMessage(raw: unknown): string {
  if (typeof raw === 'string') return raw
  if (raw && typeof raw === 'object' && 'message' in raw) {
    const m = (raw as { message?: unknown }).message
    if (typeof m === 'string') return m
  }
  return 'unknown'
}

function extractCode(raw: unknown): string | undefined {
  if (raw && typeof raw === 'object' && 'code' in raw) {
    const c = (raw as { code?: unknown }).code
    if (typeof c === 'string') return c
  }
  return undefined
}
