-- Covers the analytics_events.business_id foreign key added in 0004
-- (flagged by the performance advisor as unindexed).
create index if not exists idx_analytics_events_business_id
  on public.analytics_events (business_id)
  where business_id is not null;
