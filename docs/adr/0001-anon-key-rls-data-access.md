# ADR-0001: Anon-key client + user-scoped RLS as the single data-access model

## Status

Accepted

## Context

The template serves two clients: a Next.js web app and an Expo mobile app. Three data-access models were considered:

1. **Backend-only ("zero policy")**: RLS enabled with no policies; all access via `service_role` in Server Actions/API routes. Strongest server control, but the mobile app cannot use Server Actions — it would need a parallel HTTP API with JWT forwarding, doubling the auth surface and losing Supabase session auto-refresh.
2. **Split model**: server-side for web, RLS for mobile. Two patterns to maintain; agents copy the wrong one.
3. **Anon-key client + user-scoped RLS everywhere**: web (browser client and cookie-based server client) and mobile both use the anon key through the shared factories in `packages/api`; Postgres RLS policies are the security boundary.

An earlier version of this repo documented model 1 while the code implemented model 3 — the contradiction confused both humans and AI agents.

## Decision

We chose model 3. All user-facing data access goes through the anon-key Supabase client via `packages/api` factories, protected by user-scoped RLS policies (`auth.uid() = ...`). The `service_role` key is reserved for server-only contexts (admin scripts, webhooks, cron, Edge Functions) and must never reach a client bundle.

Related: storage columns hold **paths**, not URLs; files are served via `createSignedUrl` at read time because buckets are private and signed URLs expire.

## Consequences

- One pattern shared by web and mobile; `packages/api` works on both.
- Security reviews focus on RLS policies in `supabase/migrations/` — every table needs them, and they must be user-scoped.
- Admin/elevated operations require deliberate server-side code paths (Edge Functions or API routes with `service_role`), which is friction by design.
- `profiles` has no INSERT policy: inserts happen in the `handle_new_user` SECURITY DEFINER trigger.
