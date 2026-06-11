# Grocery Savings — Build Log

Running log of decisions, tasks, and subagent dispatches for the end-to-end MVP build.
This build doubles as the first real-world test of the golden-repo template.

**Product:** "Turn grocery sales into meals, not just savings." Zip code + dietary needs +
budget + minimum-discount filter → on-sale items at nearby stores → template-generated
meal plan + recipes + per-store shopping list.

**Locked scope decisions (from product discussion):**

- Persona: budget-conscious family meal planner (family of 4)
- Pilot: one city — Cincinnati, OH (Kroger-heavy)
- Recipes: template-based generation (no runtime LLM); ~15-25 seeded family-dinner templates
- Pantry tracking, receipt scanning, sale notifications: OUT of MVP (v2)
- Web only; mobile app stays as template skeleton (must keep compiling)
- Sale data: provider-adapter interface with a seeded provider (realistic circular data);
  live Kroger API adapter is a documented stub — no live API calls in MVP

**Definition of done:** `pnpm verify` green, `pnpm verify:db` green, Playwright e2e covers
the core flow, GitHub Actions CI green on github.com/alextpoe/grocery-savings.

---

## Timeline

### 2026-06-10 — Scaffold

- **Scaffolded from golden-repo** via the `new-project` skill (rsync copy, no git history).
- Renamed `@golden/*` → `@grocery-savings/*`, `golden-repo` → `grocery-savings` across
  json/ts/tsx/md/mjs/toml.
- `supabase/config.toml`: `project_id = "grocery-savings"`, ports shifted 543xx → 553xx so
  the local stack can run alongside the golden-repo stack.
- `.env.local` created from example + symlinked into `apps/web/` (template pitfall #1).
- `pnpm install` clean in 10.5s.

### 2026-06-10 — Planning

- **Subagent: `opus-planner` (Opus 4.8, Plan agent)** — dispatched with the locked product
  brief + instruction to read the template's patterns (factory pattern, RLS rules, migration
  exemplar, CI). Deliverable: file-level implementation plan — schema with RLS, seed
  strategy, module list with signatures, UI breakdown, matching-engine test plan, phased
  build order with subagent ownership boundaries. Plan saved at `docs/PLAN.md` when received.

### 2026-06-10 — Implementation (per docs/PLAN.md phases)

- **Phase 0 + Track 1A ran in parallel** (disjoint ownership: supabase/ vs packages/utils).
  I (orchestrator) wrote `packages/utils/src/matching/types.ts` FIRST as the locked contract
  both tracks build against.
- **Phase 0 (owner-a-schema, Opus):** migration (5 tables, 2 enums, generated discount
  column), seed (3 stores / 60 items / 21 templates), ADR-0002 (public reference-data RLS
  exception), db reset + types regenerated. `pnpm verify` green.
- **Track 1A (owner-b-engine, Opus):** pure matching engine + geo + staples, 31 tests,
  `./matching` exports entry, schemas + atoms extensions. Package-scoped checks green.
- **Track 1B (owner-a2-api, Opus) ∥ Track 1C (owner-c-ci, Sonnet):** SaleDataProvider
  interface + seed provider + Kroger stub, query/mutation factories + 7 hooks, 16 new api
  tests; preview/eas workflows gated to workflow_dispatch; smoke.mjs extended to 8 checks
  (reference readability, reference read-only, prefs + saved-plans RLS ±). verify:db green.
- **Phase 2 (owner-d-web, Opus):** (app) route group — /plan form, /plan/results
  (deals/meals/recipe/shopping list/empty states), landing repoint. Verified live via
  tmux'd dev server + curl.
- **Phase 3 (owner-e2e, Opus):** rewrote landing.spec, wrote plan.spec (core flow +
  fallback). **Refused to bend tests around a real bug** — found BUG 1 below.

### Bugs found by the layered verification (all fixed by orchestrator)

1. **typedRoutes latency** — `.next` route types only exist after first `next dev`;
   surfaced 4 latent type errors (footer links to nonexistent /privacy + /terms, untyped
   dynamic redirect, untyped navItems). TEMPLATE BACKPORT CANDIDATE.
2. **BUG 1 (e2e-found, blocker):** `mapRecipeTemplate` cast `slots` jsonb instead of
   transforming snake_case→camelCase → engine saw `ingredientKeys: undefined` → zero meals
   ever generated. Unit tests passed (fixtures were camelCase); the unit test even
   codified the bug. Fixed transform + assertion now locks correct behavior.
3. **Workspace glob:** `tests/*` missing from pnpm-workspace.yaml → playwright never
   installed, CI e2e silently a no-op. TEMPLATE BACKPORT CANDIDATE.
4. **e2e script naming:** tests/e2e had `"test"` not `"test:e2e"` → `pnpm verify` wrongly
   ran Playwright; `pnpm test:e2e` ran nothing. Renamed. TEMPLATE BACKPORT CANDIDATE.
5. **Auth forms (template-inherited):** missing `noValidate` meant native HTML5 validation
   blocked the Zod path (5 e2e failures); error mapping kept the LAST Zod issue per field
   (spec expects first). Both fixed. TEMPLATE BACKPORT CANDIDATE.

### Final local gate

- `pnpm verify` — green (18 turbo tasks)
- `pnpm verify:db` — green (8 checks incl. RLS negatives)
- Playwright chromium — **18/18 passed** (landing 4, auth 7, plan 2, + nav specs)

## Subagent Registry

| # | Agent | Model | Task | Status |
| - | ----- | ----- | ---- | ------ |
| 1 | opus-planner | Opus 4.8 | Full implementation plan (schema, modules, tests, phases) | done → docs/PLAN.md |
| 2 | owner-a-schema | Opus 4.8 | Phase 0: migration, seed, ADR-0002, db:generate | done |
| 3 | owner-b-engine | Opus 4.8 | Track 1A: matching engine + tests (all of packages/utils) | done (31 tests) |
| 4 | owner-a2-api | Opus 4.8 | Track 1B: providers, queries, hooks (all of packages/api) | done (16 tests) |
| 5 | owner-c-ci | Sonnet 4.6 | Track 1C: gate deploy workflows, extend smoke.mjs | done |
| 6 | owner-d-web | Opus 4.8 | Phase 2: (app) UI, landing repoint, live curl check | done |
| 7 | owner-e2e | Opus 4.8 | Phase 3: e2e specs + local run; found BUG 1 | done (18/18 after fixes) |

## Decisions

| # | Decision | Why |
| - | -------- | --- |
| 1 | Scaffold from golden-repo via new-project skill | This build is also the template's first real test |
| 2 | Supabase ports 553xx + project_id grocery-savings | Run alongside golden stack without container/port clashes |
| 3 | Planning delegated to Opus 4.8 | Owner instruction: strongest model plans, others execute |
| 4 | Seeded sale-data provider behind adapter interface | Can't call live Kroger API; keeps swap path clean for v2 |
| 5 | Template-based recipe engine as pure TS module | Deterministic, unit-testable, no LLM cost/latency in MVP |
