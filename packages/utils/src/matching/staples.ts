/**
 * Default ("shelf") prices for ingredients that are NOT on sale.
 *
 * The matching engine fills a recipe slot from an on-sale item when one
 * qualifies; otherwise it falls back to these typical prices so a meal still
 * has a complete, honest cost estimate. Prices are per the ONE canonical unit
 * for that ingredient_key (see the UNIT CONTRACT in types.ts).
 *
 * `pantry: true` items (oil, salt, pepper, garlic) are assumed to be on hand:
 * they are surfaced to the user as "assumed staples" and are NEVER costed and
 * NEVER filled from a sale item.
 */
export interface StaplePrice {
  /** Typical shelf price per canonical unit. */
  typicalPrice: number
  /** Canonical unit for this ingredient_key. */
  unit: string
  /** Assumed-on-hand pantry staple: surfaced as assumed, never costed. */
  pantry: boolean
}

export const DEFAULT_STAPLE_PRICES: Record<string, StaplePrice> = {
  // Proteins
  chicken_breast: { typicalPrice: 3.99, unit: 'lb', pantry: false },
  ground_beef: { typicalPrice: 4.99, unit: 'lb', pantry: false },
  pork_chop: { typicalPrice: 3.49, unit: 'lb', pantry: false },
  tofu: { typicalPrice: 2.29, unit: 'lb', pantry: false },
  black_beans: { typicalPrice: 0.99, unit: 'can', pantry: false },
  eggs: { typicalPrice: 2.49, unit: 'dozen', pantry: false },

  // Starches
  rice: { typicalPrice: 1.5, unit: 'lb', pantry: false },
  pasta: { typicalPrice: 1.29, unit: 'lb', pantry: false },
  potato: { typicalPrice: 0.89, unit: 'lb', pantry: false },
  tortilla: { typicalPrice: 2.99, unit: 'pack', pantry: false },

  // Vegetables
  broccoli: { typicalPrice: 1.99, unit: 'lb', pantry: false },
  bell_pepper: { typicalPrice: 1.29, unit: 'each', pantry: false },
  onion: { typicalPrice: 0.99, unit: 'lb', pantry: false },
  spinach: { typicalPrice: 2.49, unit: 'lb', pantry: false },
  carrot: { typicalPrice: 1.19, unit: 'lb', pantry: false },
  tomato: { typicalPrice: 1.79, unit: 'lb', pantry: false },

  // Sauces / condiments
  salsa: { typicalPrice: 2.99, unit: 'jar', pantry: false },
  soy_sauce: { typicalPrice: 3.49, unit: 'bottle', pantry: false },
  marinara: { typicalPrice: 2.79, unit: 'jar', pantry: false },

  // Pantry staples — assumed on hand, never costed
  olive_oil: { typicalPrice: 7.99, unit: 'bottle', pantry: true },
  salt: { typicalPrice: 0.99, unit: 'container', pantry: true },
  pepper: { typicalPrice: 3.99, unit: 'container', pantry: true },
  garlic: { typicalPrice: 0.5, unit: 'head', pantry: true },
}
