'use client'

import {
  useRecipeTemplates,
  useSaleItems,
  useStores,
} from '@grocery-savings/api/hooks'
import { Button } from '@grocery-savings/ui-web'
import { preferencesAtom } from '@grocery-savings/utils/atoms'
import {
  filterByDiscount,
  generateMealPlan,
  type DietaryRestriction,
} from '@grocery-savings/utils/matching'
import { useAtomValue } from 'jotai'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { DealsList } from '../../components/deals-list'
import { EmptyState } from '../../components/empty-state'
import { MealCard } from '../../components/meal-card'
import { RecipeDetail } from '../../components/recipe-detail'
import { ShoppingList } from '../../components/shopping-list'

export default function ResultsPage() {
  const router = useRouter()
  const preferences = useAtomValue(preferencesAtom)
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null)

  // No preferences yet → bounce back to the form.
  useEffect(() => {
    if (preferences === null) {
      router.replace('/plan')
    }
  }, [preferences, router])

  const zip = preferences?.zip ?? ''
  const radiusMiles = preferences?.radiusMiles ?? 10

  const storesQuery = useStores(zip, radiusMiles, {
    enabled: /^\d{5}$/.test(zip),
  })
  const storeIds = useMemo(
    () => (storesQuery.data ?? []).map((store) => store.id),
    [storesQuery.data]
  )
  const saleItemsQuery = useSaleItems(storeIds)
  const templatesQuery = useRecipeTemplates()

  const saleItems = useMemo(
    () => saleItemsQuery.data ?? [],
    [saleItemsQuery.data]
  )
  const templates = useMemo(
    () => templatesQuery.data ?? [],
    [templatesQuery.data]
  )

  const plan = useMemo(() => {
    if (!preferences) return null
    return generateMealPlan({
      saleItems,
      templates,
      restrictions:
        preferences.dietaryRestrictions as DietaryRestriction[],
      budgetPerServing: preferences.budgetPerServing,
      minDiscountPercent: preferences.minDiscountPercent,
      householdSize: preferences.householdSize,
    })
  }, [preferences, saleItems, templates])

  const deals = useMemo(() => {
    if (!preferences) return []
    return filterByDiscount(saleItems, preferences.minDiscountPercent)
  }, [preferences, saleItems])

  if (preferences === null) {
    return (
      <p className="text-muted-foreground">Set your preferences first…</p>
    )
  }

  // Loading: stores → sale items → templates.
  const storesReady = !/^\d{5}$/.test(zip) || !storesQuery.isLoading
  const saleItemsReady = storeIds.length === 0 || !saleItemsQuery.isLoading
  const isLoading =
    !storesReady || !saleItemsReady || templatesQuery.isLoading

  if (isLoading || !plan) {
    return (
      <p className="text-muted-foreground">
        Finding deals and building your plan…
      </p>
    )
  }

  // No stores for this ZIP → store-data fallback.
  if (storeIds.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Your meal plan</h1>
        <EmptyState
          reason="no_stores"
          minDiscountPercent={preferences.minDiscountPercent}
          budgetPerServing={preferences.budgetPerServing}
        />
      </div>
    )
  }

  const selectedMeal =
    plan.meals.find((meal) => meal.id === selectedMealId) ?? null

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">
          Your meal plan{plan.meals.length > 0 && ` (${deals.length} deals)`}
        </h1>
        <Button asChild variant="outline">
          <Link href="/plan">Adjust preferences</Link>
        </Button>
      </div>

      {plan.meals.length === 0 ? (
        <EmptyState
          reason={plan.fallbackReason ?? 'no_matches'}
          minDiscountPercent={preferences.minDiscountPercent}
          budgetPerServing={preferences.budgetPerServing}
        />
      ) : (
        <>
          {deals.length > 0 && <DealsList items={deals} />}

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Meal ideas</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plan.meals.map((meal) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  selected={meal.id === selectedMealId}
                  onSelect={() => setSelectedMealId(meal.id)}
                />
              ))}
            </div>
          </section>

          {selectedMeal && <RecipeDetail meal={selectedMeal} />}

          <ShoppingList meals={plan.meals} />
        </>
      )}
    </div>
  )
}
