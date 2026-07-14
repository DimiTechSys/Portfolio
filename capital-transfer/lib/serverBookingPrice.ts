import {
  PRICE_TABLE,
  customRouteBaseEurFromDistanceKm,
  priceFromRouteBaseAndVehicle,
  applyOnDaySurcharge,
  estimateRoadDistanceKmForCustomRoute,
} from '@/lib/bookingPricing';
import { fetchOsrmRouteMetrics } from '@/lib/osrmRoute';

export type BookingPricePayload = {
  route: string;
  vehicleId?: string;
  originCoords?: [number, number] | null;
  destinationCoords?: [number, number] | null;
};

export async function computeBookingPriceEur(
  data: BookingPricePayload,
  options: { onDay: boolean }
): Promise<
  | { ok: true; price: number; baseRouteEur: number; distanceKm?: number }
  | { ok: false; error: string }
> {
  const vehicleId = data.vehicleId || 'sedan';
  let baseRoute: number | null = null;
  let distanceKm: number | undefined;

  if (data.route && data.route !== 'Custom Route' && PRICE_TABLE[data.route]) {
    baseRoute = PRICE_TABLE[data.route];
  } else if (data.route === 'Custom Route') {
    const o = data.originCoords;
    const d = data.destinationCoords;
    if (!o || !d || o.length !== 2 || d.length !== 2) {
      return { ok: false, error: 'Missing coordinates for custom route' };
    }
    const metrics = await fetchOsrmRouteMetrics(o, d);
    if (metrics) {
      distanceKm = metrics.distanceM / 1000;
    } else {
      const est = estimateRoadDistanceKmForCustomRoute(o, d);
      if (est === null) {
        return { ok: false, error: 'Could not compute driving route' };
      }
      distanceKm = est;
      console.warn(
        '[pricing] OSRM indisponible ou sans itinéraire — estimation distance (haversine) km ≈',
        Math.round(distanceKm * 10) / 10
      );
    }
    baseRoute = customRouteBaseEurFromDistanceKm(distanceKm);
  }

  if (baseRoute === null) {
    return { ok: false, error: 'Invalid route' };
  }

  const price = priceFromRouteBaseAndVehicle(baseRoute, vehicleId);
  const final = options.onDay ? applyOnDaySurcharge(price) : price;
  const roundedDistance =
    distanceKm !== undefined ? Math.round(distanceKm * 10) / 10 : undefined;

  return roundedDistance !== undefined
    ? { ok: true, price: final, baseRouteEur: baseRoute, distanceKm: roundedDistance }
    : { ok: true, price: final, baseRouteEur: baseRoute };
}
