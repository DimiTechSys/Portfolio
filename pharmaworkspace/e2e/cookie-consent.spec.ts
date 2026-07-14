import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

// CONSENT-01 : bandeau cookies + opt-in PostHog (CNIL).
// Scénarios : accept / refuse / parcours-sans-choix / revoke. Visiteur anonyme
// uniquement (le bandeau n'apparaît jamais pour un utilisateur authentifié).

async function getCookie(page: Page, name: string | RegExp) {
  const cookies = await page.context().cookies()
  return cookies.find((c) =>
    typeof name === 'string' ? c.name === name : name.test(c.name),
  )
}

// Le cookie ph_<token>_posthog n'est posé que si l'app a un token PostHog.
// En CI le secret n'est pas injecté (ci.yml ne passe que les secrets
// Supabase) : on ne peut donc y vérifier que l'absence de cookie, pas sa
// pose. En local, .env/.env.local fournissent le token et l'assertion
// positive s'exécute.
function hasPosthogToken(): boolean {
  if (process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) return true
  for (const file of ['.env.local', '.env']) {
    try {
      const raw = fs.readFileSync(path.join(process.cwd(), file), 'utf-8')
      if (/^NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=.+/m.test(raw)) return true
    } catch {
      // fichier absent (CI), on continue.
    }
  }
  return false
}

const PH_COOKIE = /^ph_.*_posthog$/

test.describe('Consentement cookies', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies()
  })

  test('accepter : bandeau disparaît, consentement posé, PostHog initialisé', async ({
    page,
  }) => {
    await page.goto('/')

    const banner = page.getByTestId('cookie-banner')
    await expect(banner).toBeVisible()

    // Aucun cookie analytics avant le choix.
    expect(await getCookie(page, PH_COOKIE)).toBeUndefined()

    await banner.getByRole('button', { name: 'Accepter' }).click()
    await expect(banner).toBeHidden()

    const consent = await getCookie(page, 'pw_cookie_consent')
    expect(consent?.value).toBe('accepted')

    // PostHog s'initialise via l'event pw:consent-accepted et pose son cookie
    // (vérifiable uniquement quand le token PostHog est configuré).
    if (hasPosthogToken()) {
      await expect
        .poll(async () => Boolean(await getCookie(page, PH_COOKIE)), {
          timeout: 10_000,
        })
        .toBe(true)
    }
  })

  test('refuser : bandeau disparaît, AUCUN cookie PostHog posé', async ({
    page,
  }) => {
    await page.goto('/')

    const banner = page.getByTestId('cookie-banner')
    await expect(banner).toBeVisible()

    await banner.getByRole('button', { name: 'Refuser' }).click()
    await expect(banner).toBeHidden()

    const consent = await getCookie(page, 'pw_cookie_consent')
    expect(consent?.value).toBe('refused')

    // Laisse le temps à une éventuelle init fautive de se manifester.
    await page.waitForTimeout(2_000)
    expect(await getCookie(page, PH_COOKIE)).toBeUndefined()

    // Le choix persiste : pas de bandeau au reload.
    await page.reload()
    await expect(page.getByTestId('cookie-banner')).toBeHidden()
  })

  test('jamais accepté : parcours anonyme complet sans erreur ni cookie analytics', async ({
    page,
  }) => {
    // Cas critique : le visiteur refuse (ou ignore), RIEN ne doit casser.
    const pageErrors: Error[] = []
    page.on('pageerror', (err) => pageErrors.push(err))

    await page.goto('/')
    await page.getByTestId('cookie-banner').getByRole('button', { name: 'Refuser' }).click()

    // Parcours anonyme type : landing → tarifs → signup → login → cookies.
    for (const path of ['/tarifs', '/signup', '/login', '/cookies']) {
      await page.goto(path)
      await page.waitForLoadState('load')
      // Les capture() PostHog éventuels (landing_view, signup_view…) doivent
      // être des no-ops silencieux, sans exception non catchée.
    }

    // Le CTA pricing fonctionne sans analytics.
    await page.goto('/tarifs')
    await page
      .getByRole('link', { name: /Démarrer/ })
      .first()
      .click()
    await page.waitForLoadState('load')

    expect(pageErrors).toEqual([])
    expect(await getCookie(page, PH_COOKIE)).toBeUndefined()
    const consent = await getCookie(page, 'pw_cookie_consent')
    expect(consent?.value).toBe('refused')
  })

  test('personnaliser au premier visit : toggle mesure d\'audience → enregistrer', async ({
    page,
  }) => {
    await page.goto('/')
    const banner = page.getByTestId('cookie-banner')
    await expect(banner).toBeVisible()

    await banner.getByRole('button', { name: 'Personnaliser mes choix' }).click()
    await expect(
      banner.getByRole('heading', { name: 'Personnaliser mes choix' }),
    ).toBeVisible()

    // Toggle OFF par défaut au premier visit → enregistrer = refus.
    await banner.getByRole('button', { name: 'Enregistrer mes préférences' }).click()
    await expect(banner).toBeHidden()
    expect((await getCookie(page, 'pw_cookie_consent'))?.value).toBe('refused')
    expect(await getCookie(page, PH_COOKIE)).toBeUndefined()
  })

  test('widget flottant : rouvrir les préférences et passer de refusé à accepté', async ({
    page,
  }) => {
    await page.goto('/')
    const banner = page.getByTestId('cookie-banner')
    await banner.getByRole('button', { name: 'Tout refuser' }).click()
    await expect(banner).toBeHidden()

    // Après un choix, le widget cookie est visible et rouvre les préférences.
    const widget = page.getByTestId('cookie-widget')
    await expect(widget).toBeVisible()
    await widget.click()

    await expect(
      banner.getByRole('heading', { name: 'Personnaliser mes choix' }),
    ).toBeVisible()
    await banner.getByRole('switch').click()
    await banner.getByRole('button', { name: 'Enregistrer mes préférences' }).click()

    await expect(banner).toBeHidden()
    expect((await getCookie(page, 'pw_cookie_consent'))?.value).toBe('accepted')
    if (hasPosthogToken()) {
      await expect
        .poll(async () => Boolean(await getCookie(page, PH_COOKIE)), {
          timeout: 10_000,
        })
        .toBe(true)
    }
  })

  test('en savoir plus : /cookies reste lisible, la modal cède la place à la barre', async ({
    page,
  }) => {
    await page.goto('/')
    const banner = page.getByTestId('cookie-banner')
    await expect(banner).toBeVisible()
    await banner.getByRole('link', { name: 'En savoir plus' }).click()
    await expect(page).toHaveURL(/\/cookies/)
    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(
      page.getByRole('heading', { name: 'Cookies et traceurs' }),
    ).toBeVisible()
  })

  test('lien détail depuis les préférences : /cookies reste lisible', async ({
    page,
  }) => {
    await page.goto('/')
    const banner = page.getByTestId('cookie-banner')
    await banner.getByRole('button', { name: 'Personnaliser mes choix' }).click()
    await banner.getByRole('link', { name: /Détail des cookies/ }).click()
    await expect(page).toHaveURL(/\/cookies/)
    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(
      page.getByRole('heading', { name: 'Cookies et traceurs' }),
    ).toBeVisible()
  })

  test('révoquer : /cookies → Modifier mon choix → le bandeau réapparaît', async ({
    page,
  }) => {
    await page.goto('/')
    const banner = page.getByTestId('cookie-banner')
    await expect(banner).toBeVisible()
    await banner.getByRole('button', { name: 'Accepter' }).click()
    await expect(banner).toBeHidden()

    await page.goto('/cookies')
    await expect(
      page.getByRole('heading', { name: 'Cookies et traceurs' }),
    ).toBeVisible()

    await page.getByTestId('cookie-choice-reset').click()
    await page.waitForLoadState('load')

    expect(await getCookie(page, 'pw_cookie_consent')).toBeUndefined()
    await expect(page.getByTestId('cookie-banner')).toBeVisible()
  })
})
