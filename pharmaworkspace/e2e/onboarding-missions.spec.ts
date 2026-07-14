import { test, expect } from '@playwright/test'
import { hasE2eAuthCredentials, loginWithOtp } from './helpers/auth'

// ONBOARD-01 : golden path missions d'activation.
//
// Limites infra e2e actuelles (cf. e2e/helpers/auth.ts) : pas de fixture
// "signup nouveau titulaire + wizard Stripe", donc les tests utilisent le compte
// OTP déjà onboardé (PLAYWRIGHT_TEST_EMAIL/PLAYWRIGHT_TEST_OTP). La partie
// wizard 4 étapes + bannière de transition n'est donc pas couverte ici ;
// le reste du golden path (widget dashboard, CTA missions, dismiss,
// réactivation Paramètres → Affichage) l'est.

test.describe('Missions d\'activation', () => {
  test('redirige vers la connexion si non authentifié', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('widget dashboard : progress, CTA mission, dismiss puis réactivation', async ({
    page,
  }) => {
    test.skip(!hasE2eAuthCredentials(), 'Définir PLAYWRIGHT_TEST_EMAIL et PLAYWRIGHT_TEST_OTP')

    await loginWithOtp(page)
    await page.goto('/dashboard')

    // 0. S'assurer que le widget est visible (réactive via Paramètres si un
    //    run précédent l'a masqué).
    const checklist = page.getByTestId('mission-checklist')
    if (!(await checklist.isVisible().catch(() => false))) {
      await page.goto('/settings/display')
      const toggle = page.locator('#missions-toggle')
      if ((await toggle.getAttribute('data-state')) !== 'checked') {
        await toggle.click()
      }
      await page.goto('/dashboard')
    }
    await expect(checklist).toBeVisible()

    // 1. Barre de progression X/N affichée (N = 7 si flag chat OFF, 8 sinon ;
    //    pour le compte de test les missions peuvent être partiellement faites,
    //    on vérifie le format, pas la valeur).
    await expect(checklist.getByRole('progressbar')).toBeVisible()
    await expect(checklist.locator('text=/^\\d+\\/\\d+$/')).toBeVisible()

    // 2. Cliquer le CTA de la mission "Scanner votre première ordonnance"
    //    → la page ordonnances s'ouvre en mode création.
    const ocrMission = checklist.locator('[data-mission-id="M3"]')
    if (await ocrMission.isVisible().catch(() => false)) {
      const cta = ocrMission.getByRole('link', { name: 'Faire' })
      if (await cta.isVisible().catch(() => false)) {
        await cta.click()
        await expect(page).toHaveURL(/\/prescriptions\?create=1/)
        await page.goto('/dashboard')
      }
    }

    // 3. Masquer le widget : bouton → modal de confirmation → widget disparaît.
    await expect(checklist).toBeVisible()
    await checklist.getByRole('button', { name: 'Masquer' }).first().click()
    await expect(
      page.getByRole('heading', { name: 'Masquer le widget des missions ?' }),
    ).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Masquer', exact: true }).click()
    await expect(checklist).toBeHidden()

    // 4. Paramètres → Affichage : toggle ON → widget réapparaît au reload.
    await page.goto('/settings/display')
    const toggle = page.locator('#missions-toggle')
    await expect(toggle).toBeVisible()
    await expect(toggle).toHaveAttribute('data-state', 'unchecked')
    await toggle.click()
    await expect(toggle).toHaveAttribute('data-state', 'checked')

    await page.goto('/dashboard')
    await expect(page.getByTestId('mission-checklist')).toBeVisible()
  })
})
