-- Allow customers (anon) to read active discounts for menu display/pricing.
-- This is safe because discounts are promotional and intended to be public.
--
-- IMPORTANT:
-- - This enables SELECT only.
-- - Owners remain the only ones who can write discounts (existing policies).

drop policy if exists discounts_public_read_active on public.discounts;
create policy discounts_public_read_active
on public.discounts
for select
to anon, authenticated
using (
  is_active = true
  and (start_time is null or start_time <= now())
  and (end_time is null or end_time >= now())
);

