/**
 * Kroger SaleDataProvider — documented stub. NOT implemented in the MVP.
 *
 * The MVP sources deals from the seeded reference tables via
 * `seedSaleDataProvider`. This file captures the intended shape of a future
 * live integration against the Kroger Public API so swapping providers later
 * is a one-file change behind the `SaleDataProvider` interface.
 *
 * Future implementation outline:
 *
 * 1. Auth — OAuth2 client-credentials flow.
 *    POST https://api.kroger.com/v1/connect/oauth2/token
 *      grant_type=client_credentials & scope=product.compact
 *      Authorization: Basic base64(CLIENT_ID:CLIENT_SECRET)
 *    Cache the bearer token until ~30s before `expires_in`; refresh on demand.
 *    Credentials come from server-side env (KROGER_CLIENT_ID /
 *    KROGER_CLIENT_SECRET, validated in each app's lib/env.ts) — never exposed to
 *    the client, since this provider would run server-side.
 *
 * 2. getStores({ zip, radiusMiles }) — locations lookup.
 *    GET /v1/locations?filter.zipCode.near={zip}&filter.radiusInMiles={radiusMiles}&filter.limit=...
 *    Map each location → contract Store:
 *      locationId → id, chain 'kroger', name, address.* → address/city/state/zip,
 *      geolocation.{latitude,longitude} → latitude/longitude (coerce with Number()).
 *
 * 3. getSaleItems({ storeIds }) — products with promo prices, per location.
 *    GET /v1/products?filter.locationId={id}&filter.term=...&filter.limit=...
 *    (Kroger scopes pricing to one locationId per call, so fan out over
 *    storeIds and flatten.) For each product item, read items[].price.regular
 *    and items[].price.promo; emit a SaleItem only when promo > 0 && promo <
 *    regular. Derive ingredientKey from a category/term mapping table, set
 *    unit + servingsPerUnit from item size metadata, dietaryFlags from product
 *    attributes, and compute discountPercent from regular/promo.
 *
 * 4. Rate limits — the public API caps requests (per-endpoint daily quotas and
 *    burst limits). A real implementation must add request throttling / caching
 *    (e.g. @upstash/ratelimit + a short-TTL cache on locations/products) and
 *    handle 429s with backoff. Token and product responses should be cached to
 *    stay within quota.
 *
 * All methods currently throw; wiring this up is tracked as future work.
 */
import { type SaleDataProvider } from './sale-data-provider'

const NOT_IMPLEMENTED =
  'KrogerSaleDataProvider is not implemented — MVP uses the seed provider'

export const krogerSaleDataProvider: SaleDataProvider = {
  async getStores() {
    throw new Error(NOT_IMPLEMENTED)
  },

  async getSaleItems() {
    throw new Error(NOT_IMPLEMENTED)
  },
}
