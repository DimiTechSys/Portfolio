import { NextResponse } from 'next/server'
import { z } from 'zod'
import { normalizeMedicationItem } from '@/lib/ocr/normalize-medication-item'
import { addThreeMonthsIsoDate, parseOcrIsoDate } from '@/lib/ocr/parse-ocr-dates'
import { getPostHogClient } from '@/lib/posthog-server'
import { createClient } from '@/lib/supabase/server'
import { ocrRateLimit } from '@/lib/rate-limit/upstash'

export const runtime = 'nodejs'
export const maxDuration = 60

// Limite serveur explicite : refuser avant arrayBuffer() pour ne pas charger en
// mémoire un fichier abusif (DoS). Le client compresse déjà sous ce seuil.
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
])

// Garde-fou sur la sortie LLM : on borne tout ce qui finira en DB / affiché.
// Le modèle est non-déterministe et peut renvoyer des champs hors-norme.
const OcrItemSchema = z.object({
  medication_name: z.string().trim().min(1).max(200),
  dosage: z.string().trim().max(100).nullish(),
  quantity: z.coerce.number().finite().optional(),
})

const OcrLlmSchema = z.object({
  patient_name: z.string().trim().max(200).nullish(),
  prescriber_name: z.string().trim().max(200).nullish(),
  prescribed_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
  items: z.array(z.unknown()).max(100).optional(),
})

type OcrProvider = 'ollama' | 'claude' | 'mistral'

type OcrResult = {
  success: boolean
  patient_name: string | null
  prescriber_name: string | null
  prescribed_date: string | null
  expiry_date: string | null
  items: {
    medication_name: string
    dosage: string | null
    quantity: number
  }[]
  raw?: string
  error?: string
}

const OCR_PROMPT = `Analyse cette image d'ordonnance médicale française. Extrais :
- patient_name : nom complet du patient (null si absent)
- prescriber_name : nom du médecin prescripteur (souvent en tête, format "Dr Nom Prénom" ou similaire, null si absent)
- prescribed_date : date d'émission au format YYYY-MM-DD (null si absent)
- expiry_date : date d'expiration si visible, sinon null (durée légale standard : 3 mois après prescribed_date)
- items : liste des médicaments [{medication_name, dosage, quantity}] (quantity entier, 1 par défaut)

Réponds uniquement en JSON :
{"patient_name":"...","prescriber_name":"...","prescribed_date":"YYYY-MM-DD ou null","expiry_date":"YYYY-MM-DD ou null","items":[{"medication_name":"...","dosage":"...","quantity":1}]}

Si aucun médicament visible : "items":[]`

function emptyOcr(error: string): OcrResult {
  return {
    success: false,
    patient_name: null,
    prescriber_name: null,
    prescribed_date: null,
    expiry_date: null,
    items: [],
    error,
  }
}

function notConfigured(): OcrResult {
  return emptyOcr('provider_not_configured')
}

function parsePatientName(parsed: { patient_name?: unknown }): string | null {
  const v = parsed.patient_name
  if (v == null || v === 'null') return null
  const s = String(v).trim()
  return s === '' ? null : s
}

function parsePrescriberName(parsed: { prescriber_name?: unknown }): string | null {
  const v = parsed.prescriber_name
  if (v == null || v === 'null') return null
  const s = String(v).trim()
  return s === '' ? null : s
}

function normalizeResult(parsed: unknown, raw?: string): OcrResult {
  // Valide la forme globale du JSON LLM avant tout usage : on borne les chaînes
  // libres (.max) et on impose le format date côté schéma. Échec → extraction ratée.
  const validated = OcrLlmSchema.safeParse(parsed)
  if (!validated.success) {
    return { ...emptyOcr('extraction_failed'), raw }
  }
  const data = validated.data

  const patient_name = parsePatientName({ patient_name: data.patient_name })
  const prescriber_name = parsePrescriberName({ prescriber_name: data.prescriber_name })
  const prescribed_date = parseOcrIsoDate(data.prescribed_date)
  let expiry_date = parseOcrIsoDate(data.expiry_date)
  if (prescribed_date && !expiry_date) {
    expiry_date = addThreeMonthsIsoDate(prescribed_date)
  }

  const parsedItems = data.items ?? []
  const cleanedItems = parsedItems
    // Chaque item repasse par le schéma : un item hors-bornes (nom > 200, vide…)
    // est rejeté plutôt qu'inséré tel quel.
    .flatMap((item) => {
      const r = OcrItemSchema.safeParse(item)
      if (!r.success) return []
      return [
        {
          medication_name: r.data.medication_name,
          dosage: r.data.dosage == null ? null : r.data.dosage,
          quantity:
            typeof r.data.quantity === 'number' && Number.isFinite(r.data.quantity)
              ? Math.max(1, Math.floor(r.data.quantity))
              : 1,
        },
      ]
    })
    .map((item) => normalizeMedicationItem(item))

  const hasPatient = patient_name != null
  const hasItems = cleanedItems.length > 0
  if (!hasPatient && !hasItems) {
    return { ...emptyOcr('extraction_failed'), raw }
  }

  return {
    success: true,
    patient_name,
    prescriber_name,
    prescribed_date,
    expiry_date,
    items: cleanedItems,
    raw,
  }
}

function extractJsonBlock(raw: string): string {
  const trimmed = raw.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]) return fenced[1].trim()
  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1)
  }
  return trimmed
}

async function runOllama(base64: string): Promise<OcrResult> {
  const ollamaUrl = process.env.OLLAMA_URL ?? 'http://localhost:11434'
  const model = process.env.OLLAMA_MODEL ?? 'llava'

  const callOllama = async (imageBase64: string, prompt: string): Promise<OcrResult> => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 55_000)

    let response: Response
    try {
      response = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          images: [imageBase64],
          stream: false,
          format: 'json',
        }),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeoutId)
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[OCR][Ollama] HTTP error', { status: response.status })
      return { ...emptyOcr('extraction_failed'), raw: errorText }
    }

    const ollamaResponse = (await response.json()) as { response?: string; done?: boolean }
    const raw = ollamaResponse.response ?? ''
    const candidate = extractJsonBlock(raw)

    try {
      const parsed = JSON.parse(candidate)
      return normalizeResult(parsed, raw)
    } catch {
      return { ...emptyOcr('extraction_failed'), raw }
    }
  }

  let attempts = 0
  let lastResult: OcrResult = emptyOcr('extraction_failed')
  let patientNameFromAny: string | null = null
  while (attempts < 3 && lastResult.items.length === 0) {
    lastResult = await callOllama(base64, OCR_PROMPT)
    if (lastResult.patient_name) patientNameFromAny = lastResult.patient_name
    attempts += 1
  }

  if (!lastResult.patient_name && patientNameFromAny) {
    lastResult = { ...lastResult, patient_name: patientNameFromAny }
  }

  return lastResult
}

async function runClaude(): Promise<OcrResult> {
  return notConfigured()
}

async function callMistral(base64: string, mimeType: string): Promise<OcrResult> {
  if (!process.env.MISTRAL_API_KEY) {
    return notConfigured()
  }

  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral-small-2506',
        max_tokens: 1200,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: `data:${mimeType};base64,${base64}` },
              { type: 'text', text: OCR_PROMPT },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      console.error('[OCR][Mistral] HTTP error', { status: response.status })
      return emptyOcr('extraction_failed')
    }

    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] }
    const content = data.choices?.[0]?.message?.content ?? ''
    const candidate = extractJsonBlock(content)
    if (!candidate) {
      return emptyOcr('extraction_failed')
    }

    try {
      const parsed = JSON.parse(candidate)
      return normalizeResult(parsed, content)
    } catch {
      return emptyOcr('extraction_failed')
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error'
    console.error('[OCR][Mistral] error', { message })
    return emptyOcr('extraction_failed')
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        emptyOcr('unauthorized') satisfies OcrResult,
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('pharmacy_id')
      .eq('id', user.id)
      .maybeSingle()
    if (!profile?.pharmacy_id) {
      return NextResponse.json(
        emptyOcr('no_pharmacy') satisfies OcrResult,
        { status: 403 }
      )
    }

    const { success } = await ocrRateLimit.limit(profile.pharmacy_id)
    if (!success) {
      return NextResponse.json(
        emptyOcr('rate_limited') satisfies OcrResult,
        { status: 429 }
      )
    }

    const formData = await request.formData()
    const image = formData.get('image')

    if (!(image instanceof File)) {
      return NextResponse.json(
        emptyOcr('invalid_file') satisfies OcrResult,
        { status: 400 }
      )
    }

    const provider = (process.env.OCR_PROVIDER ?? 'ollama') as OcrProvider
    const mimeType = image.type || 'image/jpeg'

    // Allowlist MIME stricte côté serveur (le type déclaré client n'est pas de confiance).
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        emptyOcr('unsupported_media_type') satisfies OcrResult,
        { status: 415 }
      )
    }

    // Limite de taille AVANT arrayBuffer() : ne pas matérialiser un buffer abusif.
    if (image.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        emptyOcr('file_too_large') satisfies OcrResult,
        { status: 413 }
      )
    }

    // PDF : les modèles vision attendent une image (JPEG/PNG). Le client convertit la 1re page avant envoi.
    if (mimeType === 'application/pdf') {
      return NextResponse.json(
        emptyOcr('pdf_requires_client_conversion') satisfies OcrResult,
        { status: 200 }
      )
    }

    const buffer = await image.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')

    let result: OcrResult
    if (provider === 'mistral') {
      result = await callMistral(base64, mimeType)
    } else if (provider === 'ollama') {
      result = await runOllama(base64)
    } else if (provider === 'claude') {
      result = await runClaude()
    } else {
      result = notConfigured()
    }

    if (result.success) {
      const distinctId = request.headers.get('x-posthog-distinct-id') ?? 'anonymous'
      const posthog = getPostHogClient()
      posthog.capture({
        distinctId,
        event: 'prescription_ocr_completed',
        properties: {
          provider,
          item_count: result.items.length,
          has_patient_name: result.patient_name !== null,
        },
      })
    }

    const { raw: _raw, ...publicResult } = result
    return NextResponse.json(publicResult, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error'
    console.error('[OCR] ocr_internal_error', { message })
    return NextResponse.json(
      emptyOcr('ocr_internal_error') satisfies OcrResult,
      { status: 500 }
    )
  }
}
