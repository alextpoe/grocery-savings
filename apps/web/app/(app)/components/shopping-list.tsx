'use client'

import { formatCurrency } from '@grocery-savings/utils/formatters'
import type { IngredientLine, MealIdea } from '@grocery-savings/utils/matching'

const PANTRY_GROUP = 'Anywhere / pantry'

type AggregatedLine = {
  key: string
  label: string
  quantity: number
  unit: string
  price: number | null
  storeName: string | null
}

function aggregate(meals: MealIdea[]): Map<string, AggregatedLine[]> {
  // Dedupe ingredient lines by a canonical key (label + unit + store), summing
  // quantities across every displayed meal. On-sale items group under their
  // store; everything else lands in the pantry/anywhere group.
  const lines = new Map<string, AggregatedLine>()

  for (const meal of meals) {
    for (const line of meal.ingredients as IngredientLine[]) {
      const groupName = line.onSale && line.storeName ? line.storeName : null
      const key = `${groupName ?? PANTRY_GROUP}::${line.label}::${line.unit}`
      const existing = lines.get(key)
      if (existing) {
        existing.quantity += line.quantity
      } else {
        lines.set(key, {
          key,
          label: line.label,
          quantity: line.quantity,
          unit: line.unit,
          price: line.price,
          storeName: groupName,
        })
      }
    }
  }

  const byStore = new Map<string, AggregatedLine[]>()
  for (const line of lines.values()) {
    const group = line.storeName ?? PANTRY_GROUP
    const arr = byStore.get(group) ?? []
    arr.push(line)
    byStore.set(group, arr)
  }
  return byStore
}

export function ShoppingList({ meals }: { meals: MealIdea[] }) {
  const byStore = aggregate(meals)
  const storeGroups = Array.from(byStore.keys())
    .filter((name) => name !== PANTRY_GROUP)
    .sort()
  const groups = byStore.has(PANTRY_GROUP)
    ? [...storeGroups, PANTRY_GROUP]
    : storeGroups

  return (
    <section data-testid="shopping-list" className="space-y-6">
      <h2 className="text-2xl font-bold">Shopping list</h2>
      {groups.map((group) => (
        <div key={group} className="space-y-2">
          <h3 className="text-lg font-semibold">{group}</h3>
          <ul className="space-y-1">
            {(byStore.get(group) ?? []).map((line) => (
              <li key={line.key} className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="h-4 w-4" />
                <span className="flex-1">
                  {line.label}
                  <span className="text-muted-foreground">
                    {' '}
                    — {line.quantity} {line.unit}
                  </span>
                </span>
                {line.price != null && (
                  <span className="text-muted-foreground">
                    {formatCurrency(line.price)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
