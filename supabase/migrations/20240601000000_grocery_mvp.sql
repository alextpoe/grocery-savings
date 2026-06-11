-- Grocery Savings MVP schema.
--
-- Implements docs/PLAN.md §2:
--   * reference catalog tables (stores, sale_items, recipe_templates) that are
--     identical for every visitor and therefore use a SELECT-only `using (true)`
--     RLS policy with NO write policies. This is the documented exception to the
--     repo's "RLS must be user-scoped" rule (.claude/rules/security.md). See
--     docs/adr/0002-public-reference-data-rls.md.
--   * user-scoped tables (user_preferences, saved_meal_plans) that mirror the
--     `profiles` pattern from 20240101000000_init.sql with full `auth.uid()`
--     CRUD policies.
--
-- Enums are created BEFORE tables; the generated column is defined AFTER the
-- base columns it depends on (docs/PLAN.md §8).

-- ---------------------------------------------------------------------------
-- Enums (created before tables that reference them)
-- ---------------------------------------------------------------------------

create type public.store_chain as enum ('kroger', 'aldi', 'other');

create type public.item_category as enum (
  'produce',
  'meat',
  'seafood',
  'dairy',
  'bakery',
  'pantry',
  'frozen',
  'deli',
  'beverages',
  'other'
);

-- ---------------------------------------------------------------------------
-- stores (public reference data)
-- ---------------------------------------------------------------------------

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  chain public.store_chain not null,
  name text not null,
  address text not null,
  city text not null,
  state text not null,
  zip text not null,
  latitude double precision not null,
  longitude double precision not null,
  created_at timestamptz default now() not null
);

alter table public.stores enable row level security;

-- Public reference catalog: identical for every visitor, so user-scoping is
-- meaningless. SELECT-only `using (true)`; writes happen only via migrations/
-- seed (service_role). NO write policies on purpose. See docs/adr/0002.
create policy "Stores are publicly readable"
  on public.stores for select
  using (true);

-- ---------------------------------------------------------------------------
-- sale_items (public reference data)
-- ---------------------------------------------------------------------------

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  name text not null,
  category public.item_category not null,
  -- Canonical key the matching engine joins on against recipe template slots.
  ingredient_key text not null,
  regular_price numeric(10, 2) not null check (regular_price > 0),
  sale_price numeric(10, 2) not null check (sale_price > 0),
  -- Canonical unit for this ingredient_key (see UNIT CONTRACT in seed.sql).
  unit text not null,
  -- How many recipe servings one purchase unit yields (for cost math).
  servings_per_unit numeric(10, 2) not null check (servings_per_unit > 0),
  -- What the item CONTAINS / IS (item dietary vocabulary, see seed.sql).
  dietary_flags text[] not null default '{}',
  sale_starts_at date not null,
  sale_ends_at date not null,
  created_at timestamptz default now() not null,
  -- Generated column defined AFTER the base columns it depends on.
  discount_percent numeric(5, 2) generated always as (
    round(((regular_price - sale_price) / regular_price) * 100, 2)
  ) stored
);

create index sale_items_store_id_idx on public.sale_items (store_id);
create index sale_items_ingredient_key_idx on public.sale_items (ingredient_key);

alter table public.sale_items enable row level security;

-- Public reference catalog (see docs/adr/0002). SELECT-only `using (true)`,
-- NO write policies; sale data is loaded via seed/migrations only.
create policy "Sale items are publicly readable"
  on public.sale_items for select
  using (true);

-- ---------------------------------------------------------------------------
-- recipe_templates (public reference data)
-- ---------------------------------------------------------------------------

create table public.recipe_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  -- Every DietaryRestriction value this recipe SATISFIES.
  dietary_tags text[] not null default '{}',
  servings integer not null check (servings > 0),
  instructions text[] not null,
  -- Array of {slot, role, ingredient_keys[], quantity, unit, optional,
  -- pantry_staple} per the matching engine domain contract.
  slots jsonb not null,
  assumed_staples text[] not null default '{}',
  created_at timestamptz default now() not null
);

alter table public.recipe_templates enable row level security;

-- Public reference catalog (see docs/adr/0002). SELECT-only `using (true)`,
-- NO write policies; recipe templates are loaded via seed/migrations only.
create policy "Recipe templates are publicly readable"
  on public.recipe_templates for select
  using (true);

-- ---------------------------------------------------------------------------
-- user_preferences (user-scoped; mirrors the profiles RLS pattern)
-- ---------------------------------------------------------------------------

create table public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  zip text not null,
  radius_miles integer not null default 10,
  household_size integer not null default 4,
  -- DietaryRestriction values the user requires.
  dietary_restrictions text[] not null default '{}',
  budget_per_serving numeric(10, 2) not null default 4,
  min_discount_percent integer not null default 25,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.user_preferences enable row level security;

-- User-scoped CRUD, mirroring profiles (docs/adr/0001).
create policy "Users can view own preferences"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert own preferences"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update own preferences"
  on public.user_preferences for update
  using (auth.uid() = user_id);

create policy "Users can delete own preferences"
  on public.user_preferences for delete
  using (auth.uid() = user_id);

-- Reuse the existing handle_updated_at() trigger function from init.
create trigger on_user_preferences_updated
  before update on public.user_preferences
  for each row execute procedure public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- saved_meal_plans (user-scoped; mirrors the profiles RLS pattern)
-- ---------------------------------------------------------------------------

create table public.saved_meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  -- Denormalized plan snapshot so it survives sale expiry.
  plan jsonb not null,
  created_at timestamptz default now() not null
);

create index saved_meal_plans_user_id_idx on public.saved_meal_plans (user_id);

alter table public.saved_meal_plans enable row level security;

-- User-scoped policies (select/insert/delete; meal plans are immutable
-- snapshots, so no update policy by design).
create policy "Users can view own saved meal plans"
  on public.saved_meal_plans for select
  using (auth.uid() = user_id);

create policy "Users can insert own saved meal plans"
  on public.saved_meal_plans for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own saved meal plans"
  on public.saved_meal_plans for delete
  using (auth.uid() = user_id);
