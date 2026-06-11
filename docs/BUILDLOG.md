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

## Subagent Registry

| # | Agent | Model | Task | Status |
| - | ----- | ----- | ---- | ------ |
| 1 | opus-planner | Opus 4.8 | Full implementation plan (schema, modules, tests, phases) | running |

## Decisions

| # | Decision | Why |
| - | -------- | --- |
| 1 | Scaffold from golden-repo via new-project skill | This build is also the template's first real test |
| 2 | Supabase ports 553xx + project_id grocery-savings | Run alongside golden stack without container/port clashes |
| 3 | Planning delegated to Opus 4.8 | Owner instruction: strongest model plans, others execute |
| 4 | Seeded sale-data provider behind adapter interface | Can't call live Kroger API; keeps swap path clean for v2 |
| 5 | Template-based recipe engine as pure TS module | Deterministic, unit-testable, no LLM cost/latency in MVP |
