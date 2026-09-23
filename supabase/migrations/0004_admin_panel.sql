-- Admin panel: role-based access, audit log, and analytics extensions.
-- Purely additive — no existing table, column, policy, or view is altered
-- or dropped. Existing app behavior (auth, public profiles, Quick QR,
-- business cards) is unaffected.

-- ---------------------------------------------------------------------------
-- profiles: role + account status
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists role text not null default 'user'
    check (role in ('user', 'admin', 'super_admin')),
  add column if not exists account_status text not null default 'active'
    check (account_status in ('active', 'disabled'));

create index if not exists idx_profiles_role on public.profiles (role) where role <> 'user';

-- ---------------------------------------------------------------------------
-- is_admin(): SECURITY DEFINER helper so RLS policies can check the caller's
-- role without recursively re-evaluating profiles' own RLS (the standard
-- Supabase pattern for role-gated policies).
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'super_admin')
  );
$$;

revoke execute on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;

-- Admins get read access to every table the admin panel needs, on top of
-- the existing owner-only policies. Never grants write access directly —
-- state changes go through the audited RPCs below.
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'businesses', 'social_links', 'portfolio', 'experience',
    'business_cards', 'qr_codes', 'analytics_events', 'short_links'
  ]
  loop
    execute format(
      'create policy "%1$s_select_admin" on public.%1$s for select using (public.is_admin())',
      t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- admin_user_directory: the only place admin/email/last-sign-in data is
-- readable from. Reads auth.users (never exposed via PostgREST directly),
-- gated by its own is_admin() filter baked into the view — mirrors the
-- existing public_profiles pattern. Exposes no password or token data.
-- ---------------------------------------------------------------------------
create or replace view public.admin_user_directory as
select
  p.id,
  p.username,
  p.full_name,
  u.email,
  p.phone,
  p.role,
  p.account_status,
  p.visibility,
  u.created_at,
  u.last_sign_in_at,
  u.email_confirmed_at,
  (u.banned_until is not null and u.banned_until > now()) as is_banned,
  (u.raw_app_meta_data ->> 'provider') as auth_provider
from public.profiles p
join auth.users u on u.id = p.id
where public.is_admin();

revoke all on public.admin_user_directory from anon, authenticated;
grant select on public.admin_user_directory to authenticated;

-- ---------------------------------------------------------------------------
-- admin_audit_log
-- ---------------------------------------------------------------------------
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles (id) on delete cascade,
  action text not null,
  target_type text,
  target_id uuid,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_audit_log_created_at on public.admin_audit_log (created_at desc);
create index if not exists idx_admin_audit_log_admin_id on public.admin_audit_log (admin_id, created_at desc);

alter table public.admin_audit_log enable row level security;

create policy "admin_audit_log_select_admin" on public.admin_audit_log
  for select using (public.is_admin());

-- Logging goes through this RPC (not a direct table insert) so every entry
-- is verified server-side and always attributed to the real caller.
create or replace function public.admin_log_action(
  p_action text,
  p_target_type text default null,
  p_target_id uuid default null,
  p_meta jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;
  insert into public.admin_audit_log (admin_id, action, target_type, target_id, meta)
  values (auth.uid(), p_action, p_target_type, p_target_id, p_meta);
end;
$$;

revoke execute on function public.admin_log_action(text, text, uuid, jsonb) from anon;
grant execute on function public.admin_log_action(text, text, uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- admin_set_account_status: enable/disable a user account. Bans at the
-- Supabase Auth level (auth.users.banned_until) so GoTrue itself rejects
-- login/refresh — not just a UI-side flag. Never touches password hashes.
-- ---------------------------------------------------------------------------
create or replace function public.admin_set_account_status(p_user_id uuid, p_disabled boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'You cannot disable your own account';
  end if;

  update auth.users
  set banned_until = case when p_disabled then timestamptz '2099-01-01' else null end
  where id = p_user_id;

  update public.profiles
  set account_status = case when p_disabled then 'disabled' else 'active' end
  where id = p_user_id;

  insert into public.admin_audit_log (admin_id, action, target_type, target_id)
  values (auth.uid(), case when p_disabled then 'USER_DISABLED' else 'USER_ENABLED' end, 'user', p_user_id);
end;
$$;

revoke execute on function public.admin_set_account_status(uuid, boolean) from anon;
grant execute on function public.admin_set_account_status(uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- admin_set_profile_visibility: publish/unpublish a profile from the admin
-- panel, audited the same way as the dashboard's own visibility toggle.
-- ---------------------------------------------------------------------------
create or replace function public.admin_set_profile_visibility(p_user_id uuid, p_visibility text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;
  if p_visibility not in ('draft', 'published', 'unpublished') then
    raise exception 'Invalid visibility';
  end if;

  update public.profiles set visibility = p_visibility where id = p_user_id;

  insert into public.admin_audit_log (admin_id, action, target_type, target_id, meta)
  values (auth.uid(), 'PROFILE_VISIBILITY_CHANGED', 'profile', p_user_id, jsonb_build_object('visibility', p_visibility));
end;
$$;

revoke execute on function public.admin_set_profile_visibility(uuid, text) from anon;
grant execute on function public.admin_set_profile_visibility(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- analytics_events: extend with nullable context columns. Existing columns,
-- constraint, policies and app code (trackEvent/useAnalyticsSummary) are
-- untouched — every new column is optional.
-- ---------------------------------------------------------------------------
alter table public.analytics_events
  add column if not exists qr_id uuid references public.short_links (id) on delete set null,
  add column if not exists business_id uuid references public.businesses (id) on delete set null,
  add column if not exists device_type text,
  add column if not exists referrer text,
  add column if not exists country text,
  add column if not exists region text;

create index if not exists idx_analytics_events_type_created on public.analytics_events (event_type, created_at desc);
create index if not exists idx_analytics_events_qr_id on public.analytics_events (qr_id) where qr_id is not null;

-- ---------------------------------------------------------------------------
-- short_links: scan/redirect tracking, extended safely (no existing column
-- touched). Increment goes through an RPC so anonymous visitors never need
-- direct UPDATE access to the table.
-- ---------------------------------------------------------------------------
alter table public.short_links
  add column if not exists scan_count integer not null default 0;

create index if not exists idx_short_links_created_at on public.short_links (created_at desc);

create or replace function public.record_short_link_scan(p_code text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.short_links set scan_count = scan_count + 1 where code = p_code;
$$;

grant execute on function public.record_short_link_scan(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- site_events: website-level analytics (page views/sessions), intentionally
-- separate from analytics_events (which is per-profile). Anonymous, insert-
-- only from the client; never links to a specific user or IP address.
-- ---------------------------------------------------------------------------
create table if not exists public.site_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  event_type text not null default 'page_view' check (event_type in ('page_view')),
  path text not null,
  referrer text,
  device_type text,
  browser text,
  country text,
  region text,
  created_at timestamptz not null default now()
);

create index if not exists idx_site_events_created_at on public.site_events (created_at desc);
create index if not exists idx_site_events_session_id on public.site_events (session_id);

alter table public.site_events enable row level security;

create policy "site_events_insert_any" on public.site_events
  for insert with check (true);

create policy "site_events_select_admin" on public.site_events
  for select using (public.is_admin());
