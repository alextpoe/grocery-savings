import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.describe('Sign In Page', () => {
    test('should display sign in form', async ({ page }) => {
      await page.goto('/sign-in')

      await expect(
        page.getByRole('heading', { name: /welcome back/i })
      ).toBeVisible()
      await expect(page.getByLabel(/email/i)).toBeVisible()
      await expect(page.getByLabel(/password/i)).toBeVisible()
      await expect(
        page.getByRole('button', { name: /sign in/i })
      ).toBeVisible()
      await expect(page.getByRole('link', { name: /forgot password/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible()
    })

    test('should show validation errors for empty form', async ({ page }) => {
      await page.goto('/sign-in')

      await page.getByRole('button', { name: /sign in/i }).click()

      // Form should show validation errors
      await expect(page.getByText(/invalid email/i)).toBeVisible()
    })

    test('should show validation error for invalid email', async ({ page }) => {
      await page.goto('/sign-in')

      await page.getByLabel(/email/i).fill('invalid-email')
      await page.getByLabel(/password/i).fill('password123')
      await page.getByRole('button', { name: /sign in/i }).click()

      await expect(page.getByText(/invalid email/i)).toBeVisible()
    })

    test('should navigate to sign up', async ({ page }) => {
      await page.goto('/sign-in')

      await page.getByRole('link', { name: /sign up/i }).click()

      await expect(page).toHaveURL('/sign-up')
    })

    test('should navigate to forgot password', async ({ page }) => {
      await page.goto('/sign-in')

      await page.getByRole('link', { name: /forgot password/i }).click()

      await expect(page).toHaveURL('/forgot-password')
    })
  })

  test.describe('Sign Up Page', () => {
    test('should display sign up form', async ({ page }) => {
      await page.goto('/sign-up')

      await expect(
        page.getByRole('heading', { name: /create an account/i })
      ).toBeVisible()
      await expect(page.getByLabel(/name/i)).toBeVisible()
      await expect(page.getByLabel(/email/i)).toBeVisible()
      await expect(page.getByLabel('Password')).toBeVisible()
      await expect(page.getByLabel(/confirm password/i)).toBeVisible()
      await expect(
        page.getByRole('button', { name: /sign up/i })
      ).toBeVisible()
    })

    test('should show validation error for password mismatch', async ({
      page,
    }) => {
      await page.goto('/sign-up')

      await page.getByLabel(/name/i).fill('Test User')
      await page.getByLabel(/email/i).fill('test@example.com')
      await page.getByLabel('Password').fill('Password123')
      await page.getByLabel(/confirm password/i).fill('DifferentPassword')
      await page.getByRole('button', { name: /sign up/i }).click()

      await expect(page.getByText(/passwords do not match/i)).toBeVisible()
    })

    test('should show validation error for weak password', async ({ page }) => {
      await page.goto('/sign-up')

      await page.getByLabel(/name/i).fill('Test User')
      await page.getByLabel(/email/i).fill('test@example.com')
      await page.getByLabel('Password').fill('weak')
      await page.getByLabel(/confirm password/i).fill('weak')
      await page.getByRole('button', { name: /sign up/i }).click()

      await expect(
        page.getByText(/password must be at least 8 characters/i)
      ).toBeVisible()
    })
  })

  test.describe('Forgot Password Page', () => {
    test('should display forgot password form', async ({ page }) => {
      await page.goto('/forgot-password')

      await expect(
        page.getByRole('heading', { name: /forgot password/i })
      ).toBeVisible()
      await expect(page.getByLabel(/email/i)).toBeVisible()
      await expect(
        page.getByRole('button', { name: /send reset link/i })
      ).toBeVisible()
    })

    test('should show validation error for invalid email', async ({ page }) => {
      await page.goto('/forgot-password')

      await page.getByLabel(/email/i).fill('invalid-email')
      await page.getByRole('button', { name: /send reset link/i }).click()

      await expect(page.getByText(/invalid email/i)).toBeVisible()
    })
  })

  test.describe('Protected Routes', () => {
    test('should redirect to sign in for dashboard', async ({ page }) => {
      await page.goto('/dashboard')

      // Should redirect to sign-in with redirect param
      await expect(page).toHaveURL(/\/sign-in/)
    })

    test('should redirect to sign in for settings', async ({ page }) => {
      await page.goto('/settings')

      // Should redirect to sign-in with redirect param
      await expect(page).toHaveURL(/\/sign-in/)
    })
  })
})
