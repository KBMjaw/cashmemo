-- Hardening pass on 0004, addressing Supabase security-advisor findings:
--  1. `admin_user_directory` was a view over auth.users (ERROR: security
--     definer view / exposed auth.users) — replaced with a SECURITY DEFINER
--     *function* that performs the same is_admin() check internally and
--     raises an exception for non-admins, matching the RPC pattern used by
--     the rest of the admin functions.
--  2. `revoke ... from anon` alone doesn't remove the implicit PUBLIC grant
--     Postgres adds on function creation, so admin-only RPCs were still
--     technically anon-executable (they'd just fail their internal
--     is_admin() check) — revoke from PUBLIC explicitly for defense in
--     depth, here and on the pre-existing handle_new_user().
-- No existing table, column, or app-facing behavior changes.

drop view if exists public.admin_user_directory;

create or replace function public.admin_list_users()
returns table (
  id uuid,
  username text,
  full_name text,
  email text,
  phone text,
  role text,
  account_status text,
  visibility text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed_at timestamptz,
  is_banned boolean,
  auth_provider text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  return query
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
  order by u.created_at desc;
end;
$$;

revoke all on function public.admin_list_users() from public;
grant execute on function public.admin_list_users() to authenticated;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

revoke all on function public.admin_log_action(text, text, uuid, jsonb) from public;
grant execute on function public.admin_log_action(text, text, uuid, jsonb) to authenticated;

revoke all on function public.admin_set_account_status(uuid, boolean) from public;
grant execute on function public.admin_set_account_status(uuid, boolean) to authenticated;

revoke all on function public.admin_set_profile_visibility(uuid, text) from public;
grant execute on function public.admin_set_profile_visibility(uuid, text) to authenticated;

-- record_short_link_scan is intentionally anon + authenticated (Quick QR
-- redirects happen without a session) — re-affirm explicitly rather than
-- relying on the implicit PUBLIC grant.
revoke all on function public.record_short_link_scan(text) from public;
grant execute on function public.record_short_link_scan(text) to anon, authenticated;

-- Pre-existing trigger-only function: tighten the same way (already
-- unusable directly since it references the implicit trigger `new` row,
-- this closes the advisor finding for defense in depth).
revoke all on function public.handle_new_user() from public;
