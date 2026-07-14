# Feature Module Standard

Each domain should expose a small public API and keep internals private.

## Structure

Use this shape for every new domain:

- `src/features/<domain>/index.ts` public exports only
- `src/features/<domain>/hooks/*` react hooks for UI consumption
- `src/features/<domain>/services/*` data access orchestration
- `src/features/<domain>/components/*` domain-specific UI (optional)
- `src/features/<domain>/types.ts` local view/domain types (optional)
- `src/features/<domain>/__tests__/*` feature tests

## Layering Rules

- Pages and components consume hooks/services from `@/features/<domain>`.
- UI must not import from `@/lib/supabase/*` or `@/lib/queries/*` directly.
- `services/*` may use `@/lib/queries/*` and shared infra.
- Keep cross-feature imports through `index.ts` only.
