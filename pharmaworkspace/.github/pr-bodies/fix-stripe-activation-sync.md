## Fix — bugs onboarding Stripe (activation + dev local)

### Bug 1 — Activation bloquée sur « On finalise votre activation… »
Après le paiement Stripe, `/onboarding/activate/success` attend que
`subscription_status` passe à `trialing`/`active`. Si le webhook
`checkout.session.completed` n'arrive pas (staging, latence), la page reste
bloquée. « Vérifier à nouveau » ne faisait qu'un `router.refresh()`.

**Fix :**
- `POST /api/stripe/confirm-checkout` — sync depuis l'API Stripe (fallback webhook)
- Polling + bouton « Vérifier à nouveau » relancent cette sync

### Bug 2 — Erreur opaque en dev local sur `/onboarding/activate`
Sans `STRIPE_SECRET_KEY` / `STRIPE_PRICE_*` dans `.env.local`, message générique
« Service de paiement temporairement indisponible ». En localhost, message
explicite indiquant quelle variable manque.

### Test plan
- [ ] Staging : onboarding titulaire → Stripe test card → success → activation < 10s
- [ ] Webhook désactivé : « Vérifier à nouveau » débloque quand même
- [ ] Local sans Stripe env : message clair sur `.env.local`
- [ ] Local avec Stripe env : redirection Checkout OK

### Note Mehdi (staging)
Webhook Stripe → `https://staging.pharmaworkspace.fr/api/stripe/webhook` +
`STRIPE_WEBHOOK_SECRET` Vercel Preview.
