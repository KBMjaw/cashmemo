-- One-Tap Mode 1 ("Quick QR"): short link redirects, usable without auth.
-- Additive migration — does not modify any existing table from 0001_init.sql.

-- ---------------------------------------------------------------------------
-- short_links
-- ---------------------------------------------------------------------------
create table if not exists public.short_links (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  target_url text not null,
  -- Optional owner: set when the creator is signed in, null for anonymous
  -- Quick QR use. Never required — Mode 1 must work without auth.
  user_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint short_links_code_format check (code ~ '^[A-Z0-9]{6,10}$'),
  constraint short_links_target_url_format check (target_url ~ '^https?://')
);

create index if not exists idx_short_links_user_id on public.short_links (user_id) where user_id is not null;

alter table public.short_links enable row level security;

-- Anyone (including anonymous visitors) can create a short link — this is
-- the whole point of the no-login Quick QR flow.
create policy "short_links_insert_any" on public.short_links
  for insert with check (true);

-- Anyone can resolve a code by reading it — required for the redirect page,
-- which runs before any auth context exists.
create policy "short_links_select_any" on public.short_links
  for select using (true);

-- Reserve additional application routes so a signed-up user can never claim
-- a username that would collide with a real page.
insert into public.reserved_usernames (username) values
  ('quick-qr'), ('forgot-password'), ('reset-password'), ('x')
on conflict do nothing;
