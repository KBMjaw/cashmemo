-- Addresses Supabase security-advisor findings surfaced after 0001/0002 were
-- applied. Purely hardening — no behavior change for the app.

-- public_profiles: run with the *querying* role's permissions (Postgres 15+
-- feature) instead of the view owner's. The view's own
-- `where visibility = 'published'` clause already does the real filtering,
-- and the underlying profiles_select_published RLS policy is open to anon
-- anyway, so this is a no-op for behavior and closes the advisor's
-- ERROR-level "Security Definer View" finding.
alter view public.public_profiles set (security_invoker = on);

-- Pin search_path on trigger functions so they can't be hijacked by a role
-- with a different search_path.
alter function public.enforce_username_rules() set search_path = public;
alter function public.set_updated_at() set search_path = public;

-- handle_new_user is a trigger function (security definer, only valid when
-- invoked by the auth.users trigger — it references the implicit `new` row
-- and errors if called any other way), but PostgREST still exposes every
-- public-schema function as an RPC endpoint by default. Revoke direct
-- execute access for defense in depth.
revoke execute on function public.handle_new_user() from anon, authenticated;

-- reserved_usernames is a static lookup table read by the username-
-- validation trigger; it must never be writable by anon/authenticated
-- clients (it had no RLS policies at all until this migration).
alter table public.reserved_usernames enable row level security;

create policy "reserved_usernames_select_any" on public.reserved_usernames
  for select using (true);
-- No insert/update/delete policies: only the service role (which bypasses
-- RLS) can modify this table.
