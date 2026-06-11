# grocery-savings MVP — File-Level Implementation Plan

> Authored by the Opus 4.8 planning agent on 2026-06-10. Executed by implementation
> subagents per the phase/ownership boundaries in §7. See docs/BUILDLOG.md for the
> dispatch log.

Audience: implementation agents executing inside `/Users/mrchiimp/Projects/grocery-savings`. This monorepo is a Turborepo template (Next.js 14 App Router + Expo + Supabase). Follow the template's existing patterns exactly. The `profiles` slice is the canonical end-to-end example; mirror it.

Package scope prefix is `@grocery-savings/*`. Use that exact prefix in all imports.

---

## 1. Architecture Decisions (with rationale)

**AD-1 — Logged-out core flow, prefs in localStorage, auth optional.** The MVP flow (zip → prefs → deals → meal plan → recipe) reads only public reference data and runs computation client-side; requiring auth adds friction and complicates e2e/CI. Preferences live in a Jotai `atomWithStorage` atom; signed-in users can additionally persist prefs + saved plans to user-scoped tables. This keeps CI e2e simple (no auth dance) while preserving the template's auth for the "save" upgrade path.

**AD-2 — Reference data tables use `using (true)` SELECT-only RLS; this is the documented exception to the user-scoped rule.** `stores`, `sale_items`, `recipe_templates` are catalog data identical for every visitor, so user-scoping is meaningless; they get RLS enabled with a SELECT-only `using (true)` policy and NO insert/update/delete policies (writes happen only via migrations/seed, i.e. service_role). Recorded in ADR-0002 and called out in SQL comments, because the template's default rule forbids `using (true)` on user-data tables.

**AD-3 — User data tables (`user_preferences`, `saved_meal_plans`) follow the standard user-scoped pattern** (`auth.uid() = user_id`, full CRUD policies). These mirror `profiles` exactly and require auth.

**AD-4 — Sale data behind a `SaleDataProvider` adapter interface; the `seed` provider reads the DB, the Kroger provider is a documented stub.** The matching engine and UI depend only on the interface, so swapping in the live Kroger API later touches one file. The `seed` provider queries `sale_items`/`stores` via the anon client; `KrogerSaleDataProvider` throws with a doc comment describing the OAuth + locations + products flow.

**AD-5 — The matching engine is pure, dependency-free TypeScript in `packages/utils`.** Plain data in (sale items, prefs, templates), ranked meal plan out — no Supabase, no React, no I/O — exhaustively unit-testable with Vitest.

**AD-6 — Mobile app is untouched.** New barrels only add exports; mobile imports nothing new and must keep compiling.

**AD-7 — Disable the broken deploy workflows by gating, not deleting.** `preview.yml` (Vercel) and `eas-build.yml` (EAS) reference secrets this repo lacks. Convert both to `workflow_dispatch`-only so Actions stays green without losing the deploy scaffolding.

---

## 2. Database Schema

New migration: `supabase/migrations/20240601000000_grocery_mvp.sql`.

Tables (full SQL in the migration itself):

- **enums**: `store_chain` ('kroger','aldi','other'), `item_category` (produce/meat/seafood/dairy/bakery/pantry/frozen/deli/beverages/other)
- **stores** (reference): chain, name, address, city, state, zip, latitude, longitude. RLS: SELECT-only `using (true)`.
- **sale_items** (reference): store_id FK, name, category, `ingredient_key` (canonical key the engine matches on), regular_price, sale_price, unit, servings_per_unit, dietary_flags text[], sale window dates, **`discount_percent` generated stored column**. RLS: SELECT-only `using (true)`. Indexes on store_id + ingredient_key.
- **recipe_templates** (reference): name, description, dietary_tags text[] (tags the recipe SATISFIES), servings, instructions text[], `slots` jsonb (array of `{slot, role, ingredient_keys[], quantity, unit, optional, pantry_staple}`), assumed_staples text[]. RLS: SELECT-only `using (true)`.
- **user_preferences** (user-scoped): user_id PK→auth.users, zip, radius_miles, household_size, dietary_restrictions text[], budget_per_serving, min_discount_percent. Full user-scoped CRUD policies; reuses `handle_updated_at()` trigger from init.
- **saved_meal_plans** (user-scoped): id, user_id FK, title, `plan` jsonb snapshot (denormalized so it survives sale expiry). User-scoped select/insert/delete policies.

Notes: `handle_updated_at()` already exists (no new revokes needed); `gen_random_uuid()` available by default; no new storage buckets; enums created before tables; generated column defined after base columns.

## 3. Seed Data Strategy

All reference data in `supabase/seed.sql` (runs on `supabase db reset` AND CI `supabase start`, so CI e2e has deals):

- **3 stores, Cincinnati OH**: Kroger Hyde Park (45208), Kroger Corryville (45219), Aldi Oakley (45209). Real-ish lat/long near 39.1/-84.5 so radius math is exercised.
- **~40-60 sale_items** across stores/categories with realistic prices, correct unit + servings_per_unit + ingredient_key + dietary_flags, sale window `'2024-01-01'..'2030-12-31'` (never expires; CI date-proof). Spread of discounts: some <25%, many ≥25%, a few ≥40%. Cover all slot roles (proteins: chicken_breast, ground_beef, pork_chop, tofu, black_beans, eggs; starches: rice, pasta, potato, tortilla; vegetables: broccoli, bell_pepper, onion, spinach, carrot, tomato; sauces: salsa, soy_sauce, marinara).
- **15-25 recipe_templates** with proper dietary_tags/slots/instructions/assumed_staples. Spread of tags so dietary filtering has signal (several dairy_free+gluten_free; some requiring dairy that get excluded; ≥1 fish recipe excluded by no_fish).
- Reference store_id via subquery on store name (no hardcoded UUIDs).
- **Unit contract**: each ingredient_key uses ONE canonical unit across seed items and template slots, so the engine can multiply quantity × price directly.

## 4. Module-by-Module File List

### 4a. Zod schemas — extend `packages/utils/src/schemas/index.ts` (append-only)

`dietaryRestrictionSchema` enum ('dairy_free','gluten_free','no_fish','no_pork','vegetarian','vegan','nut_free'), `preferencesSchema` (zip 5-digit regex, radiusMiles 1-50 default 10, householdSize 1-12 default 4, dietaryRestrictions, budgetPerServing positive ≤50 default 4, minDiscountPercent 0-90 default 25) + inferred types.

### 4b. Matching engine — new barrel `packages/utils/src/matching/`

- `types.ts` — shared domain contract (Store, SaleItem, RecipeTemplate, RecipeSlot, FilledSlot, IngredientLine, MealIdea, MealPlan, MatchInput, FallbackReason). **Written first; both tracks consume it.**
- `staples.ts` — `DEFAULT_STAPLE_PRICES` (typical prices for non-sale ingredients; oil/salt/pepper flagged pantry, surfaced as "assumed", not costed).
- `geo.ts` — `haversineMiles`, `storesWithinRadius`, `ZIP_CENTROIDS` (Cincinnati zips; unknown zip → fallback).
- `engine.ts` — pure functions: `filterByDiscount`, `templateAllowedByDiet`, `fillTemplate`, `costPerServing`, `scoreMeal`, `generateMealPlan` (single public entry; returns `{meals, fallbackReason}`; ranks by on-sale slots + savings; clamps to 3-7; deterministic).
- `index.ts` barrel + `"./matching"` exports-map entry in `packages/utils/package.json`.
- Atoms: `preferencesAtom` (atomWithStorage 'gs-preferences'), `mealPlanAtom` in `packages/utils/src/atoms/index.ts`.

### 4c. API layer — `packages/api`

After Phase 0 `pnpm db:generate`:

- `src/providers/sale-data-provider.ts` — `SaleDataProvider` interface (`getStores(client,{zip,radiusMiles})`, `getSaleItems(client,{storeIds})`).
- `src/providers/seed-provider.ts` — DB-backed provider; maps rows → engine `Store`/`SaleItem` (transform at API boundary).
- `src/providers/kroger-provider.ts` — documented stub (OAuth2 client-credentials, /locations, /products w/ promotions, rate limits) that throws.
- `src/providers/index.ts` barrel + `"./providers"` exports-map entry.
- Extend `queries/index.ts` (storeQueries, saleItemQueries, recipeTemplateQueries, preferencesQueries, mealPlanQueries), `mutations/index.ts` (preferencesMutations.upsert, mealPlanMutations.save/delete), `hooks/index.ts` (useStores, useSaleItems, useRecipeTemplates, usePreferences, useUpsertPreferences, useSavedMealPlans, useSaveMealPlan), `types/index.ts` (aliases from generated types).

### 4d. Tests

- `packages/utils/src/matching/__tests__/engine.test.ts` (primary), `geo.test.ts`.
- `packages/api/src/__tests__/grocery-queries.test.ts` (queryKey shapes + mocked queryFn, mirroring profileQueries tests).
- Vitest zero-config; `vi.fn()`, never jest.

## 5. UI Page / Component Breakdown (web only)

New route group `(app)` — NOT under `/dashboard` or `/settings` (middleware-protected prefixes):

- `(app)/layout.tsx` — light shell, no auth redirect.
- Landing: repoint `(marketing)/page.tsx` copy + CTA → `/plan` ("Turn grocery sales into meals, not just savings."). Update `landing.spec.ts` in the same change.
- `(app)/plan/page.tsx` — onboarding form (zip, radius, household, dietary checkboxes, budget, min-discount), backed by `preferencesAtom`; submit → `/plan/results`.
- `(app)/plan/results/page.tsx` — reads prefs, fetches via hooks, runs `generateMealPlan` (memoized client-side): deals grouped by store, 3-7 meal cards, empty-state by `fallbackReason`; recipe detail rendered inline via client state; shopping list grouped by store.
- Components in `(app)/components/`: `preferences-form.tsx`, `deals-list.tsx`, `meal-card.tsx`, `recipe-detail.tsx`, `shopping-list.tsx`, `empty-state.tsx`.
- **Only existing `@grocery-savings/ui-web` exports may be imported**: Avatar, Button, Card(+parts), Input, Label, Separator, Toast, cn.
- Optional (time-permitting): "Save this plan" for signed-in users.

## 6. Test Plan

### Unit — engine (highest coverage)

1. Discount threshold: 20%-off dropped, 30%-off kept at min 25; boundary 25% included (>=).
2. Dietary template filtering: template lacking dairy_free excluded for dairy_free user; dairy_free+gluten_free survives both; fish recipe excluded by no_fish.
3. Dietary item filtering: `contains_dairy` item never fills a slot for a dairy_free user.
4. Budget: $3.50/serving meal dropped at $2 budget, kept at $5.
5. Cost math: exact perServing assertion; pantry staples in assumedStaples, NOT costed.
6. Sale vs default pricing: on-sale uses sale_price; otherwise DEFAULT_STAPLE_PRICES.
7. Ranking: more on-sale ingredients/savings ranks higher; ≤7 results; <3 viable returns what exists.
8. Fallbacks: 'no_deals' / 'budget_too_low' / 'no_matches', meals `[]` each.
9. Determinism: same input → same ordered output.

geo: haversine sanity, radius include/exclude, unknown zip.

### E2E — `tests/e2e/specs/plan.spec.ts` (logged-out, seeded data)

1. Landing heading → "Get started" → `/plan`.
2. Fill zip 45208, household 4, dairy_free+gluten_free, min-discount 25 → submit → `/plan/results`.
3. ≥1 store-grouped deals section; deal badge ≥25%; 3-7 meal cards.
4. Meal card → recipe detail: ingredient/store/price lines, "assumed" staples note, cost/serving.
5. Shopping list grouped by store.
6. Fallback spec: min-discount 90 → empty state, no meal cards.

Update `landing.spec.ts` for new copy. `auth.spec.ts` unaffected.

### DB smoke — extend `scripts/smoke.mjs`

- Signed-in user can SELECT stores/sale_items/recipe_templates (rows exist → seed loaded).
- Anon client CANNOT INSERT into sale_items (read-only reference proven).
- Alice upserts + reads own user_preferences; Bob cannot read Alice's (negative).
- Alice inserts + reads saved_meal_plans; Bob cannot read it.

## 7. Build Order

- **Phase 0 (solo, blocking)**: migration + seed.sql + ADR-0002 + `supabase db reset` + `pnpm db:generate`. Owner A.
- **Phase 1 (parallel, disjoint ownership)**: Track 1A Owner B = ALL of `packages/utils`; Track 1B Owner A = ALL of `packages/api`; Track 1C Owner C = workflows gating + smoke.mjs additions.
- **Phase 2**: Owner D = `apps/web` `(app)` route group + marketing repoint.
- **Phase 3**: e2e specs + landing.spec update; full gate.
- **Final gate**: `pnpm verify` → `pnpm verify:db` → `pnpm test:e2e` → push → GitHub Actions green (gated preview/eas don't run on push).

## 8. Risks / Gotchas

1. `pnpm db:generate` must run before typed `packages/api` work.
2. New barrels ⇒ `exports` map entries (`./matching`, `./providers`).
3. `using (true)` needs ADR-0002 + SQL comments or an agent will "fix" it.
4. `landing.spec.ts` asserts old template copy — update with the landing repoint.
5. Keep public flow OUTSIDE `/dashboard`/`/settings` middleware prefixes.
6. Local e2e needs `apps/web/.env.local` symlink + running seeded Supabase; CI injects env via GITHUB_ENV.
7. Mobile must keep compiling — no web/Node-only imports in shared root barrels.
8. Enums before tables; generated column after base columns.
9. Round cost display via `formatCurrency`; tests assert rounded values.
10. Never change React/Expo versions to fix bundling (CLAUDE.md rule #1).
