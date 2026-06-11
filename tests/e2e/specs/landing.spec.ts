import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test('should display the landing page', async ({ page }) => {
    await page.goto('/')

    // Check hero section
    await expect(
      page.getByRole('heading', { name: /build faster with/i })
    ).toBeVisible()
    await expect(page.getByText(/golden/i).first()).toBeVisible()

    // Check navigation
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /get started/i })).toBeVisible()

    // Check features section
    await expect(
      page.getByRole('heading', { name: /everything you need/i })
    ).toBeVisible()
    await expect(page.getByText(/lightning fast/i)).toBeVisible()
    await expect(page.getByText(/secure by default/i)).toBeVisible()
    await expect(page.getByText(/cross-platform/i)).toBeVisible()
  })

  test('should navigate to sign in page', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /sign in/i }).click()

    await expect(page).toHaveURL('/sign-in')
    await expect(
      page.getByRole('heading', { name: /welcome back/i })
    ).toBeVisible()
  })

  test('should navigate to sign up page', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /get started/i }).first().click()

    await expect(page).toHaveURL('/sign-up')
    await expect(
      page.getByRole('heading', { name: /create an account/i })
    ).toBeVisible()
  })
})
