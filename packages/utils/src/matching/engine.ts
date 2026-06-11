import { DEFAULT_STAPLE_PRICES } from './staples'
import type {
  DietaryRestriction,
  FilledSlot,
  IngredientLine,
  MatchInput,
  MealIdea,
  MealPlan,
  RecipeSlot,
  RecipeTemplate,
  SaleItem,
} from './types'

/**
 * The matching engine: pure, deterministic, dependency-free.
 *
 * Data in (sale items, prefs, recipe templates), a ranked meal plan out. No
 * Supabase, no React, no I/O — fully unit-testable. The single public entry is
 * `generateMealPlan`; the smaller functions are exported for targeted tests.
 */

/** Maximum number of meals returned in a plan. */
export const MAX_MEALS = 7

/**
 * Item dietary flags a given restriction forbids. A slot may only be filled by
 * an item carrying NONE of the flags forbidden by ANY of the user's
 * restrictions.
 */
export const RESTRICTION_FORBIDDEN_FLAGS: Record<DietaryRestriction, string[]> =
  {
    dairy_free: ['contains_dairy'],
    gluten_free: ['contains_gluten'],
    no_fish: ['fish'],
    no_pork: ['pork'],
    vegetarian: ['fish', 'meat'],
    vegan: ['fish', 'meat', 'animal_product', 'contains_dairy'],
    nut_free: ['contains_nuts'],
  }

/**
 * Filter sale items to those discounted at or above the threshold (>=).
 */
export function filterByDiscount(
  items: SaleItem[],
  minDiscountPercent: number
): SaleItem[] {
  return items.filter((item) => item.discountPercent >= minDiscountPercent)
}

/**
 * A template is allowed iff EVERY user restriction is one of the tags the
 * template satisfies. With no restrictions, every template is allowed.
 */
export function templateAllowedByDiet(
  template: RecipeTemplate,
  restrictions: DietaryRestriction[]
): boolean {
  return restrictions.every((restriction) =>
    template.dietaryTags.includes(restriction)
  )
}

/**
 * The set of item dietary flags forbidden by the union of all restrictions.
 */
function forbiddenFlagsFor(restrictions: DietaryRestriction[]): Set<string> {
  const flags = new Set<string>()
  for (const restriction of restrictions) {
    for (const flag of RESTRICTION_FORBIDDEN_FLAGS[restriction]) {
      flags.add(flag)
    }
  }
  return flags
}

/** True if the item carries no flag the user forbids. */
function itemAllowed(item: SaleItem, forbidden: Set<string>): boolean {
  return !item.dietaryFlags.some((flag) => forbidden.has(flag))
}

/** Humanize an ingredient_key for display, e.g. "chicken_breast" → "Chicken Breast". */
function humanizeIngredientKey(key: string): string {
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Pick the cheapest sale item (by salePrice) qualifying for a slot: its
 * ingredientKey must be one the slot accepts AND it must not violate any
 * restriction. Returns null when nothing qualifies. Ties broken by item id for
 * determinism.
 */
function cheapestQualifyingItem(
  slot: RecipeSlot,
  saleItems: SaleItem[],
  forbidden: Set<string>
): SaleItem | null {
  const accepted = new Set(slot.ingredientKeys)
  let best: SaleItem | null = null
  for (const item of saleItems) {
    if (!accepted.has(item.ingredientKey)) continue
    if (!itemAllowed(item, forbidden)) continue
    if (
      best === null ||
      item.salePrice < best.salePrice ||
      (item.salePrice === best.salePrice && item.id < best.id)
    ) {
      best = item
    }
  }
  return best
}

/**
 * Default-priced fill for a non-sale, non-pantry slot. Uses the first accepted
 * ingredient key present in DEFAULT_STAPLE_PRICES.
 */
function defaultFillForSlot(slot: RecipeSlot): FilledSlot | null {
  for (const key of slot.ingredientKeys) {
    const staple = DEFAULT_STAPLE_PRICES[key]
    if (staple && !staple.pantry) {
      return {
        slot,
        saleItem: null,
        ingredientKey: key,
        estimatedCost: slot.quantity * staple.typicalPrice,
        fromSale: false,
      }
    }
  }
  return null
}

/**
 * Fill every slot of a template. Returns the filled slots, or null when the
 * template is non-viable: a REQUIRED protein slot with no qualifying on-sale
 * item makes the whole meal non-viable (the product is sale-driven by design).
 *
 * - pantry_staple slots are never filled and never costed (surfaced as assumed).
 * - on-sale fill uses the cheapest qualifying sale item (cost = quantity × salePrice).
 * - otherwise fall back to DEFAULT_STAPLE_PRICES (cost = quantity × typicalPrice).
 * - a required non-protein slot with no sale item and no default price is non-viable.
 * - optional slots that cannot be filled are simply skipped.
 */
export function fillTemplate(
  template: RecipeTemplate,
  saleItems: SaleItem[],
  restrictions: DietaryRestriction[]
): FilledSlot[] | null {
  const forbidden = forbiddenFlagsFor(restrictions)
  const filled: FilledSlot[] = []

  for (const slot of template.slots) {
    // Pantry staples: assumed-on-hand, never costed, never filled from sales.
    if (slot.pantryStaple) continue

    const saleItem = cheapestQualifyingItem(slot, saleItems, forbidden)

    if (saleItem) {
      filled.push({
        slot,
        saleItem,
        ingredientKey: saleItem.ingredientKey,
        estimatedCost: slot.quantity * saleItem.salePrice,
        fromSale: true,
      })
      continue
    }

    // No qualifying sale item. A required protein slot is a hard miss.
    if (slot.role === 'protein' && !slot.optional) {
      return null
    }

    const defaultFill = defaultFillForSlot(slot)
    if (defaultFill) {
      filled.push(defaultFill)
      continue
    }

    // No sale item and no default price.
    if (slot.optional) continue
    return null
  }

  return filled
}

/**
 * Cost per serving = total slot cost / servings. Per-slot cost is already
 * `quantity × unit price` (computed during fill).
 */
export function costPerServing(
  filledSlots: FilledSlot[],
  servings: number
): number {
  const total = filledSlots.reduce((sum, slot) => sum + slot.estimatedCost, 0)
  return servings > 0 ? total / servings : 0
}

/**
 * Comparator implementing the ranking: more on-sale slots first, then larger
 * total savings, then lower cost per serving, then template id as the final
 * deterministic tiebreaker. Returns negative when `a` ranks before `b`.
 */
export function scoreMeal(a: MealIdea, b: MealIdea): number {
  if (a.onSaleCount !== b.onSaleCount) return b.onSaleCount - a.onSaleCount
  if (a.totalSavings !== b.totalSavings) return b.totalSavings - a.totalSavings
  if (a.costPerServing !== b.costPerServing) {
    return a.costPerServing - b.costPerServing
  }
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
}

/** Build the display ingredient lines from filled (non-pantry) slots. */
function buildIngredientLines(filledSlots: FilledSlot[]): IngredientLine[] {
  return filledSlots.map((filled) => {
    const { slot, saleItem } = filled
    if (saleItem) {
      return {
        label: saleItem.name,
        quantity: slot.quantity,
        unit: slot.unit,
        storeName: saleItem.storeName,
        price: saleItem.salePrice,
        onSale: true,
        discountPercent: saleItem.discountPercent,
      }
    }
    const staple = DEFAULT_STAPLE_PRICES[filled.ingredientKey]
    return {
      label: humanizeIngredientKey(filled.ingredientKey),
      quantity: slot.quantity,
      unit: slot.unit,
      storeName: null,
      price: staple ? staple.typicalPrice : null,
      onSale: false,
      discountPercent: null,
    }
  })
}

/** Assemble a MealIdea from a template and its filled slots. */
function buildMealIdea(
  template: RecipeTemplate,
  filledSlots: FilledSlot[]
): MealIdea {
  const totalCost = filledSlots.reduce(
    (sum, slot) => sum + slot.estimatedCost,
    0
  )
  const totalSavings = filledSlots.reduce((sum, filled) => {
    if (!filled.saleItem) return sum
    const saved =
      (filled.saleItem.regularPrice - filled.saleItem.salePrice) *
      filled.slot.quantity
    return sum + Math.max(0, saved)
  }, 0)
  const onSaleCount = filledSlots.filter((slot) => slot.fromSale).length
  const perServing = costPerServing(filledSlots, template.servings)

  return {
    id: template.id,
    name: template.name,
    description: template.description,
    servings: template.servings,
    instructions: template.instructions,
    ingredients: buildIngredientLines(filledSlots),
    assumedStaples: template.assumedStaples,
    costPerServing: perServing,
    totalCost,
    totalSavings,
    onSaleCount,
    // Convenience composite: on-sale slots weighted, then savings.
    score: onSaleCount * 1000 + totalSavings,
  }
}

/**
 * Generate a ranked meal plan from sale items, recipe templates, and user
 * preferences. Single public entry point. Pure and deterministic.
 *
 * Pipeline: threshold-filter items → diet-filter templates → fill each →
 * drop over-budget → rank → slice to MAX_MEALS.
 *
 * fallbackReason precedence (only set when meals is empty):
 *   - 'no_deals'       — zero items passed the discount threshold.
 *   - 'no_matches'     — no template survived the diet filter, or none viable.
 *   - 'budget_too_low' — viable meals existed but all exceeded the budget.
 */
export function generateMealPlan(input: MatchInput): MealPlan {
  const {
    saleItems,
    templates,
    restrictions,
    budgetPerServing,
    minDiscountPercent,
  } = input

  const onSaleItems = filterByDiscount(saleItems, minDiscountPercent)
  if (onSaleItems.length === 0) {
    return { meals: [], fallbackReason: 'no_deals' }
  }

  const allowedTemplates = templates.filter((template) =>
    templateAllowedByDiet(template, restrictions)
  )
  if (allowedTemplates.length === 0) {
    return { meals: [], fallbackReason: 'no_matches' }
  }

  let anyViable = false
  const withinBudget: MealIdea[] = []

  for (const template of allowedTemplates) {
    const filledSlots = fillTemplate(template, onSaleItems, restrictions)
    if (filledSlots === null) continue
    anyViable = true

    const meal = buildMealIdea(template, filledSlots)
    if (meal.costPerServing <= budgetPerServing) {
      withinBudget.push(meal)
    }
  }

  if (!anyViable) {
    return { meals: [], fallbackReason: 'no_matches' }
  }
  if (withinBudget.length === 0) {
    return { meals: [], fallbackReason: 'budget_too_low' }
  }

  const meals = [...withinBudget].sort(scoreMeal).slice(0, MAX_MEALS)
  return { meals, fallbackReason: null }
}
