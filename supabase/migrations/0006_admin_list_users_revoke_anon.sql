-- admin_list_users (added in 0005) was newly created and picked up
-- Supabase's default per-function EXECUTE grant to anon at creation time;
-- `revoke ... from public` in 0005 doesn't remove that direct grant.
-- Revoke it explicitly — the function already refuses non-admins
-- internally, this closes the advisor's exposure finding too.
revoke execute on function public.admin_list_users() from anon;
