'use client'

import { formatCurrency } from '@grocery-savings/utils/formatters'
import type { SaleItem } from '@grocery-savings/utils/matching'

export function DealsList({ items }: { items: SaleItem[] }) {
  const byStore = new Map<string, SaleItem[]>()
  for (const item of items) {
    const group = byStore.get(item.storeName) ?? []
    group.push(item)
    byStore.set(item.storeName, group)
  }
  const storeNames = Array.from(byStore.keys()).sort()

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold">This week&apos;s deals</h2>
      {storeNames.map((storeName) => (
        <div key={storeName} className="space-y-2">
          <h3 className="text-lg font-semibold">{storeName}</h3>
          <ul className="divide-y rounded-md border">
            {(byStore.get(storeName) ?? []).map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-4 px-4 py-2"
              >
                <span className="font-medium">{item.name}</span>
                <span className="flex items-center gap-2 text-sm">
                  <span className="font-semibold">
                    {formatCurrency(item.salePrice)}
                  </span>
                  <span className="text-muted-foreground line-through">
                    {formatCurrency(item.regularPrice)}
                  </span>
                  <span
                    data-testid="deal-badge"
                    className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary"
                  >
                    {Math.round(item.discountPercent)}% off
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
