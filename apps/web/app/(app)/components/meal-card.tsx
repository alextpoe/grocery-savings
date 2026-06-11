'use client'

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@grocery-savings/ui-web'
import { formatCurrency } from '@grocery-savings/utils/formatters'
import type { MealIdea } from '@grocery-savings/utils/matching'

export function MealCard({
  meal,
  selected,
  onSelect,
}: {
  meal: MealIdea
  selected: boolean
  onSelect: () => void
}) {
  return (
    <Card
      data-testid="meal-card"
      className={selected ? 'border-primary ring-1 ring-primary' : undefined}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{meal.name}</CardTitle>
          <span className="whitespace-nowrap rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
            {meal.onSaleCount} on sale
          </span>
        </div>
        <CardDescription>{meal.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm font-semibold">
          {formatCurrency(meal.costPerServing)}/serving
        </p>
        <p className="text-sm text-muted-foreground">
          Saves {formatCurrency(meal.totalSavings)} vs regular prices
        </p>
        <Button
          variant={selected ? 'secondary' : 'outline'}
          className="w-full"
          onClick={onSelect}
        >
          View recipe
        </Button>
      </CardContent>
    </Card>
  )
}
