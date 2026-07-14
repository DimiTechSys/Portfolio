import { test, expect } from '@playwright/test'
import { hasE2eAuthCredentials, loginWithOtp } from './helpers/auth'

test.describe('Tâches', () => {
  test('redirige vers la connexion si non authentifié', async ({ page }) => {
    await page.goto('/tasks')
    await expect(page).toHaveURL(/\/login/)
  })

  test('crée une tâche visible dans la liste', async ({ page }) => {
    test.skip(!hasE2eAuthCredentials(), 'Définir PLAYWRIGHT_TEST_EMAIL et PLAYWRIGHT_TEST_OTP')

    await loginWithOtp(page)

    const title = `E2E tâche ${Date.now()}`
    await page.goto('/tasks?id=new')

    await expect(page.getByLabel('Titre')).toBeVisible()
    await page.getByLabel('Titre').fill(title)
    await page.getByRole('button', { name: 'Créer la tâche' }).click()

    await expect(page.getByText(title)).toBeVisible({ timeout: 15_000 })
  })
})
