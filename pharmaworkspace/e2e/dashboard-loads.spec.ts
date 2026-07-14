import { test, expect } from '@playwright/test'
import { hasE2eAuthCredentials, loginWithOtp } from './helpers/auth'

test.describe('Dashboard', () => {
  test('redirige vers la connexion si non authentifié', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('charge le dashboard après connexion OTP', async ({ page }) => {
    test.skip(!hasE2eAuthCredentials(), 'Définir PLAYWRIGHT_TEST_EMAIL et PLAYWRIGHT_TEST_OTP')

    await loginWithOtp(page)
    await page.goto('/dashboard')

    await expect(page.getByText('Dashboard')).toBeVisible()
    await expect(page.getByRole('heading', { name: /Bonjour/ })).toBeVisible()
  })
})
