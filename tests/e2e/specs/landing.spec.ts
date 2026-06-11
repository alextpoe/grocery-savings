import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test('should display the landing page', async ({ page }) => {
    await page.goto('/')

    // Hero
    await expect(
      page.getByRole('heading', { name: /turn grocery sales into meals/i })
    ).toBeVisible()

    // "How it works" section
    await expect(
      page.getByRole('heading', { name: /how it works/i })
    ).toBeVisible()

    // Primary CTA + header nav links
    await expect(
      page.getByRole('link', { name: /get started/i })
    ).toBeVisible()
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible()
  })

  test('"Get started" navigates to the plan form', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /get started/i }).click()

    await expect(page).toHaveURL('/plan')
  })

  test('"Sign in" navigates to the sign-in page', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /sign in/i }).click()

    await expect(page).toHaveURL('/sign-in')
    await expect(
      page.getByRole('heading', { name: /welcome back/i })
    ).toBeVisible()
  })

  test('"Sign up" navigates to the sign-up page', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /sign up/i }).click()

    await expect(page).toHaveURL('/sign-up')
    await expect(
      page.getByRole('heading', { name: /create an account/i })
    ).toBeVisible()
  })
})
