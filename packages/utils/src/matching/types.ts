/**
 * Shared domain contract for the matching engine.
 *
 * This file is the agreed interface between the matching engine
 * (packages/utils/src/matching), the API providers (packages/api/src/providers,
 * which map DB rows into these shapes), and the web UI. Change it only with
 * coordination across all three.
 *
 * UNIT CONTRACT: every ingredient_key uses ONE canonical unit across seeded
 * sale items and recipe template slots (e.g. chicken_breast is always "lb"),
 * so cost math is `quantity × price` with no unit conversion in the MVP.
 */

export type DietaryRestriction =
  | 'dairy_free'
  | 'gluten_free'
  | 'no_fish'
  | 'no_pork'
  | 'vegetarian'
  | 'vegan'
  | 'nut_free'

export type StoreChain = 'kroger' | 'aldi' | 'other'

export type ItemCategory =
  | 'produce'
  | 'meat'
  | 'seafood'
  | 'dairy'
  | 'bakery'
  | 'pantry'
  | 'frozen'
  | 'deli'
  | 'beverages'
  | 'other'

export interface Store {
  id: string
  chain: StoreChain
  name: string
  address: string
  city: string
  state: string
  zip: string
  latitude: number
  longitude: number
}

/**
 * Dietary flags carried by items (what an item CONTAINS / IS):
 * 'contains_dairy' | 'contains_gluten' | 'contains_nuts' | 'fish' | 'pork'
 * | 'meat' | 'animal_product'
 */
export interface SaleItem {
  id: string
  storeId: string
  /** Denormalized for display ("which store has the deal"). */
  storeName: string
  name: string
  category: ItemCategory
  /** Canonical key the engine matches against template slots. */
  ingredientKey: string
  regularPrice: number
  salePrice: number
  unit: string
  /** How many recipe servings one purchase unit yields (for cost math). */
  servingsPerUnit: number
  dietaryFlags: string[]
  discountPercent: number
}

export type SlotRole = 'protein' | 'starch' | 'vegetable' | 'sauce' | 'aromatic' | 'staple'

export interface RecipeSlot {
  /** Display label, e.g. "Protein". */
  slot: string
  role: SlotRole
  /** Acceptable ingredient keys, in preference order. */
  ingredientKeys: string[]
  /** Quantity of the canonical unit consumed by the whole recipe. */
  quantity: number
  unit: string
  optional: boolean
  /** Pantry staples are assumed-on-hand: surfaced, never costed. */
  pantryStaple: boolean
}

export interface RecipeTemplate {
  id: string
  name: string
  description: string
  /** Every DietaryRestriction value this recipe SATISFIES. */
  dietaryTags: string[]
  servings: number
  instructions: string[]
  slots: RecipeSlot[]
  assumedStaples: string[]
}

export interface FilledSlot {
  slot: RecipeSlot
  /** The on-sale item filling this slot, or null when default-priced. */
  saleItem: SaleItem | null
  ingredientKey: string
  /** Cost contribution of this slot to the whole recipe. */
  estimatedCost: number
  fromSale: boolean
}

export interface IngredientLine {
  label: string
  quantity: number
  unit: string
  /** Store carrying the deal; null for default-priced/pantry items. */
  storeName: string | null
  price: number | null
  onSale: boolean
  discountPercent: number | null
}

export interface MealIdea {
  /** Template id this meal was generated from. */
  id: string
  name: string
  description: string
  servings: number
  instructions: string[]
  ingredients: IngredientLine[]
  assumedStaples: string[]
  costPerServing: number
  totalCost: number
  /** Total savings vs regular prices across on-sale ingredients. */
  totalSavings: number
  onSaleCount: number
  score: number
}

export type FallbackReason =
  | 'no_deals'
  | 'budget_too_low'
  | 'no_matches'
  | 'unknown_zip'
  | 'no_stores'

export interface MealPlan {
  meals: MealIdea[]
  fallbackReason: FallbackReason | null
}

export interface MatchInput {
  saleItems: SaleItem[]
  templates: RecipeTemplate[]
  restrictions: DietaryRestriction[]
  budgetPerServing: number
  minDiscountPercent: number
  householdSize: number
}
