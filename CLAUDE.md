# Golden Repo — Project Template

Turborepo monorepo template (Next.js web + Expo mobile + Supabase). New projects are scaffolded from this repo via the `new-project` skill, which renames `@grocery-savings/*` to `@{project}/*`.

## Verification — the rule that matters most

Never claim work is done until:

1. `pnpm verify` passes (lint + typecheck + unit tests).
2. If you touched schema, queries, mutations, or auth: `pnpm verify:db` also passes — it runs the real query/mutation factories against local Supabase (`supabase start` first). TypeScript passing does NOT prove queries work: column names and query shapes are invisible to `tsc`.
3. For UI changes: click through the affected flow (`pnpm dev:web`), tracing the full journey (landing → sign-in → destination) when auth/routing changed.

## Critical rules

1. **NEVER change React/Expo versions to fix Metro bundling errors.** The fix is always configuration: `.npmrc` needs `shamefully-hoist=true`, `metro.config.js` needs `unstable_enableSymlinks=true`, missing peer deps go in `devDependencies`. If versions look mismatched: `cd apps/mobile && npx expo install --fix`. After changing `.npmrc`: `rm -rf node_modules apps/*/node_modules pnpm-lock.yaml && pnpm install`.
2. **Run `pnpm install` after any dependency change.** CI uses `--frozen-lockfile`; the husky pre-commit hook checks lockfile sync.
3. **Data access = anon-key client + user-scoped RLS, everywhere.** `service_role` is a server-only escape hatch. Full rules: `.claude/rules/security.md`.

## Stack

Turborepo + pnpm | Next.js 14 App Router | Expo Router (React Native) | Supabase (Postgres, Auth, Storage) | shadcn/ui + Tailwind (web) | Tamagui (mobile) | Jotai (client state) | TanStack Query (server state) | Zod | Vitest + Playwright | Resend + React Email | Vercel + EAS

## Commands

```bash
pnpm dev / dev:web / dev:mobile   # Run apps
pnpm verify                       # lint + typecheck + test — run before claiming done
pnpm verify:db                    # smoke-test queries against local Supabase (needs `supabase start`)
pnpm build | lint | typecheck | test | test:e2e | format
pnpm db:generate                  # Regenerate Supabase types after migrations
pnpm db:reset                     # Reset local database (re-runs migrations + seed)
```

## How to add a feature

Mirror the `profiles` slice end-to-end — it is the canonical example:

1. Migration in `supabase/migrations/` — **invoke the `new-migration` skill**; it covers RLS, function lockdown, and bucket rules.
2. `pnpm db:generate` (until you do, the typed client doesn't know new tables — use untyped `createClient` from `@supabase/supabase-js` temporarily).
3. Query/mutation factories in `packages/api/src/queries|mutations`, hooks in `packages/api/src/hooks` (factory pattern: definition separate from hook).
4. Zod schema in `packages/utils/src/schemas`.
5. UI: web route group in `apps/web/app/`, mobile screen in `apps/mobile/app/`.
6. Vitest test in `packages/api/src/__tests__/`.
7. `pnpm verify && pnpm verify:db`.

## Project automation (ships with this repo)

- `.claude/rules/` — security + coding style (auto-loaded; keep them matching the code — when you correct a rule, fix the rule file in the same commit).
- `.claude/skills/new-migration/` — schema-change checklist; invoke for any table/function/bucket change.
- `.claude/commands/adr.md` — `/adr <decision>` records an architectural decision in `docs/adr/`.
- `.claude/settings.json` — hooks (auto-format on edit) and permission rules.
- `docs/adr/` — architectural decisions. Read `0001` before changing the data-access model.

## Pitfalls (earned the hard way)

- **`.env.local` location**: Next.js reads `apps/web/.env.local`, NOT the monorepo root. Symlink it: `ln -sf ../../.env.local apps/web/.env.local`.
- **LAN dev access**: `next dev -H 0.0.0.0` to test from other devices.
- **Subagent imports**: when spawning subagents to write code, include each package's `exports` map and where each symbol lives — agents guess monorepo import paths wrong, and invent UI components that don't exist. List the actual exports of `@grocery-savings/ui-web` / `@grocery-savings/ui-mobile`.
- **Auth/routing changes**: trace the full user journey, not just the changed page.
- **Data shaping**: transform at API boundaries (in `packages/api`), not in multiple UI clients.
- **Platform-specific code**: use `.web.ts` / `.native.ts` extensions for SDK wrappers.
