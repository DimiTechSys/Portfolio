<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into PharmaWorkspace. Here is a summary of all changes made.

## Integration summary

**Client-side initialization** (`src/instrumentation-client.ts`): PostHog is initialized via `instrumentation-client.ts` (Next.js 15.3+ pattern), using a reverse proxy at `/ingest` to avoid ad-blockers. Exception capture is enabled. Sentry initialization is preserved above it.

**Reverse proxy** (`next.config.ts`): Three rewrite rules forward `/ingest/*` traffic to `https://eu.i.posthog.com` and `/ingest/static|array/*` to `https://eu-assets.i.posthog.com`, with `skipTrailingSlashRedirect: true`.

**Server-side client** (`src/lib/posthog-server.ts`): Singleton `posthog-node` client used by API routes, with `flushAt: 1` / `flushInterval: 0` for immediate flushing.

**Environment variables** (`.env.local`): `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` set and gitignore-covered.

**User identification**: Users are identified in `verify/page.tsx` after successful OTP verification using `posthog.identify(user.id, { email })`. On the server side, `invitation_accepted` in `api/invite/complete/route.ts` also calls `posthog.identify` to link the server-side distinct ID to the user's profile.

## Events instrumented

| Event | Description | File |
|-------|-------------|------|
| `login_otp_requested` | User submitted the login form; OTP sent successfully | `src/app/(auth)/login/page.tsx` |
| `login_otp_verified` | User verified the OTP code; session created. Also calls `posthog.identify`. | `src/app/(auth)/verify/page.tsx` |
| `pharmacy_created` | Titulaire completed onboarding by creating their pharmacy | `src/app/(onboarding)/onboarding/create/page.tsx` |
| `task_created` | User created a new task (priority, has_assigned_to, has_due_date) | `src/components/tasks/task-drawer.tsx` |
| `task_completed` | User marked a task as done (task_id, priority) | `src/components/tasks/task-drawer.tsx` |
| `prescription_created` | User created a new prescription (item_count, status, priority, has_image) | `src/components/prescriptions/prescription-form.tsx` |
| `order_created` | User submitted a new supplier order (item_count, status) | `src/app/(app)/orders/page.tsx` |
| `shortage_reported` | User reported a new drug shortage (product_name, has_cip13) | `src/components/shortages/shortage-table.tsx` |
| `shortage_resolved` | User resolved a shortage via CIP13 scan or quick scan (product_name, method) | `src/components/shortages/shortage-table.tsx` |
| `rental_created` | User created a new medical equipment rental (billing_type, equipment) | `src/app/(app)/rentals/page.tsx` |
| `prescription_ocr_completed` | OCR successfully processed a prescription image (provider, item_count, has_patient_name) — server-side | `src/app/api/ocr/route.ts` |
| `invitation_accepted` | Team member accepted their invitation and joined a pharmacy (pharmacy_id, role) — server-side + identify | `src/app/api/invite/complete/route.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Dashboard — Analytics basics](/dashboard/694234)
- [Auth funnel: OTP requested → verified](/insights/Kn04VT0a)
- [Nouvelles officines créées](/insights/B8fAZ2rn)
- [Tâches créées vs terminées](/insights/NQANtwLm)
- [Onboarding: création pharmacie → invitation acceptée](/insights/Phjz5LKJ)
- [Ruptures signalées vs résolues](/insights/MWdBVLsW)

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
