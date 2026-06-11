import {
  type ItemCategory,
  type SaleItem,
  type Store,
  type StoreChain,
  storesWithinRadius,
  zipToLatLng,
} from '@grocery-savings/utils/matching'

import { type Tables } from '../types/database'

import { type SaleDataProvider } from './sale-data-provider'

type StoreRow = Tables<'stores'>
// sale_items rows joined with the parent store name for display denormalization.
type SaleItemRowWithStore = Tables<'sale_items'> & {
  stores: { name: string } | { name: string }[] | null
}

/**
 * Map a `stores` row into the matching contract `Store` shape. Numeric columns
 * are coerced with Number() because the Supabase driver may return numeric
 * columns as strings.
 */
function mapStore(row: StoreRow): Store {
  return {
    id: row.id,
    chain: row.chain as StoreChain,
    name: row.name,
    address: row.address,
    city: row.city,
    state: row.state,
    zip: row.zip,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
  }
}

/**
 * Extract the joined store name. Supabase returns an embedded one-to-one
 * relation as either an object or a single-element array depending on the
 * inferred relationship; handle both.
 */
function storeName(row: SaleItemRowWithStore): string {
  const joined = row.stores
  if (!joined) return ''
  if (Array.isArray(joined)) return joined[0]?.name ?? ''
  return joined.name
}

/**
 * Map a `sale_items` row (joined with its store) into the contract `SaleItem`.
 * `discount_percent` is a generated stored column but typed nullable; fall back
 * to computing it from prices when absent.
 */
function mapSaleItem(row: SaleItemRowWithStore): SaleItem {
  const regularPrice = Number(row.regular_price)
  const salePrice = Number(row.sale_price)
  const discountPercent =
    row.discount_percent != null
      ? Number(row.discount_percent)
      : regularPrice > 0
        ? ((regularPrice - salePrice) / regularPrice) * 100
        : 0

  return {
    id: row.id,
    storeId: row.store_id,
    storeName: storeName(row),
    name: row.name,
    category: row.category as ItemCategory,
    ingredientKey: row.ingredient_key,
    regularPrice,
    salePrice,
    unit: row.unit,
    servingsPerUnit: Number(row.servings_per_unit),
    dietaryFlags: row.dietary_flags,
    discountPercent,
  }
}

/**
 * DB-backed SaleDataProvider for the MVP. Reads the seeded reference tables
 * (`stores`, `sale_items`) through the anon client; RLS exposes them
 * read-only to everyone (see ADR-0002).
 */
export const seedSaleDataProvider: SaleDataProvider = {
  async getStores(client, { zip, radiusMiles }) {
    const origin = zipToLatLng(zip)
    // Unknown zip → no centroid to measure against → empty result.
    if (!origin) return []

    const { data, error } = await client.from('stores').select('*')
    if (error) throw error

    const stores = (data ?? []).map(mapStore)
    return storesWithinRadius(stores, origin, radiusMiles)
  },

  async getSaleItems(client, { storeIds }) {
    if (storeIds.length === 0) return []

    const { data, error } = await client
      .from('sale_items')
      .select('*, stores(name)')
      .in('store_id', storeIds)

    if (error) throw error

    return (data ?? []).map((row) =>
      mapSaleItem(row as unknown as SaleItemRowWithStore)
    )
  },
}
