import { describe, expect, it } from 'vitest'

import {
  ZIP_CENTROIDS,
  haversineMiles,
  storesWithinRadius,
  zipToLatLng,
} from '../geo'
import type { Store } from '../types'

function makeStore(
  id: string,
  latitude: number,
  longitude: number
): Store {
  return {
    id,
    chain: 'kroger',
    name: `Store ${id}`,
    address: '123 Main St',
    city: 'Cincinnati',
    state: 'OH',
    zip: '45208',
    latitude,
    longitude,
  }
}

describe('haversineMiles', () => {
  it('returns 0 for identical points', () => {
    const p = { lat: 39.1, lng: -84.5 }
    expect(haversineMiles(p, p)).toBe(0)
  })

  it('matches a known distance within 5% (Cincinnati → Columbus ≈ 100 mi)', () => {
    const cincinnati = { lat: 39.1031, lng: -84.512 }
    const columbus = { lat: 39.9612, lng: -82.9988 }
    const expected = 100 // statute miles, approximate
    const actual = haversineMiles(cincinnati, columbus)
    expect(Math.abs(actual - expected) / expected).toBeLessThan(0.05)
  })

  it('matches a known short distance within 5% (Hyde Park → Oakley ≈ 1.4 mi)', () => {
    const hydePark = ZIP_CENTROIDS['45208']!
    const oakley = ZIP_CENTROIDS['45209']!
    const expected = 1.4
    const actual = haversineMiles(hydePark, oakley)
    expect(Math.abs(actual - expected) / expected).toBeLessThan(0.2)
  })

  it('is symmetric', () => {
    const a = { lat: 39.1, lng: -84.5 }
    const b = { lat: 39.2, lng: -84.4 }
    expect(haversineMiles(a, b)).toBeCloseTo(haversineMiles(b, a), 10)
  })
})

describe('storesWithinRadius', () => {
  const origin = { lat: 39.1031, lng: -84.512 } // downtown Cincinnati
  const near = makeStore('near', 39.11, -84.51) // ~0.5 mi
  const far = makeStore('far', 39.9612, -82.9988) // ~100 mi (Columbus)

  it('includes stores inside the radius', () => {
    const result = storesWithinRadius([near, far], origin, 10)
    expect(result.map((s) => s.id)).toEqual(['near'])
  })

  it('excludes stores outside the radius', () => {
    const result = storesWithinRadius([near, far], origin, 10)
    expect(result.find((s) => s.id === 'far')).toBeUndefined()
  })

  it('includes both when the radius is large enough', () => {
    const result = storesWithinRadius([near, far], origin, 150)
    expect(result).toHaveLength(2)
  })

  it('does not mutate the input array', () => {
    const stores = [near, far]
    storesWithinRadius(stores, origin, 10)
    expect(stores).toHaveLength(2)
  })
})

describe('zipToLatLng', () => {
  it('resolves a known Cincinnati zip', () => {
    expect(zipToLatLng('45208')).toEqual(ZIP_CENTROIDS['45208'])
  })

  it('returns null for an unknown zip', () => {
    expect(zipToLatLng('90210')).toBeNull()
    expect(zipToLatLng('00000')).toBeNull()
  })
})
