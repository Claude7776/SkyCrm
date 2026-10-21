-- SkyCRM database schema for Supabase.
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.
--
-- Every row belongs to the signed-in user (user_id defaults to auth.uid())
-- and Row Level Security makes sure a user only ever sees their own rows.

create table if not exists public.clients (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  email text,
  phone text,
  company text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prestations (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  client_id text not null,
  title text not null,
  description text,
  price numeric not null default 0,
  date text not null,
  due_date text,
  status text not null default 'todo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.paiements (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  prestation_id text not null,
  amount numeric not null default 0,
  date text not null,
  method text,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label text not null,
  amount numeric not null default 0,
  date text not null,
  category text,
  recurrence text,
  recurring_source_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data jsonb not null
);

create index if not exists clients_user_id_idx on public.clients (user_id);
create index if not exists prestations_user_id_idx on public.prestations (user_id);
create index if not exists paiements_user_id_idx on public.paiements (user_id);
create index if not exists expenses_user_id_idx on public.expenses (user_id);

do $$
declare
  t text;
begin
  foreach t in array array['clients', 'prestations', 'paiements', 'expenses', 'settings'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "Own rows only" on public.%I', t);
    execute format(
      'create policy "Own rows only" on public.%I for all to authenticated
         using (user_id = (select auth.uid()))
         with check (user_id = (select auth.uid()))',
      t
    );
  end loop;
end $$;
