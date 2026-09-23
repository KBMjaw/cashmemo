-- Bug fix, caught by live RLS/RPC testing (not just code review): auth.users
-- .email is `character varying(255)`, not `text`, so RETURN QUERY into a
-- `text`-typed table column failed at call time with "structure of query
-- does not match function result type". Cast explicitly.
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
    u.email::text,
    p.phone,
    p.role,
    p.account_status,
    p.visibility,
    u.created_at,
    u.last_sign_in_at,
    u.email_confirmed_at,
    (u.banned_until is not null and u.banned_until > now()) as is_banned,
    (u.raw_app_meta_data ->> 'provider')::text as auth_provider
  from public.profiles p
  join auth.users u on u.id = p.id
  order by u.created_at desc;
end;
$$;

revoke all on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;
