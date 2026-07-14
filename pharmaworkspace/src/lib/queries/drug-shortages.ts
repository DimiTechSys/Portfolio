import { createClient } from '@/lib/supabase/client'
import {
  cip13ToCisCandidates,
  normalizeCip13Code,
  scannedCipMatchesDrugShortage,
} from '@/lib/shortages/cip13'
import type { DrugShortage, QueryResult } from '@/types/index'

/** Date du jour (UTC) pour comparer la colonne `ends_at` de type `date`. */
function todayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Ruptures ANSM encore « en cours » : pas de date de fin, ou fin >= aujourd’hui.
 * (évite d’exclure les lignes avec ends_at NULL ou une comparaison timestamp/date incorrecte)
 */
function applyActiveDrugShortageFilter<T extends { or: (filters: string) => T }>(
  query: T
): T {
  const today = todayDateString()
  return query.or(`ends_at.is.null,ends_at.gte.${today}`)
}

export async function checkDrugShortageByName(
  name: string
): Promise<QueryResult<DrugShortage | null>> {
  const trimmed = name.trim()
  if (!trimmed) return { data: null, error: null }

  const supabase = createClient()
  const { data, error } = await applyActiveDrugShortageFilter(
    supabase.from('drug_shortages').select('*')
  )
    .ilike('medication_name', `%${trimmed}%`)
    .order('started_at', { ascending: false })
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  return { data: (data as DrugShortage | null) ?? null, error: null }
}

export async function getActiveDrugShortages(): Promise<QueryResult<DrugShortage[]>> {
  const supabase = createClient()
  const { data, error } = await applyActiveDrugShortageFilter(
    supabase.from('drug_shortages').select('*')
  ).order('started_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data: (data as DrugShortage[]) ?? [], error: null }
}

function drugShortageNameSearchFilter(trimmed: string): string {
  const pattern = `%${trimmed.replace(/,/g, '')}%`
  return `medication_name.ilike.${pattern},cis.ilike.${pattern}`
}

export async function listDrugShortagesForPicker(
  limit = 80
): Promise<QueryResult<DrugShortage[]>> {
  const supabase = createClient()

  const active = await applyActiveDrugShortageFilter(
    supabase.from('drug_shortages').select('*')
  )
    .order('medication_name', { ascending: true })
    .limit(limit)

  if (active.error) return { data: null, error: active.error.message }
  if ((active.data?.length ?? 0) > 0) {
    return { data: active.data as DrugShortage[], error: null }
  }

  const { data, error } = await supabase
    .from('drug_shortages')
    .select('*')
    .order('medication_name', { ascending: true })
    .limit(limit)

  if (error) return { data: null, error: error.message }
  return { data: (data as DrugShortage[]) ?? [], error: null }
}

export async function searchDrugShortages(
  query: string,
  limit = 30
): Promise<QueryResult<DrugShortage[]>> {
  const trimmed = query.trim()
  const supabase = createClient()

  const runSearch = (useActiveOnly: boolean) => {
    let request = supabase.from('drug_shortages').select('*')
    if (useActiveOnly) {
      request = applyActiveDrugShortageFilter(request)
    }
    request = request.order('medication_name', { ascending: true })
    if (trimmed.length >= 2) {
      request = request.or(drugShortageNameSearchFilter(trimmed))
    }
    return request.limit(limit)
  }

  const active = await runSearch(true)
  if (active.error) return { data: null, error: active.error.message }
  if ((active.data?.length ?? 0) > 0) {
    return { data: active.data as DrugShortage[], error: null }
  }

  if (trimmed.length >= 2) {
    const all = await runSearch(false)
    if (all.error) return { data: null, error: all.error.message }
    return { data: (all.data as DrugShortage[]) ?? [], error: null }
  }

  return { data: [], error: null }
}

export async function getDrugShortageById(
  id: string
): Promise<QueryResult<DrugShortage | null>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('drug_shortages')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  return { data: (data as DrugShortage | null) ?? null, error: null }
}

export async function getDrugShortageByCip13(
  cip13: string
): Promise<QueryResult<DrugShortage | null>> {
  const code = normalizeCip13Code(cip13)
  if (code.length !== 13) {
    return { data: null, error: 'Code CIP13 invalide (13 chiffres requis).' }
  }

  const supabase = createClient()

  const { data: byCip, error: cipError } = await supabase
    .from('drug_shortages')
    .select('*')
    .eq('cip13', code)
    .maybeSingle()

  if (cipError) return { data: null, error: cipError.message }
  if (byCip) return { data: byCip as DrugShortage, error: null }

  const cisCandidates = cip13ToCisCandidates(code)
  for (const cis of cisCandidates) {
    const { data, error } = await supabase
      .from('drug_shortages')
      .select('*')
      .eq('cis', cis)
      .maybeSingle()

    if (error) return { data: null, error: error.message }
    if (data) return { data: data as DrugShortage, error: null }
  }

  const { data: allRows, error: listError } = await supabase
    .from('drug_shortages')
    .select('*')
    .limit(500)

  if (listError) return { data: null, error: listError.message }

  const match = (allRows ?? []).find((row) =>
    scannedCipMatchesDrugShortage(code, row as DrugShortage)
  )
  return { data: (match as DrugShortage | undefined) ?? null, error: null }
}
