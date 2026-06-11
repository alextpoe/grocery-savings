import { test, expect } from '@playwright/test'

// Preferences persist in localStorage (atomWithStorage key 'gs-preferences'),
// so each test sets its own form values and clears storage up front to stay
// independent of run order. Reload after clearing so the form re-mounts with a
// clean initial state (the form seeds its fields from the stored atom on mount).
async function clearPrefs(page: import('@playwright/test').Page) {
  await page.evaluate(() => localStorage.clear())
  await page.reload()
}

test.describe('Plan flow', () => {
  test('core flow: preferences → deals → meal plan → recipe → shopping list', async ({
    page,
  }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /get started/i }).click()
    await expect(page).toHaveURL('/plan')
    await clearPrefs(page)

    // Fill the preferences form.
    await page.getByLabel(/zip code/i).fill('45208')
    await page.getByLabel(/household size/i).fill('4')
    await page.getByLabel(/minimum discount/i).fill('25')
    await page.getByLabel('Dairy-free').check()
    await page.getByLabel('Gluten-free').check()

    await page.getByRole('button', { name: /find deals & meals/i }).click()
    await expect(page).toHaveURL('/plan/results')

    // Deals section is present.
    await expect(
      page.getByRole('heading', { name: /this week's deals/i })
    ).toBeVisible()

    // At least one deal badge with an integer discount >= 25.
    const badges = page.getByTestId('deal-badge')
    await expect(badges.first()).toBeVisible()
    const badgeTexts = await badges.allInnerTexts()
    const discounts = badgeTexts
      .map((t) => {
        const m = t.match(/(\d+)\s*%/)
        return m ? Number(m[1]) : NaN
      })
      .filter((n) => !Number.isNaN(n))
    expect(discounts.length).toBeGreaterThan(0)
    expect(Math.max(...discounts)).toBeGreaterThanOrEqual(25)
    // Every shown deal honours the threshold.
    expect(Math.min(...discounts)).toBeGreaterThanOrEqual(25)

    // Meal cards: between 3 and 7.
    const mealCards = page.getByTestId('meal-card')
    const mealCount = await mealCards.count()
    expect(mealCount).toBeGreaterThanOrEqual(3)
    expect(mealCount).toBeLessThanOrEqual(7)

    // Open the first recipe.
    await mealCards
      .first()
      .getByRole('button', { name: /view recipe/i })
      .click()

    const recipe = page.getByTestId('recipe-detail')
    await expect(recipe).toBeVisible()
    await expect(recipe.getByText(/assumed on hand:/i)).toBeVisible()
    await expect(
      recipe.getByText(/estimated cost: \$\d+\.\d{2}\/serving/i)
    ).toBeVisible()

    // Shopping list with at least one store group (h3).
    const shoppingList = page.getByTestId('shopping-list')
    await expect(shoppingList).toBeVisible()
    await expect(
      shoppingList.getByRole('heading', { level: 3 }).first()
    ).toBeVisible()
  })

  test('fallback: impossible discount threshold shows the empty state', async ({
    page,
  }) => {
    await page.goto('/plan')
    await clearPrefs(page)

    await page.getByLabel(/zip code/i).fill('45208')
    await page.getByLabel(/household size/i).fill('4')
    await page.getByLabel(/minimum discount/i).fill('90')

    await page.getByRole('button', { name: /find deals & meals/i }).click()
    await expect(page).toHaveURL('/plan/results')

    const emptyState = page.getByTestId('empty-state')
    await expect(emptyState).toBeVisible()
    await expect(emptyState.getByText(/discount threshold/i)).toBeVisible()
    await expect(
      emptyState.getByRole('link', { name: /adjust preferences/i })
    ).toBeVisible()

    // No meal cards in the fallback state.
    await expect(page.getByTestId('meal-card')).toHaveCount(0)
  })
})
