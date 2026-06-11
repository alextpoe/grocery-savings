import { describe, it, expect, vi } from 'vitest'

import { seedSaleDataProvider } from '../providers'
import {
  mealPlanQueries,
  preferencesQueries,
  recipeTemplateQueries,
  saleItemQueries,
  storeQueries,
} from '../queries'

// vitest (vi.fn), NOT jest

describe('storeQueries', () => {
  it('byZipRadius has correct key with zip + radius', () => {
    const query = storeQueries.byZipRadius('45208', 5)
    expect(query.queryKey).toEqual(['stores', '45208', 5])
  })
})

describe('saleItemQueries', () => {
  it('byStores spreads store ids into the key', () => {
    const query = saleItemQueries.byStores(['a', 'b'])
    expect(query.queryKey).toEqual(['sale-items', 'a', 'b'])
  })

  it('byStores key with empty ids', () => {
    const query = saleItemQueries.byStores([])
    expect(query.queryKey).toEqual(['sale-items'])
  })
})

describe('recipeTemplateQueries', () => {
  it('all has correct key', () => {
    const query = recipeTemplateQueries.all()
    expect(query.queryKey).toEqual(['recipe-templates'])
  })

  it('all maps a snake_case row (with slots jsonb) to the camelCase contract', async () => {
    const row = {
      id: 'rt-1',
      name: 'Veggie Stir Fry',
      description: 'Quick weeknight stir fry',
      dietary_tags: ['dairy_free', 'gluten_free'],
      servings: 4,
      instructions: ['Chop', 'Fry', 'Serve'],
      slots: [
        {
          slot: 'Protein',
          role: 'protein',
          ingredient_keys: ['tofu', 'chicken_breast'],
          quantity: 1,
          unit: 'lb',
          optional: false,
          pantry_staple: false,
        },
      ],
      assumed_staples: ['oil', 'salt'],
      created_at: '2024-01-01T00:00:00Z',
    }

    const select = vi.fn(() => Promise.resolve({ data: [row], error: null }))
    const from = vi.fn(() => ({ select }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = { from } as any

    const templates = await recipeTemplateQueries.all().queryFn(client)

    expect(from).toHaveBeenCalledWith('recipe_templates')
    expect(templates).toHaveLength(1)
    const t = templates[0]!
    expect(t).toMatchObject({
      id: 'rt-1',
      name: 'Veggie Stir Fry',
      description: 'Quick weeknight stir fry',
      dietaryTags: ['dairy_free', 'gluten_free'],
      servings: 4,
      instructions: ['Chop', 'Fry', 'Serve'],
      assumedStaples: ['oil', 'salt'],
    })
    // slots jsonb is TRANSFORMED to camelCase, not passed through —
    // the engine reads slot.ingredientKeys/pantryStaple (regression: a
    // snake_case passthrough here silently produced zero meal matches)
    expect(t.slots).toEqual([
      {
        slot: 'Protein',
        role: 'protein',
        ingredientKeys: ['tofu', 'chicken_breast'],
        quantity: 1,
        unit: 'lb',
        optional: false,
        pantryStaple: false,
      },
    ])
  })
})

describe('preferencesQueries', () => {
  it('current has correct key', () => {
    expect(preferencesQueries.current().queryKey).toEqual(['preferences'])
  })

  it('current returns null when logged out', async () => {
    const client = {
      auth: {
        getUser: vi.fn(() =>
          Promise.resolve({ data: { user: null }, error: null })
        ),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
    expect(await preferencesQueries.current().queryFn(client)).toBeNull()
  })
})

describe('mealPlanQueries', () => {
  it('list has correct key', () => {
    expect(mealPlanQueries.list().queryKey).toEqual(['meal-plans'])
  })

  it('list returns [] when logged out', async () => {
    const client = {
      auth: {
        getUser: vi.fn(() =>
          Promise.resolve({ data: { user: null }, error: null })
        ),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
    expect(await mealPlanQueries.list().queryFn(client)).toEqual([])
  })
})

describe('seedSaleDataProvider.getStores', () => {
  // Three real-ish Cincinnati stores. Hyde Park + Oakley sit near the 45208
  // centroid (39.1366,-84.4338); Corryville is ~5mi west near -84.51.
  const stores = [
    {
      id: 'hyde-park',
      chain: 'kroger',
      name: 'Kroger Hyde Park',
      address: '3760 Paxton Ave',
      city: 'Cincinnati',
      state: 'OH',
      zip: '45209',
      latitude: 39.13,
      longitude: -84.43,
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'oakley',
      chain: 'aldi',
      name: 'Aldi Oakley',
      address: '3145 Madison Rd',
      city: 'Cincinnati',
      state: 'OH',
      zip: '45209',
      latitude: 39.155,
      longitude: -84.425,
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'corryville',
      chain: 'kroger',
      name: 'Kroger Corryville',
      address: '100 E Corry St',
      city: 'Cincinnati',
      state: 'OH',
      zip: '45219',
      latitude: 39.12,
      longitude: -84.51,
      created_at: '2024-01-01T00:00:00Z',
    },
  ]

  function mockClient() {
    const select = vi.fn(() => Promise.resolve({ data: stores, error: null }))
    const from = vi.fn(() => ({ select }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { from } as any
  }

  it('unknown zip returns [] without querying radius', async () => {
    const result = await seedSaleDataProvider.getStores(mockClient(), {
      zip: '99999',
      radiusMiles: 50,
    })
    expect(result).toEqual([])
  })

  it('small radius around 45208 excludes Corryville but keeps Hyde Park + Oakley', async () => {
    const result = await seedSaleDataProvider.getStores(mockClient(), {
      zip: '45208',
      radiusMiles: 3,
    })
    const ids = result.map((s) => s.id)
    expect(ids).toContain('hyde-park')
    expect(ids).toContain('oakley')
    expect(ids).not.toContain('corryville')
  })

  it('wide radius around 45208 includes all three', async () => {
    const result = await seedSaleDataProvider.getStores(mockClient(), {
      zip: '45208',
      radiusMiles: 25,
    })
    expect(result.map((s) => s.id).sort()).toEqual([
      'corryville',
      'hyde-park',
      'oakley',
    ])
  })

  it('coerces numeric lat/lng to numbers', async () => {
    const result = await seedSaleDataProvider.getStores(mockClient(), {
      zip: '45208',
      radiusMiles: 25,
    })
    const hp = result.find((s) => s.id === 'hyde-park')!
    expect(typeof hp.latitude).toBe('number')
    expect(typeof hp.longitude).toBe('number')
  })
})

describe('seedSaleDataProvider.getSaleItems', () => {
  it('returns [] for empty storeIds without querying', async () => {
    const from = vi.fn()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = { from } as any
    expect(
      await seedSaleDataProvider.getSaleItems(client, { storeIds: [] })
    ).toEqual([])
    expect(from).not.toHaveBeenCalled()
  })

  it('maps snake_case rows to the contract, denormalizing storeName and coercing numerics', async () => {
    const rows = [
      {
        id: 'si-1',
        store_id: 'hyde-park',
        name: 'Boneless Chicken Breast',
        category: 'meat',
        ingredient_key: 'chicken_breast',
        regular_price: '5.99',
        sale_price: '3.99',
        unit: 'lb',
        servings_per_unit: '4',
        dietary_flags: ['meat', 'animal_product'],
        discount_percent: '33.39',
        sale_starts_at: '2024-01-01',
        sale_ends_at: '2030-12-31',
        created_at: '2024-01-01T00:00:00Z',
        stores: { name: 'Kroger Hyde Park' },
      },
    ]

    const inFn = vi.fn(() => Promise.resolve({ data: rows, error: null }))
    const select = vi.fn(() => ({ in: inFn }))
    const from = vi.fn(() => ({ select }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = { from } as any

    const items = await seedSaleDataProvider.getSaleItems(client, {
      storeIds: ['hyde-park'],
    })

    expect(from).toHaveBeenCalledWith('sale_items')
    expect(select).toHaveBeenCalledWith('*, stores(name)')
    expect(inFn).toHaveBeenCalledWith('store_id', ['hyde-park'])
    expect(items).toHaveLength(1)
    expect(items[0]).toEqual({
      id: 'si-1',
      storeId: 'hyde-park',
      storeName: 'Kroger Hyde Park',
      name: 'Boneless Chicken Breast',
      category: 'meat',
      ingredientKey: 'chicken_breast',
      regularPrice: 5.99,
      salePrice: 3.99,
      unit: 'lb',
      servingsPerUnit: 4,
      dietaryFlags: ['meat', 'animal_product'],
      discountPercent: 33.39,
    })
  })

  it('handles the joined store returned as a single-element array', async () => {
    const rows = [
      {
        id: 'si-2',
        store_id: 'oakley',
        name: 'Broccoli Crowns',
        category: 'produce',
        ingredient_key: 'broccoli',
        regular_price: 2.0,
        sale_price: 1.0,
        unit: 'lb',
        servings_per_unit: 4,
        dietary_flags: ['vegan'],
        discount_percent: null,
        sale_starts_at: '2024-01-01',
        sale_ends_at: '2030-12-31',
        created_at: '2024-01-01T00:00:00Z',
        stores: [{ name: 'Aldi Oakley' }],
      },
    ]

    const inFn = vi.fn(() => Promise.resolve({ data: rows, error: null }))
    const select = vi.fn(() => ({ in: inFn }))
    const from = vi.fn(() => ({ select }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = { from } as any

    const items = await seedSaleDataProvider.getSaleItems(client, {
      storeIds: ['oakley'],
    })
    expect(items[0]!.storeName).toBe('Aldi Oakley')
    // null discount_percent falls back to computed (2 → 1 = 50%)
    expect(items[0]!.discountPercent).toBe(50)
  })
})
