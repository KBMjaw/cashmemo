-- One-Tap initial schema: profiles, businesses, social links, portfolio,
-- experience, business cards, QR codes, analytics events.
-- Run against a Supabase project (SQL editor or `supabase db push`).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  full_name text not null,
  professional_name text,
  professional_title text,
  bio text,
  date_of_birth date,
  email text not null,
  phone text,
  whatsapp text,
  website text,
  location text,
  profile_photo_url text,
  cover_photo_url text,
  visibility text not null default 'draft' check (visibility in ('draft', 'published', 'unpublished')),
  show_email boolean not null default false,
  show_phone boolean not null default true,
  show_location boolean not null default true,
  search_engine_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format check (username ~ '^[a-z0-9_]{3,30}$')
);

create table if not exists public.reserved_usernames (
  username text primary key
);

insert into public.reserved_usernames (username) values
  ('admin'), ('login'), ('signup'), ('dashboard'), ('settings'), ('api'),
  ('support'), ('about'), ('contact'), ('pricing'), ('terms'), ('privacy'),
  ('features'), ('templates'), ('u'), ('www'), ('root'), ('onetap'),
  ('one-tap'), ('help'), ('billing'), ('legal'), ('cookies')
on conflict do nothing;

create or replace function public.enforce_username_rules()
returns trigger
language plpgsql
as $$
begin
  new.username := lower(new.username);
  if exists (select 1 from public.reserved_usernames r where r.username = new.username) then
    raise exception 'Username "%" is reserved', new.username;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_username_rules on public.profiles;
create trigger trg_enforce_username_rules
  before insert or update of username on public.profiles
  for each row execute function public.enforce_username_rules();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a draft profile row when a new auth user signs up.
-- Expects full_name/username/phone/date_of_birth in user metadata (see signup flow).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name, email, phone, date_of_birth)
  values (
    new.id,
    lower(coalesce(new.raw_user_meta_data ->> 'username', 'user_' || substr(new.id::text, 1, 8))),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    new.raw_user_meta_data ->> 'phone',
    nullif(new.raw_user_meta_data ->> 'date_of_birth', '')::date
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_handle_new_user on auth.users;
create trigger trg_handle_new_user
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- businesses
-- ---------------------------------------------------------------------------
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  logo_url text,
  cover_image_url text,
  designation text,
  description text,
  website text,
  email text,
  phone text,
  whatsapp text,
  address text,
  city text,
  state text,
  country text,
  maps_url text,
  linkedin_url text,
  instagram_url text,
  facebook_url text,
  youtube_url text,
  founded_year int,
  industry text,
  services text[],
  is_primary boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_businesses_updated_at on public.businesses;
create trigger trg_businesses_updated_at
  before update on public.businesses
  for each row execute function public.set_updated_at();

create index if not exists idx_businesses_user_id on public.businesses (user_id, sort_order);

-- Only one primary business per user.
create unique index if not exists uq_businesses_primary
  on public.businesses (user_id)
  where is_primary;

-- ---------------------------------------------------------------------------
-- social_links
-- ---------------------------------------------------------------------------
create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null check (platform in
    ('linkedin', 'instagram', 'facebook', 'x', 'youtube', 'github', 'threads', 'telegram', 'pinterest')),
  url text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_social_links_user_id on public.social_links (user_id, sort_order);

-- ---------------------------------------------------------------------------
-- portfolio
-- ---------------------------------------------------------------------------
create table if not exists public.portfolio (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  cover_image_url text,
  website_url text,
  category text,
  skills text[],
  start_date date,
  end_date date,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_portfolio_user_id on public.portfolio (user_id, sort_order);

-- ---------------------------------------------------------------------------
-- experience
-- ---------------------------------------------------------------------------
create table if not exists public.experience (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  company text not null,
  position text not null,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_experience_user_id on public.experience (user_id, sort_order);

-- ---------------------------------------------------------------------------
-- business_cards
-- ---------------------------------------------------------------------------
create table if not exists public.business_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  template_id text not null,
  name text not null,
  design_data jsonb not null default '{}'::jsonb,
  preview_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_business_cards_updated_at on public.business_cards;
create trigger trg_business_cards_updated_at
  before update on public.business_cards
  for each row execute function public.set_updated_at();

create index if not exists idx_business_cards_user_id on public.business_cards (user_id);

-- ---------------------------------------------------------------------------
-- qr_codes
-- ---------------------------------------------------------------------------
create table if not exists public.qr_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  logo_url text,
  style text not null default 'standard' check (style in ('standard', 'branded')),
  color text not null default '#0a1230',
  error_correction text not null default 'M' check (error_correction in ('L', 'M', 'Q', 'H')),
  download_count int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_qr_codes_user_id on public.qr_codes (user_id);

-- ---------------------------------------------------------------------------
-- analytics_events
-- ---------------------------------------------------------------------------
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_type text not null check (event_type in
    ('profile_view', 'qr_scan', 'phone_click', 'email_click', 'whatsapp_click',
     'website_click', 'social_click', 'save_contact')),
  source text,
  created_at timestamptz not null default now()
);

create index if not exists idx_analytics_events_user_id on public.analytics_events (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- profile_reports (section 42 — abuse reporting, admin-review ready)
-- ---------------------------------------------------------------------------
create table if not exists public.profile_reports (
  id uuid primary key default gen_random_uuid(),
  reported_user_id uuid not null references public.profiles (id) on delete cascade,
  reporter_id uuid references auth.users (id) on delete set null,
  reason text not null check (reason in ('spam', 'fake_profile', 'inappropriate', 'impersonation', 'other')),
  details text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.social_links enable row level security;
alter table public.portfolio enable row level security;
alter table public.experience enable row level security;
alter table public.business_cards enable row level security;
alter table public.qr_codes enable row level security;
alter table public.analytics_events enable row level security;
alter table public.profile_reports enable row level security;

-- profiles: owner can do everything on their own row; anyone can read a
-- published profile's public-safe columns via the `public_profiles` view below.
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_select_published" on public.profiles
  for select using (visibility = 'published');
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_delete_own" on public.profiles
  for delete using (auth.uid() = id);

-- generic owner-only CRUD policy applied to the rest of the per-user tables
do $$
declare
  t text;
begin
  foreach t in array array['businesses', 'social_links', 'portfolio', 'experience', 'business_cards', 'qr_codes', 'analytics_events']
  loop
    execute format('create policy "%1$s_select_own" on public.%1$s for select using (auth.uid() = user_id)', t);
    execute format('create policy "%1$s_insert_own" on public.%1$s for insert with check (auth.uid() = user_id)', t);
    execute format('create policy "%1$s_update_own" on public.%1$s for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
    execute format('create policy "%1$s_delete_own" on public.%1$s for delete using (auth.uid() = user_id)', t);
  end loop;
end $$;

-- Public (anonymous) read access to child tables belonging to a published profile.
create policy "businesses_select_public" on public.businesses
  for select using (
    exists (select 1 from public.profiles p where p.id = user_id and p.visibility = 'published')
  );
create policy "social_links_select_public" on public.social_links
  for select using (
    is_active and exists (select 1 from public.profiles p where p.id = user_id and p.visibility = 'published')
  );
create policy "portfolio_select_public" on public.portfolio
  for select using (
    exists (select 1 from public.profiles p where p.id = user_id and p.visibility = 'published')
  );
create policy "experience_select_public" on public.experience
  for select using (
    exists (select 1 from public.profiles p where p.id = user_id and p.visibility = 'published')
  );

-- Analytics: allow anonymous inserts (visitor-triggered events) but never
-- allow anonymous reads.
create policy "analytics_events_insert_public" on public.analytics_events
  for insert with check (
    exists (select 1 from public.profiles p where p.id = user_id and p.visibility = 'published')
  );

-- Reports: any authenticated or anonymous visitor may file a report; only the
-- reporter can see their own submission (admin review happens via service role).
create policy "profile_reports_insert_any" on public.profile_reports
  for insert with check (true);
create policy "profile_reports_select_own" on public.profile_reports
  for select using (auth.uid() = reporter_id);

-- ---------------------------------------------------------------------------
-- Public profile view — exposes only fields safe for anonymous visitors,
-- respecting per-field privacy toggles. Never exposes DOB, auth data, or
-- internal flags.
-- ---------------------------------------------------------------------------
create or replace view public.public_profiles as
select
  p.id,
  p.username,
  p.full_name,
  p.professional_name,
  p.professional_title,
  p.bio,
  case when p.show_email then p.email else null end as email,
  case when p.show_phone then p.phone else null end as phone,
  case when p.show_phone then p.whatsapp else null end as whatsapp,
  p.website,
  case when p.show_location then p.location else null end as location,
  p.profile_photo_url,
  p.cover_photo_url,
  p.search_engine_visible
from public.profiles p
where p.visibility = 'published';

grant select on public.public_profiles to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage buckets
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('profile-images', 'profile-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('cover-images', 'cover-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('business-logos', 'business-logos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('portfolio-images', 'portfolio-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('card-assets', 'card-assets', true, 10485760, array['image/jpeg', 'image/png', 'application/pdf']),
  ('qr-assets', 'qr-assets', true, 5242880, array['image/png', 'image/svg+xml', 'application/pdf'])
on conflict (id) do nothing;

-- Each user may only write inside a folder named after their own uid
-- (path convention: <bucket>/<user_id>/<file>). Anyone can read (public URLs).
do $$
declare
  b text;
begin
  foreach b in array array['profile-images', 'cover-images', 'business-logos', 'portfolio-images', 'card-assets', 'qr-assets']
  loop
    execute format(
      'create policy "%1$s_public_read" on storage.objects for select using (bucket_id = %2$L)',
      b, b
    );
    execute format(
      'create policy "%1$s_owner_write" on storage.objects for insert with check (bucket_id = %2$L and (storage.foldername(name))[1] = auth.uid()::text)',
      b, b
    );
    execute format(
      'create policy "%1$s_owner_update" on storage.objects for update using (bucket_id = %2$L and (storage.foldername(name))[1] = auth.uid()::text)',
      b, b
    );
    execute format(
      'create policy "%1$s_owner_delete" on storage.objects for delete using (bucket_id = %2$L and (storage.foldername(name))[1] = auth.uid()::text)',
      b, b
    );
  end loop;
end $$;
