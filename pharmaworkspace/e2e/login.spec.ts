import { test, expect } from '@playwright/test'

test.describe('Login OTP', () => {
  test('affiche le formulaire de connexion sur /login', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible()
    await expect(page.getByLabel('Email professionnel')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Recevoir le code' })).toBeVisible()
  })

  test('affiche la page de vérification OTP', async ({ page }) => {
    await page.goto('/verify?email=e2e-smoke@pharmaworkspace.test')

    await expect(page.getByRole('heading', { name: 'Vérification' })).toBeVisible()
    await expect(page.getByText('e2e-smoke@pharmaworkspace.test')).toBeVisible()
    await expect(page.locator('input[inputmode="numeric"]')).toHaveCount(8)
    await expect(page.getByRole('button', { name: 'Valider' })).toBeVisible()
  })
})
