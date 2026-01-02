-- Fix: REFRESH MATERIALIZED VIEW CONCURRENTLY cannot run inside a transaction.
-- Supabase RPC functions run inside a transaction, so the previous implementation
-- could fail and leave admin_dashboard_metrics stale.

create or replace function public.refresh_admin_dashboard_metrics()
returns void
language plpgsql
security definer
as $$
begin
  refresh materialized view public.admin_dashboard_metrics;
end;
$$;

grant execute on function public.refresh_admin_dashboard_metrics() to authenticated;

