export { type SaleDataProvider } from './sale-data-provider'
export { seedSaleDataProvider } from './seed-provider'
export { krogerSaleDataProvider } from './kroger-provider'

import { krogerSaleDataProvider } from './kroger-provider'
import { type SaleDataProvider } from './sale-data-provider'
import { seedSaleDataProvider } from './seed-provider'

export type SaleDataProviderName = 'seed' | 'kroger'

/**
 * Resolve a SaleDataProvider by name, defaulting to the DB-backed seed
 * provider the MVP ships with.
 */
export function getSaleDataProvider(
  name: SaleDataProviderName = 'seed'
): SaleDataProvider {
  switch (name) {
    case 'kroger':
      return krogerSaleDataProvider
    case 'seed':
    default:
      return seedSaleDataProvider
  }
}
