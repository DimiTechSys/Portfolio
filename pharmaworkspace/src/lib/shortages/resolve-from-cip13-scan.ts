import { createClient } from '@/lib/supabase/client'
import { getDrugShortageByCip13 } from '@/lib/queries/drug-shortages'
import {
  findOpenShortageForDrugShortage,
  shortageMatchesScannedDrugShortage,
} from '@/lib/shortages/match-shortage'
import {
  normalizeCip13Code,
  scannedCipMatchesDrugShortage,
} from '@/lib/shortages/cip13'
import type { DrugShortage, Shortage } from '@/types/index'

export type ResolveFromCip13ScanSuccess = {
  ok: true
  shortage: Shortage
  entry: DrugShortage
  code: string
}

export type ResolveFromCip13ScanFailure = {
  ok: false
  message: string
}

export type ResolveFromCip13ScanResult =
  | ResolveFromCip13ScanSuccess
  | ResolveFromCip13ScanFailure

/**
 * Trouve la rupture d’officine ouverte à lever pour un CIP13 scanné.
 * Priorité : ruptures déjà liées à une entrée ANSM (drug_shortage_id).
 */
export async function resolveOpenShortageFromCip13Scan(
  activeShortages: Shortage[],
  rawCode: string
): Promise<ResolveFromCip13ScanResult> {
  const code = normalizeCip13Code(rawCode)
  if (code.length !== 13) {
    return { ok: false, message: 'Code CIP13 invalide (13 chiffres requis).' }
  }

  const open = activeShortages.filter((s) => s.status !== 'resolved')
  const linkedIds = [
    ...new Set(
      open
        .map((s) => s.drug_shortage_id)
        .filter((id): id is string => Boolean(id))
    ),
  ]

  if (linkedIds.length > 0) {
    const supabase = createClient()
    const { data: entries, error } = await supabase
      .from('drug_shortages')
      .select('*')
      .in('id', linkedIds)

    if (error) {
      return { ok: false, message: error.message }
    }

    for (const shortage of open) {
      if (!shortage.drug_shortage_id) continue
      const entry = (entries ?? []).find(
        (row) => row.id === shortage.drug_shortage_id
      ) as DrugShortage | undefined
      if (entry && scannedCipMatchesDrugShortage(code, entry)) {
        return { ok: true, shortage, entry, code }
      }
    }
  }

  const entryResult = await getDrugShortageByCip13(code)
  if (entryResult.error) {
    return { ok: false, message: entryResult.error }
  }

  if (entryResult.data) {
    const matched = findOpenShortageForDrugShortage(open, entryResult.data)
    if (matched) {
      const shortage = open.find((s) => s.id === matched.id)
      if (shortage) {
        return { ok: true, shortage, entry: entryResult.data, code }
      }
    }
  }

  return {
    ok: false,
    message:
      'Aucune rupture ouverte ne correspond à ce scan. Signalez d’abord le médicament dans la liste ANSM.',
  }
}

/** Vérifie le scan pour une rupture déjà sélectionnée (dialog « Lever »). */
export async function validateCip13ScanForShortage(
  shortage: Pick<Shortage, 'drug_shortage_id' | 'product_name'>,
  rawCode: string
): Promise<
  | { ok: true; entry: DrugShortage; code: string }
  | { ok: false; message: string }
> {
  const code = normalizeCip13Code(rawCode)
  if (code.length !== 13) {
    return { ok: false, message: 'Code CIP13 invalide (13 chiffres requis).' }
  }

  if (shortage.drug_shortage_id) {
    const supabase = createClient()
    const { data: linked, error } = await supabase
      .from('drug_shortages')
      .select('*')
      .eq('id', shortage.drug_shortage_id)
      .maybeSingle()

    if (error) return { ok: false, message: error.message }
    if (linked && scannedCipMatchesDrugShortage(code, linked as DrugShortage)) {
      return { ok: true, entry: linked as DrugShortage, code }
    }
    return {
      ok: false,
      message: 'Ce code ne correspond pas au médicament signalé (CIS / CIP13).',
    }
  }

  const entryResult = await getDrugShortageByCip13(code)
  if (entryResult.error) return { ok: false, message: entryResult.error }
  if (!entryResult.data) {
    return { ok: false, message: 'Code CIP13 non reconnu dans le référentiel ANSM.' }
  }

  if (!shortageMatchesScannedDrugShortage(shortage, entryResult.data)) {
    return {
      ok: false,
      message: 'Ce code CIP13 ne correspond pas au médicament de la rupture sélectionnée.',
    }
  }

  return { ok: true, entry: entryResult.data, code }
}
