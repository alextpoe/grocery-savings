'use client'

import { Button } from '@grocery-savings/ui-web'
import type { FallbackReason } from '@grocery-savings/utils/matching'
import Link from 'next/link'

export function EmptyState({
  reason,
  minDiscountPercent,
  budgetPerServing,
}: {
  reason: FallbackReason
  minDiscountPercent: number
  budgetPerServing: number
}) {
  let message: string
  switch (reason) {
    case 'no_deals':
      message = `No deals meet your ${Math.round(
        minDiscountPercent
      )}% discount threshold right now — try lowering it.`
      break
    case 'budget_too_low':
      message = `We found meals, but none under $${budgetPerServing.toFixed(
        2
      )}/serving — try raising your budget.`
      break
    case 'no_matches':
      message = 'No recipes fit those dietary filters this week.'
      break
    case 'unknown_zip':
    case 'no_stores':
    default:
      message =
        "We don't have store data for that ZIP yet — try 45208."
      break
  }

  return (
    <div
      data-testid="empty-state"
      className="rounded-lg border border-dashed p-8 text-center"
    >
      <p className="text-muted-foreground">{message}</p>
      <Button asChild variant="outline" className="mt-4">
        <Link href="/plan">Adjust preferences</Link>
      </Button>
    </div>
  )
}
