import { expect, type Page } from '@playwright/test'

export function hasE2eAuthCredentials(): boolean {
  const email = process.env.PLAYWRIGHT_TEST_EMAIL?.trim()
  const otp = process.env.PLAYWRIGHT_TEST_OTP?.trim()
  return Boolean(email && otp && otp.length === 8)
}

/** Connexion OTP complète (nécessite PLAYWRIGHT_TEST_EMAIL + PLAYWRIGHT_TEST_OTP). */
export async function loginWithOtp(page: Page): Promise<void> {
  const email = process.env.PLAYWRIGHT_TEST_EMAIL?.trim()
  const otp = process.env.PLAYWRIGHT_TEST_OTP?.trim()
  if (!email || !otp || otp.length !== 8) {
    throw new Error('PLAYWRIGHT_TEST_EMAIL et PLAYWRIGHT_TEST_OTP (8 chiffres) requis')
  }

  await page.goto('/login')
  await page.getByLabel('Email professionnel').fill(email)
  await page.getByRole('button', { name: 'Recevoir le code' }).click()
  await page.waitForURL(/\/verify/)

  const digitInputs = page.locator('input[inputmode="numeric"]')
  await expect(digitInputs).toHaveCount(8)
  for (let i = 0; i < 8; i++) {
    await digitInputs.nth(i).fill(otp[i]!)
  }
  await page.getByRole('button', { name: 'Valider' }).click()

  await page.waitForURL(
    (url) => {
      const path = url.pathname
      return path === '/dashboard' || path.startsWith('/onboarding')
    },
    { timeout: 20_000 }
  )

  if (page.url().includes('/onboarding')) {
    throw new Error(
      'Compte de test non onboardé : utilisez un profil avec officine déjà créée'
    )
  }
}
