'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
} from '@grocery-savings/ui-web'
import { formatCurrency } from '@grocery-savings/utils/formatters'
import type { MealIdea } from '@grocery-savings/utils/matching'

export function RecipeDetail({ meal }: { meal: MealIdea }) {
  return (
    <Card data-testid="recipe-detail">
      <CardHeader>
        <CardTitle>{meal.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Ingredients
          </h3>
          <ul className="space-y-1">
            {meal.ingredients.map((line, idx) => (
              <li
                key={`${line.label}-${idx}`}
                className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm"
              >
                <span>
                  <span className="font-medium">{line.label}</span>
                  <span className="text-muted-foreground">
                    {' '}
                    — {line.quantity} {line.unit}
                  </span>
                </span>
                <span className="text-muted-foreground">
                  {line.onSale && line.storeName ? (
                    <>
                      {line.storeName} ·{' '}
                      {line.price != null
                        ? formatCurrency(line.price)
                        : null}
                      {line.discountPercent != null && (
                        <> ({Math.round(line.discountPercent)}% off)</>
                      )}
                    </>
                  ) : (
                    <>
                      typical price
                      {line.price != null && (
                        <> · {formatCurrency(line.price)}</>
                      )}
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {meal.assumedStaples.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Assumed on hand: {meal.assumedStaples.join(', ')}
          </p>
        )}

        <Separator />

        <div className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Instructions
          </h3>
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            {meal.instructions.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </div>

        <p className="text-sm font-semibold">
          Estimated cost: {formatCurrency(meal.costPerServing)}/serving
        </p>
      </CardContent>
    </Card>
  )
}
