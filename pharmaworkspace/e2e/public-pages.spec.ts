import { test, expect } from '@playwright/test'

// Régression : chaque lien public du footer/header marketing doit être
// accessible sans authentification. Un lien vers une page absente de
// PUBLIC_ROUTES (proxy.ts) redirige silencieusement vers /login, déjà
// arrivé deux fois (/cookies puis /mentions-legales).

const PUBLIC_PAGES = [
  '/tarifs',
  '/securite',
  '/privacy',
  '/dpa',
  '/conditions-generales',
  '/cookies',
  '/mentions-legales',
]

test.describe('Pages publiques', () => {
  for (const path of PUBLIC_PAGES) {
    test(`${path} accessible sans login`, async ({ page }) => {
      await page.goto(path)
      await expect(page).toHaveURL(new RegExp(`${path.replace(/\//g, '\\/')}$`))
      await expect(page.locator('h1').first()).toBeVisible()
    })
  }
})
