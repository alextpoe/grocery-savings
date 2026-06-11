import { describe, expect, it } from 'vitest'

import {
  filterByDiscount,
  fillTemplate,
  costPerServing,
  templateAllowedByDiet,
  generateMealPlan,
} from '../engine'
import type {
  MatchInput,
  RecipeSlot,
  RecipeTemplate,
  SaleItem,
} from '../types'

/* ------------------------------------------------------------------ *
 * Fixture builders (hand-built; no DB)
 * ------------------------------------------------------------------ */

function saleItem(overrides: Partial<SaleItem> & { id: string }): SaleItem {
  return {
    storeId: 'store-1',
    storeName: 'Kroger Hyde Park',
    name: 'Item',
    category: 'other',
    ingredientKey: 'chicken_breast',
    regularPrice: 5,
    salePrice: 3,
    unit: 'lb',
    servingsPerUnit: 4,
    dietaryFlags: [],
    discountPercent: 40,
    ...overrides,
  }
}

function slot(overrides: Partial<RecipeSlot> & { slot: string }): RecipeSlot {
  return {
    role: 'protein',
    ingredientKeys: ['chicken_breast'],
    quantity: 1,
    unit: 'lb',
    optional: false,
    pantryStaple: false,
    ...overrides,
  }
}

function template(
  overrides: Partial<RecipeTemplate> & { id: string }
): RecipeTemplate {
  return {
    name: 'Template',
    description: 'A meal',
    dietaryTags: [],
    servings: 4,
    instructions: ['Cook it.'],
    slots: [slot({ slot: 'Protein' })],
    assumedStaples: [],
    ...overrides,
  }
}

function input(overrides: Partial<MatchInput>): MatchInput {
  return {
    saleItems: [],
    templates: [],
    restrictions: [],
    budgetPerServing: 5,
    minDiscountPercent: 25,
    householdSize: 4,
    ...overrides,
  }
}

/* ------------------------------------------------------------------ *
 * Case 1 — Discount threshold
 * ------------------------------------------------------------------ */

describe('case 1: discount threshold', () => {
  const items = [
    saleItem({ id: 'a', discountPercent: 20 }),
    saleItem({ id: 'b', discountPercent: 30 }),
    saleItem({ id: 'c', discountPercent: 25 }),
  ]

  it('drops 20%-off items at min 25', () => {
    const kept = filterByDiscount(items, 25)
    expect(kept.map((i) => i.id)).not.toContain('a')
  })

  it('keeps 30%-off items at min 25', () => {
    const kept = filterByDiscount(items, 25)
    expect(kept.map((i) => i.id)).toContain('b')
  })

  it('includes the 25% boundary (>=)', () => {
    const kept = filterByDiscount(items, 25)
    expect(kept.map((i) => i.id)).toContain('c')
  })
})

/* ------------------------------------------------------------------ *
 * Case 2 — Dietary template filtering
 * ------------------------------------------------------------------ */

describe('case 2: dietary template filtering', () => {
  const plain = template({ id: 't-plain', dietaryTags: [] })
  const bothFree = template({
    id: 't-both',
    dietaryTags: ['dairy_free', 'gluten_free'],
  })
  const fishRecipe = template({ id: 't-fish', dietaryTags: ['no_pork'] })

  it('excludes a template lacking dairy_free for a dairy_free user', () => {
    expect(templateAllowedByDiet(plain, ['dairy_free'])).toBe(false)
  })

  it('keeps a dairy_free+gluten_free template for both restrictions', () => {
    expect(
      templateAllowedByDiet(bothFree, ['dairy_free', 'gluten_free'])
    ).toBe(true)
  })

  it('excludes a recipe not tagged no_fish for a no_fish user', () => {
    expect(templateAllowedByDiet(fishRecipe, ['no_fish'])).toBe(false)
  })

  it('allows any template when there are no restrictions', () => {
    expect(templateAllowedByDiet(plain, [])).toBe(true)
  })
})

/* ------------------------------------------------------------------ *
 * Case 3 — Dietary item filtering
 * ------------------------------------------------------------------ */

describe('case 3: dietary item filtering', () => {
  it('never fills a slot with a contains_dairy item for a dairy_free user', () => {
    const dairyItem = saleItem({
      id: 'cheese-chicken',
      ingredientKey: 'chicken_breast',
      salePrice: 1, // cheapest, but forbidden
      dietaryFlags: ['contains_dairy'],
    })
    const cleanItem = saleItem({
      id: 'clean-chicken',
      ingredientKey: 'chicken_breast',
      salePrice: 3,
      dietaryFlags: [],
    })
    const t = template({
      id: 't',
      dietaryTags: ['dairy_free'],
      slots: [slot({ slot: 'Protein' })],
    })

    const filled = fillTemplate(t, [dairyItem, cleanItem], ['dairy_free'])
    expect(filled).not.toBeNull()
    expect(filled![0]!.saleItem!.id).toBe('clean-chicken')
  })
})

/* ------------------------------------------------------------------ *
 * Case 4 — Budget
 * ------------------------------------------------------------------ */

describe('case 4: budget', () => {
  // 1 lb @ $14 / 4 servings = $3.50 per serving
  const item = saleItem({
    id: 'pricey',
    ingredientKey: 'chicken_breast',
    regularPrice: 20,
    salePrice: 14,
    discountPercent: 30,
  })
  const t = template({
    id: 't',
    servings: 4,
    slots: [slot({ slot: 'Protein', quantity: 1 })],
  })

  it('drops a $3.50/serving meal at a $2 budget', () => {
    const plan = generateMealPlan(
      input({ saleItems: [item], templates: [t], budgetPerServing: 2 })
    )
    expect(plan.meals).toHaveLength(0)
    expect(plan.fallbackReason).toBe('budget_too_low')
  })

  it('keeps the same meal at a $5 budget', () => {
    const plan = generateMealPlan(
      input({ saleItems: [item], templates: [t], budgetPerServing: 5 })
    )
    expect(plan.meals).toHaveLength(1)
    expect(plan.meals[0]!.costPerServing).toBeCloseTo(3.5, 5)
  })
})

/* ------------------------------------------------------------------ *
 * Case 5 — Cost math + pantry staples
 * ------------------------------------------------------------------ */

describe('case 5: cost math and pantry staples', () => {
  it('computes exact perServing and excludes pantry staples from cost', () => {
    // Protein: 2 lb @ $3 = $6. Pantry oil slot: NOT costed.
    const item = saleItem({
      id: 'chk',
      ingredientKey: 'chicken_breast',
      salePrice: 3,
      regularPrice: 5,
      discountPercent: 40,
    })
    const t = template({
      id: 't',
      servings: 4,
      assumedStaples: ['olive_oil', 'salt'],
      slots: [
        slot({ slot: 'Protein', quantity: 2 }),
        slot({
          slot: 'Oil',
          role: 'staple',
          ingredientKeys: ['olive_oil'],
          quantity: 1,
          unit: 'tbsp',
          pantryStaple: true,
        }),
      ],
    })

    const plan = generateMealPlan(
      input({ saleItems: [item], templates: [t], budgetPerServing: 5 })
    )
    const meal = plan.meals[0]!
    // $6 total / 4 servings = $1.50
    expect(meal.totalCost).toBeCloseTo(6, 5)
    expect(meal.costPerServing).toBeCloseTo(1.5, 5)
    // Pantry staple surfaced as assumed, not an ingredient line.
    expect(meal.assumedStaples).toContain('olive_oil')
    expect(meal.ingredients.map((l) => l.label)).not.toContain('Olive Oil')
    expect(meal.ingredients).toHaveLength(1)
  })

  it('costPerServing helper sums slot costs over servings', () => {
    const filled = [
      {
        slot: slot({ slot: 'A', quantity: 1 }),
        saleItem: null,
        ingredientKey: 'rice',
        estimatedCost: 4,
        fromSale: false,
      },
      {
        slot: slot({ slot: 'B', quantity: 1 }),
        saleItem: null,
        ingredientKey: 'rice',
        estimatedCost: 4,
        fromSale: false,
      },
    ]
    expect(costPerServing(filled, 4)).toBe(2)
  })
})

/* ------------------------------------------------------------------ *
 * Case 6 — Sale vs default pricing
 * ------------------------------------------------------------------ */

describe('case 6: sale vs default pricing', () => {
  it('uses sale_price for on-sale slots and DEFAULT_STAPLE_PRICES otherwise', () => {
    // Protein on sale; starch (rice) not on sale → default $1.50/lb.
    const chicken = saleItem({
      id: 'chk',
      ingredientKey: 'chicken_breast',
      salePrice: 2,
      regularPrice: 4,
      discountPercent: 50,
    })
    const t = template({
      id: 't',
      servings: 4,
      slots: [
        slot({ slot: 'Protein', quantity: 1 }),
        slot({
          slot: 'Starch',
          role: 'starch',
          ingredientKeys: ['rice'],
          quantity: 2,
          unit: 'lb',
        }),
      ],
    })

    const plan = generateMealPlan(
      input({ saleItems: [chicken], templates: [t], budgetPerServing: 10 })
    )
    const meal = plan.meals[0]!
    const proteinLine = meal.ingredients.find((l) => l.onSale)!
    const riceLine = meal.ingredients.find((l) => !l.onSale)!

    expect(proteinLine.price).toBe(2) // sale price
    expect(proteinLine.storeName).toBe('Kroger Hyde Park')
    expect(riceLine.price).toBe(1.5) // default staple price
    expect(riceLine.storeName).toBeNull()
    // Protein 1×$2 + rice 2×$1.50 = $5 total.
    expect(meal.totalCost).toBeCloseTo(5, 5)
    expect(meal.onSaleCount).toBe(1)
  })
})

/* ------------------------------------------------------------------ *
 * Case 7 — Ranking
 * ------------------------------------------------------------------ */

describe('case 7: ranking', () => {
  it('ranks more on-sale ingredients / savings higher', () => {
    // Two on-sale slots → ranks above a single on-sale slot.
    const chicken = saleItem({
      id: 'chk',
      ingredientKey: 'chicken_breast',
      salePrice: 2,
      regularPrice: 5,
      discountPercent: 60,
    })
    const rice = saleItem({
      id: 'rice',
      ingredientKey: 'rice',
      category: 'pantry',
      salePrice: 1,
      regularPrice: 2,
      discountPercent: 50,
    })

    const twoSale = template({
      id: 't-two',
      servings: 4,
      slots: [
        slot({ slot: 'Protein', quantity: 1 }),
        slot({
          slot: 'Starch',
          role: 'starch',
          ingredientKeys: ['rice'],
          quantity: 1,
          unit: 'lb',
        }),
      ],
    })
    const oneSale = template({
      id: 't-one',
      servings: 4,
      slots: [slot({ slot: 'Protein', quantity: 1 })],
    })

    const plan = generateMealPlan(
      input({
        saleItems: [chicken, rice],
        templates: [oneSale, twoSale],
        budgetPerServing: 10,
      })
    )
    expect(plan.meals[0]!.id).toBe('t-two')
    expect(plan.meals[1]!.id).toBe('t-one')
  })

  it('caps results at 7', () => {
    const chicken = saleItem({
      id: 'chk',
      ingredientKey: 'chicken_breast',
      salePrice: 2,
      discountPercent: 40,
    })
    const templates = Array.from({ length: 12 }, (_, i) =>
      template({ id: `t-${i}`, servings: 4 })
    )
    const plan = generateMealPlan(
      input({ saleItems: [chicken], templates, budgetPerServing: 10 })
    )
    expect(plan.meals.length).toBeLessThanOrEqual(7)
    expect(plan.meals).toHaveLength(7)
  })

  it('returns fewer than 3 viable meals when only that many exist', () => {
    const chicken = saleItem({
      id: 'chk',
      ingredientKey: 'chicken_breast',
      salePrice: 2,
      discountPercent: 40,
    })
    const plan = generateMealPlan(
      input({
        saleItems: [chicken],
        templates: [template({ id: 't-only' })],
        budgetPerServing: 10,
      })
    )
    expect(plan.meals).toHaveLength(1)
    expect(plan.fallbackReason).toBeNull()
  })
})

/* ------------------------------------------------------------------ *
 * Case 8 — Fallbacks
 * ------------------------------------------------------------------ */

describe('case 8: fallbacks', () => {
  it("returns 'no_deals' with empty meals when nothing passes the threshold", () => {
    const item = saleItem({ id: 'a', discountPercent: 10 })
    const plan = generateMealPlan(
      input({
        saleItems: [item],
        templates: [template({ id: 't' })],
        minDiscountPercent: 25,
      })
    )
    expect(plan.meals).toEqual([])
    expect(plan.fallbackReason).toBe('no_deals')
  })

  it("returns 'no_matches' when no template survives the diet filter", () => {
    const item = saleItem({ id: 'a', discountPercent: 40 })
    const plan = generateMealPlan(
      input({
        saleItems: [item],
        templates: [template({ id: 't', dietaryTags: [] })],
        restrictions: ['vegan'],
      })
    )
    expect(plan.meals).toEqual([])
    expect(plan.fallbackReason).toBe('no_matches')
  })

  it("returns 'no_matches' when a diet-allowed template is non-viable (required protein unmet)", () => {
    // Only a starch is on sale; the required protein slot can't be filled.
    const riceOnly = saleItem({
      id: 'rice',
      ingredientKey: 'rice',
      discountPercent: 40,
    })
    const t = template({
      id: 't',
      slots: [
        slot({ slot: 'Protein', role: 'protein', ingredientKeys: ['tofu'] }),
      ],
    })
    const plan = generateMealPlan(
      input({ saleItems: [riceOnly], templates: [t] })
    )
    expect(plan.meals).toEqual([])
    expect(plan.fallbackReason).toBe('no_matches')
  })

  it("returns 'budget_too_low' when viable meals all exceed the budget", () => {
    const item = saleItem({
      id: 'a',
      ingredientKey: 'chicken_breast',
      regularPrice: 20,
      salePrice: 14,
      discountPercent: 30,
    })
    const t = template({
      id: 't',
      servings: 4,
      slots: [slot({ slot: 'Protein', quantity: 1 })],
    })
    const plan = generateMealPlan(
      input({ saleItems: [item], templates: [t], budgetPerServing: 1 })
    )
    expect(plan.meals).toEqual([])
    expect(plan.fallbackReason).toBe('budget_too_low')
  })
})

/* ------------------------------------------------------------------ *
 * Case 9 — Determinism
 * ------------------------------------------------------------------ */

describe('case 9: determinism', () => {
  it('produces the same ordered output for the same input', () => {
    const chicken = saleItem({
      id: 'chk',
      ingredientKey: 'chicken_breast',
      salePrice: 2,
      regularPrice: 5,
      discountPercent: 60,
    })
    const beef = saleItem({
      id: 'beef',
      ingredientKey: 'ground_beef',
      salePrice: 3,
      regularPrice: 6,
      discountPercent: 50,
    })
    // Two templates with identical scores — id tiebreaker must be stable.
    const tA = template({
      id: 't-a',
      slots: [
        slot({ slot: 'Protein', ingredientKeys: ['chicken_breast', 'ground_beef'] }),
      ],
    })
    const tB = template({
      id: 't-b',
      slots: [
        slot({ slot: 'Protein', ingredientKeys: ['chicken_breast', 'ground_beef'] }),
      ],
    })
    const matchInput = input({
      saleItems: [beef, chicken],
      templates: [tB, tA],
      budgetPerServing: 10,
    })

    const first = generateMealPlan(matchInput)
    const second = generateMealPlan(matchInput)
    expect(second.meals.map((m) => m.id)).toEqual(first.meals.map((m) => m.id))
    // Equal scores → ascending template id wins.
    expect(first.meals.map((m) => m.id)).toEqual(['t-a', 't-b'])
  })
})
