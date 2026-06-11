import { type SaleItem, type Store } from '@grocery-savings/utils/matching'
import { type SupabaseClient } from '@supabase/supabase-js'

import { type Database } from '../types/database'

type Client = SupabaseClient<Database>

/**
 * Adapter interface for sourcing store + sale data.
 *
 * The matching engine and UI depend only on this interface (returning the
 * locked `@grocery-savings/utils/matching` contract shapes), so swapping the
 * MVP `seed` provider for a live retailer API (Kroger, etc.) touches one file.
 *
 * Implementations transform their source rows into the contract types at this
 * boundary (snake_case → camelCase, numeric coercion) per CLAUDE.md.
 */
export interface SaleDataProvider {
  /**
   * Stores within `radiusMiles` of `zip`. An unknown zip resolves to an empty
   * list (callers surface 'unknown_zip' / 'no_stores' downstream).
   */
  getStores(
    client: Client,
    params: { zip: string; radiusMiles: number }
  ): Promise<Store[]>

  /**
   * Active sale items for the given store ids, with `storeName` denormalized
   * for display. An empty `storeIds` yields an empty list.
   */
  getSaleItems(
    client: Client,
    params: { storeIds: string[] }
  ): Promise<SaleItem[]>
}
