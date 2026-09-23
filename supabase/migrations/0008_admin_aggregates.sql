-- Server-side aggregation for the admin dashboard, so the browser never
-- pulls raw event/profile rows just to count or bucket them — every
-- dashboard number and chart series is computed inside Postgres and
-- returned as a small, already-aggregated payload. Admin-only (is_admin()).

create or replace function public._admin_range_start(p_range text)
returns timestamptz
language sql
immutable
set search_path = public
as $$
  select case p_range
    when 'today' then date_trunc('day', now())
    when '7d' then now() - interval '7 days'
    when '30d' then now() - interval '30 days'
    when '90d' then now() - interval '90 days'
    else null
  end;
$$;

-- ---------------------------------------------------------------------------
-- admin_dashboard_stats: the 8 summary cards in one round trip.
-- ---------------------------------------------------------------------------
create or replace function public.admin_dashboard_stats(p_range text default '30d')
returns table (
  total_users bigint,
  new_users_today bigint,
  new_users_month bigint,
  total_public_profiles bigint,
  total_profile_views bigint,
  total_qr_scans bigint,
  total_contact_actions bigint,
  total_business_cards bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  range_start timestamptz := public._admin_range_start(p_range);
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  return query
  select
    (select count(*) from public.profiles),
    (select count(*) from public.profiles where created_at >= date_trunc('day', now())),
    (select count(*) from public.profiles where created_at >= date_trunc('month', now())),
    (select count(*) from public.profiles where visibility = 'published'),
    (select count(*) from public.analytics_events
      where event_type = 'profile_view' and (range_start is null or created_at >= range_start)),
    (select count(*) from public.analytics_events
      where event_type = 'qr_scan' and (range_start is null or created_at >= range_start))
      + (select count(*) from public.short_links where scan_count > 0), -- Quick QR redirects, additive to profile QR scans
    (select count(*) from public.analytics_events
      where event_type in ('phone_click', 'email_click', 'whatsapp_click', 'website_click', 'social_click', 'save_contact')
      and (range_start is null or created_at >= range_start)),
    (select count(*) from public.business_cards);
end;
$$;

revoke execute on function public.admin_dashboard_stats(text) from public, anon;
grant execute on function public.admin_dashboard_stats(text) to authenticated;

-- ---------------------------------------------------------------------------
-- admin_timeseries: one day-bucketed series for a chart. p_metric is a fixed
-- literal (never interpolated into SQL), so this stays injection-safe.
-- ---------------------------------------------------------------------------
create or replace function public.admin_timeseries(p_metric text, p_range text default '30d')
returns table (bucket date, value bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  range_start timestamptz := coalesce(public._admin_range_start(p_range), now() - interval '90 days');
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  if p_metric = 'visitors' then
    return query
    select d::date, count(distinct s.session_id)
    from generate_series(date_trunc('day', range_start), date_trunc('day', now()), interval '1 day') d
    left join public.site_events s on date_trunc('day', s.created_at) = d
    group by d order by d;

  elsif p_metric = 'profile_views' then
    return query
    select d::date, count(a.id)
    from generate_series(date_trunc('day', range_start), date_trunc('day', now()), interval '1 day') d
    left join public.analytics_events a
      on date_trunc('day', a.created_at) = d and a.event_type = 'profile_view'
    group by d order by d;

  elsif p_metric = 'qr_scans' then
    return query
    select d::date, count(a.id)
    from generate_series(date_trunc('day', range_start), date_trunc('day', now()), interval '1 day') d
    left join public.analytics_events a
      on date_trunc('day', a.created_at) = d and a.event_type = 'qr_scan'
    group by d order by d;

  elsif p_metric = 'new_users' then
    return query
    select d::date, count(p.id)
    from generate_series(date_trunc('day', range_start), date_trunc('day', now()), interval '1 day') d
    left join public.profiles p on date_trunc('day', p.created_at) = d
    group by d order by d;

  else
    raise exception 'Unknown metric: %', p_metric;
  end if;
end;
$$;

revoke execute on function public.admin_timeseries(text, text) from public, anon;
grant execute on function public.admin_timeseries(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- admin_card_template_usage: template usage counts for /admin/cards.
-- ---------------------------------------------------------------------------
create or replace function public.admin_card_template_usage()
returns table (template_id text, card_count bigint)
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
  select bc.template_id, count(*) from public.business_cards bc
  group by bc.template_id
  order by count(*) desc;
end;
$$;

revoke execute on function public.admin_card_template_usage() from public, anon;
grant execute on function public.admin_card_template_usage() to authenticated;

-- Lock down the internal helper the same way as the public-facing functions.
revoke execute on function public._admin_range_start(text) from public, anon, authenticated;
