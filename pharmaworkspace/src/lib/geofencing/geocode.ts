/**
 * Géocodage d'une adresse → coordonnées, via Nominatim OpenStreetMap.
 * Gratuit, RGPD-friendly, sans tracking. User-Agent obligatoire (politique
 * d'usage Nominatim), max ~1 req/s, suffisant ici (appelé à la
 * création/modification d'une officine, pas en boucle).
 */
import { SUPPORT_EMAIL } from '@/config/constants'

export type GeocodeResult = { lat: number; lng: number }

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'

export async function geocodeAddress(
  address: string
): Promise<GeocodeResult | null> {
  const query = address.trim()
  if (!query) return null

  const url = `${NOMINATIM_URL}?format=json&q=${encodeURIComponent(query)}&countrycodes=fr&limit=1`

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': `PharmaWorkspace/1.0 (${SUPPORT_EMAIL})`,
      },
      cache: 'force-cache',
    })
    if (!res.ok) return null

    const data: unknown = await res.json()
    if (!Array.isArray(data) || data.length === 0) return null

    const first = data[0] as { lat?: string; lon?: string }
    const lat = Number.parseFloat(first.lat ?? '')
    const lng = Number.parseFloat(first.lon ?? '')
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null

    return { lat, lng }
  } catch {
    return null
  }
}
