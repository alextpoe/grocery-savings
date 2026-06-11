# ADR-0002: Public reference data uses SELECT-only `using (true)` RLS

## Status

Accepted

## Context

ADR-0001 established the repo's single data-access rule: every table has RLS
enabled AND user-scoped policies (`auth.uid() = ...`), enforced through the
anon-key client. The `new-migration` skill and `.claude/rules/security.md`
both state plainly: "Never write `using (true)` on a user-data table."

The grocery-savings MVP (docs/PLAN.md §2) introduces three catalog tables that
are not user data:

- `stores` — physical grocery stores and their locations.
- `sale_items` — the current sales catalog the matching engine reads.
- `recipe_templates` — the recipe library meal plans are generated from.

This data is **identical for every visitor**. There is no `user_id` to scope by,
and the core logged-out flow (zip → prefs → deals → meal plan, AD-1) must read
it with no session at all. Two options were considered:

1. **Service-role reads behind a server API.** Keeps `using (true)` out of the
   schema, but forces a server round-trip for public catalog data, breaks the
   logged-out client-side flow, and contradicts AD-1 / the anon-key model.
2. **RLS enabled with a SELECT-only `using (true)` policy and no write
   policies.** Anyone (anon included) may read; nobody may write through the
   API. Writes happen only via migrations and `supabase/seed.sql`, which run as
   `service_role` and bypass RLS entirely.

## Decision

We chose option 2 for `stores`, `sale_items`, and `recipe_templates`. Each has:

- `enable row level security`;
- exactly ONE policy: `for select using (true)`;
- **NO** `insert` / `update` / `delete` policies — so the anon and authenticated
  roles can read but never write the catalog through the app;
- a SQL comment on the policy pointing back to this ADR, so a future agent or
  reviewer does not "fix" the `using (true)` to match the user-scoped rule.

User-scoping is meaningless here: the rows belong to no user, and the security
property we need is "read-only public catalog," which `using (true)` + absent
write policies expresses exactly. The catalog is mutated only by trusted,
server-side paths (migration files and the seed script), which use the
`service_role` connection and are not subject to RLS.

The MVP's actual user data — `user_preferences` and `saved_meal_plans` — remains
under the ADR-0001 rule with full `auth.uid() = user_id` CRUD policies. This ADR
is a narrow, named exception for public reference catalogs, not a relaxation of
the default.

## Consequences

- The logged-out core flow reads `stores` / `sale_items` / `recipe_templates`
  directly through the anon-key client with no auth, keeping CI e2e simple.
- `using (true)` appears in the schema by design; the SQL comments + this ADR
  document why, so security reviews and automated "fixers" leave it alone.
- Catalog writes are constrained to migrations and seed (service_role). Adding a
  live data source later (e.g. the Kroger provider, AD-4) must write via a
  trusted server context — there is deliberately no client write path.
- A new reference table must explicitly opt into this pattern AND cite this ADR
  in a SQL comment; absent that citation, the user-scoped rule still applies.
