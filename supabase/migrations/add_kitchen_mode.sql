-- Adds Kitchen Mode configuration to restaurants.
-- Minimal schema addition to support a kitchen-only view without extra accounts.

alter table public.restaurants
  add column if not exists kitchen_enabled boolean not null default false,
  add column if not exists kitchen_pin_hash text;

