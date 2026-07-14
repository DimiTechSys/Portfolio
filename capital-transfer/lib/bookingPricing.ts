/** Shared booking pricing — keep in sync with client display logic and `serverBookingPrice`. */

import { haversineKm } from '@/lib/geoDistance';

/** When OSRM is unavailable, approximate road km from geodesic (same factor as server). */
export const HAVERSINE_TO_ROAD_KM_FACTOR = 1.28;

export const PRICE_TABLE: Record<string, number> = {
  'Paris centre → CDG T1/T2/T3': 75,
  'Paris centre → CDG T2G': 80,
  'Paris centre → Orly': 65,
  'Paris centre → Beauvais': 140,
  'Paris centre → Gare du Nord': 35,
  'Paris centre → Gare de Lyon': 35,
  'Paris centre → Gare Montparnasse': 35,
  'Paris centre → Gare Saint-Lazare': 30,
  'Paris centre → Versailles': 85,
  'CDG → Orly': 90,
  'CDG → Gare du Nord': 55,
  'CDG → Gare de Lyon': 70,
  'CDG → Versailles': 110,
  'Orly → Gare du Nord': 70,
  'Orly → Gare de Lyon': 55,
  'Orly → Versailles': 90,
  'Paris centre → Disneyland Paris': 95,
  'CDG → Disneyland Paris': 65,
  'Paris centre → Le Havre': 280,
  'Paris centre → Reims': 200,
};

export const VEHICLE_BASE_PRICES: Record<string, number> = {
  sedan: 35,
  business: 75,
  van: 110,
  luxury: 140,
  suv: 120,
  moto: 25,
};

export const CUSTOM_ROUTE_MIN_BASE_EUR = 45;

/** Base EUR for a custom route from driving distance (before vehicle tier). */
export function customRouteBaseEurFromDistanceKm(km: number): number {
  if (!Number.isFinite(km) || km <= 0) return CUSTOM_ROUTE_MIN_BASE_EUR;
  const baseSedan = 35;
  const perKm = 2.35;
  return Math.max(CUSTOM_ROUTE_MIN_BASE_EUR, Math.round(baseSedan + km * perKm));
}

/** Road distance (km) from pickup/dropoff coordinates when no routing engine is available. */
export function estimateRoadDistanceKmForCustomRoute(
  origin: [number, number],
  destination: [number, number]
): number | null {
  const bird = haversineKm(origin, destination);
  if (!Number.isFinite(bird) || bird < 0.05) return null;
  return bird * HAVERSINE_TO_ROAD_KM_FACTOR;
}

/**
 * Sedan-equivalent base price (EUR) for a custom route from coordinates only.
 * Used client-side as fallback when `/api/pricing/calculate` fails; must match server fallback logic.
 */
export function sedanRouteBaseEurFromCoords(
  origin: [number, number],
  destination: [number, number]
): { baseRouteEur: number; distanceKm: number } | null {
  const roadKm = estimateRoadDistanceKmForCustomRoute(origin, destination);
  if (roadKm === null) return null;
  const distanceKm = Math.round(roadKm * 10) / 10;
  const baseRouteEur = customRouteBaseEurFromDistanceKm(roadKm);
  return { baseRouteEur, distanceKm };
}

export function vehicleTierDeltaEur(vehicleId: string): number {
  const vehicleBase = VEHICLE_BASE_PRICES[vehicleId] || 35;
  return vehicleBase - 35;
}

export function priceFromRouteBaseAndVehicle(baseRouteEur: number, vehicleId: string): number {
  return Math.round(baseRouteEur + vehicleTierDeltaEur(vehicleId));
}

export function applyOnDaySurcharge(priceEur: number): number {
  return Math.round(priceEur * 1.1);
}
