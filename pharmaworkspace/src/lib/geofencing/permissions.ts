/**
 * Wrapper autour de navigator.geolocation.getCurrentPosition, retourné sous
 * forme de résultat discriminé plutôt qu'une promesse rejetée, pour traiter
 * le refus de permission comme un état UI normal, pas une erreur.
 */
export type PositionResult =
  | { ok: true; lat: number; lng: number; accuracy: number }
  | { ok: false; reason: 'denied' | 'unavailable' | 'timeout' | 'unsupported' }

export async function requestUserPosition(): Promise<PositionResult> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return { ok: false, reason: 'unsupported' }
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          ok: true,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) resolve({ ok: false, reason: 'denied' })
        else if (err.code === err.POSITION_UNAVAILABLE)
          resolve({ ok: false, reason: 'unavailable' })
        else resolve({ ok: false, reason: 'timeout' })
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 }
    )
  })
}
