/** OSRM public demo — lat/lng in WGS84, [lat, lon] order internally. */

export type LatLngTuple = [number, number];

const OSRM_TIMEOUT_MS = 12_000;

export async function fetchOsrmRouteMetrics(
  origin: LatLngTuple,
  destination: LatLngTuple
): Promise<{ distanceM: number; durationS: number } | null> {
  const [lat1, lon1] = origin;
  const [lat2, lon2] = destination;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OSRM_TIMEOUT_MS);
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;
    const res = await fetch(url, { cache: 'no-store', signal: controller.signal });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      code?: string;
      routes?: { distance?: number; duration?: number }[];
    };
    if (data.code && data.code !== 'Ok') return null;
    const route = data?.routes?.[0];
    if (!route || typeof route.distance !== 'number') return null;
    return { distanceM: route.distance, durationS: typeof route.duration === 'number' ? route.duration : 0 };
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
