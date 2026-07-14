/**
 * Distance Haversine entre deux points (lat/lng en degrés) en mètres.
 * Doit rester strictement aligné avec la fonction SQL public.geofence_distance_m
 * (migration 0052) pour que le check client et le trigger serveur concordent.
 */
export function haversineDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000 // rayon moyen de la Terre en mètres
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}
