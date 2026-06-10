-- Run this once in your Supabase project: SQL Editor -> New query -> paste -> Run.

-- 1. One table holding a single JSON blob of pool state.
create table if not exists public.pool_state (
  id   text primary key,
  data jsonb not null default '{}'::jsonb
);

-- 2. Lock the table down, then open exactly what the site needs.
alter table public.pool_state enable row level security;

-- Anyone with the site can READ the standings (the anon key is public by design).
create policy "read pool" on public.pool_state
  for select to anon using (true);

-- Allow the in-page "Manual override" toggle to edit the single pool row.
-- This lets anyone who has the page URL make corrections — fine for a private
-- friends' pool. If you'd rather the site be READ-ONLY (only the scheduled job
-- writes), simply delete these two policies.
create policy "override insert" on public.pool_state
  for insert to anon with check (id = 'wc2026');
create policy "override update" on public.pool_state
  for update to anon using (id = 'wc2026') with check (id = 'wc2026');

-- 3. Seed the row.
insert into public.pool_state (id, data)
values ('wc2026', '{"m":{},"ko":{},"locked":{}}'::jsonb)
on conflict (id) do nothing;

-- 4. Turn on realtime so every open page updates the instant the row changes.
alter publication supabase_realtime add table public.pool_state;

-- Note: the GitHub Actions fetcher authenticates with the SERVICE ROLE key,
-- which bypasses RLS — it can always write regardless of the policies above.
