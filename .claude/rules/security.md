# Security Rules

## Data Access Model

One model on every platform (decision recorded in `docs/adr/0001-anon-key-rls-data-access.md`):

- All user-facing reads/writes go through the **anon-key Supabase client** — browser client (`apps/web/lib/supabase/client.ts`), cookie-based server client (`apps/web/lib/supabase/server.ts`), or native client (`apps/mobile/lib/supabase.ts`) — via the query/mutation factories in `packages/api`. Client-side data access is the blessed pattern here, on web and mobile.
- **RLS is the security boundary.** Every table MUST have RLS enabled AND user-scoped policies (`auth.uid() = ...`). A table with RLS and no policy is invisible to the app — including to signed-in users.
- `SUPABASE_SERVICE_ROLE_KEY` is a server-only escape hatch for admin scripts, webhooks, cron jobs, and Edge Functions. It must NEVER appear in client code, React components, or any `NEXT_PUBLIC_*`/`EXPO_PUBLIC_*` variable.
- Known exception: `public.profiles` has no INSERT policy on purpose — rows are created by the `handle_new_user` SECURITY DEFINER trigger on signup. Do not "fix" this by adding an INSERT policy.

When creating or altering tables, use the `new-migration` skill (`.claude/skills/new-migration/`).

## Storage

- No public buckets — always `public => false`.
- Store the storage **path** in database columns, never a URL. Sign at read time with `createSignedUrl` (see `useAvatarUrl` in `packages/api/src/hooks`). Signed URLs expire — persisting one is a bug.
- Upload under `{auth.uid()}/...` prefixes so per-folder policies apply; use `crypto.randomUUID()` filenames.

## Postgres Functions

- After `CREATE FUNCTION`, revoke execute from `public` and `anon` unless clients are meant to call it.
- SECURITY DEFINER functions must `set search_path = public`.

## Webhooks & Payments

- Never trust a webhook body. Verify the provider signature first (e.g. `stripe.webhooks.constructEvent`); return `400` on failure.

## Inputs & Secrets

- Validate all external input with Zod schemas from `@grocery-savings/utils/schemas`.
- Never hardcode secrets. Env vars are validated with Zod in `apps/web/lib/env.ts` and `apps/mobile/lib/env.ts` — add new vars there, not as bare `process.env.X!` assertions.
- When adding HTTP mutation endpoints (API routes, Edge Functions), add rate limiting (e.g. `@upstash/ratelimit`).
