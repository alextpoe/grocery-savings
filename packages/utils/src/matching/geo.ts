import type { Store } from './types'

/**
 * Geographic helpers for the matching engine. Pure and dependency-free.
 *
 * Distances use the haversine great-circle formula in statute miles. ZIP
 * centroids are approximate real lat/lng for the Cincinnati, OH zips the MVP
 * seeds; an unknown zip resolves to null so callers can surface 'unknown_zip'.
 */

const EARTH_RADIUS_MILES = 3958.7613

export interface LatLng {
  lat: number
  lng: number
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * Great-circle distance between two points in statute miles.
 */
export function haversineMiles(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.lat - a.lat)
  const dLng = toRadians(b.lng - a.lng)
  const lat1 = toRadians(a.lat)
  const lat2 = toRadians(b.lat)

  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const h =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))

  return EARTH_RADIUS_MILES * c
}

/**
 * Stores whose great-circle distance from `origin` is within `radiusMiles`
 * (inclusive). Input is not mutated.
 */
export function storesWithinRadius(
  stores: Store[],
  origin: LatLng,
  radiusMiles: number
): Store[] {
  return stores.filter(
    (store) =>
      haversineMiles(origin, { lat: store.latitude, lng: store.longitude }) <=
      radiusMiles
  )
}

/**
 * Approximate centroids for the Cincinnati-area zips the MVP seeds.
 */
export const ZIP_CENTROIDS: Record<string, LatLng> = {
  '45202': { lat: 39.1085, lng: -84.5097 }, // Downtown
  '45208': { lat: 39.1366, lng: -84.4338 }, // Hyde Park
  '45209': { lat: 39.1545, lng: -84.4253 }, // Oakley
  '45219': { lat: 39.1208, lng: -84.5165 }, // Corryville / Clifton Heights
  '45220': { lat: 39.1432, lng: -84.5226 }, // Clifton
  '45226': { lat: 39.1175, lng: -84.4279 }, // Linwood / Mt. Lookout
  '45227': { lat: 39.1607, lng: -84.3873 }, // Madisonville
  '45236': { lat: 39.2058, lng: -84.3879 }, // Kenwood
  '45242': { lat: 39.2536, lng: -84.3705 }, // Blue Ash
}

/**
 * Resolve a 5-digit zip to its approximate centroid, or null if unknown.
 */
export function zipToLatLng(zip: string): LatLng | null {
  return ZIP_CENTROIDS[zip] ?? null
}
