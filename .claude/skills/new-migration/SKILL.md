---
name: new-migration
description: Use when creating or altering database tables, columns, functions, triggers, or storage buckets. Walks through migration, RLS policies, function lockdown, type generation, and DB smoke testing so schema changes are safe and typed.
---

# New Migration

Follow these steps in order for ANY schema change.

## 1. Create the migration file

```bash
supabase migration new <short_name>
# creates supabase/migrations/<timestamp>_<short_name>.sql
```

If the CLI is unavailable, name it manually: `supabase/migrations/$(date +%Y%m%d%H%M%S)_<short_name>.sql`.

## 2. Write the SQL — security checklist

**Every new table:**

```sql
alter table public.<table> enable row level security;

create policy "Users can view own rows"
  on public.<table> for select
  using (auth.uid() = user_id);
-- repeat for insert (with check), update, delete as the feature requires
```

- RLS with NO policies means nobody — including signed-in users — can touch the table from the app. Policies are required, and must be user-scoped (`auth.uid() = ...`). Never write `using (true)` on a user-data table.
- If rows are created by a SECURITY DEFINER trigger (like `profiles` via `handle_new_user`), you may intentionally omit the INSERT policy — say so in a SQL comment.

**Every new function:**

```sql
create or replace function public.<fn>() returns ...
security definer set search_path = public
as $$ ... $$ language plpgsql;

revoke execute on function public.<fn> from public;
revoke execute on function public.<fn> from anon;
```

(Skip the revokes only if clients are meant to call it via RPC.)

**Every new storage bucket:**

```sql
insert into storage.buckets (id, name, public) values ('<bucket>', '<bucket>', false);
-- public must be false; add per-user folder policies like the avatars bucket in 20240101000000_init.sql
```

Store storage **paths** in DB columns, never URLs (signed URLs expire).

## 3. Apply and regenerate types

```bash
supabase db reset      # re-runs all migrations + seed locally
pnpm db:generate       # regenerates packages/api/src/types/database.ts
```

Until `db:generate` runs, the typed client does not know the new table. If you must write code before that, use the untyped client temporarily:

```typescript
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(url, key) // no <Database> generic
```

Switch back to the typed client after generating.

## 4. Wire the API layer

Add query/mutation factories in `packages/api/src/queries|mutations` (copy the `profiles` pattern), hooks in `packages/api/src/hooks`, and a Zod schema in `packages/utils/src/schemas`.

## 5. Prove it works

```bash
pnpm verify        # lint + typecheck + unit tests
pnpm verify:db     # executes queries/mutations against the real local DB
```

Do not claim the schema change is done until both pass.
