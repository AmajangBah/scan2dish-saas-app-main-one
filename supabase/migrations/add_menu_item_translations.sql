-- Add per-locale translations for menu item name/description.
-- This enables menu-only multilingual UX without duplicating routes.

alter table public.menu_items
  add column if not exists name_translations jsonb not null default '{}'::jsonb;

alter table public.menu_items
  add column if not exists description_translations jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'menu_items_name_translations_is_object'
  ) then
    alter table public.menu_items
      add constraint menu_items_name_translations_is_object
      check (jsonb_typeof(name_translations) = 'object');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'menu_items_description_translations_is_object'
  ) then
    alter table public.menu_items
      add constraint menu_items_description_translations_is_object
      check (jsonb_typeof(description_translations) = 'object');
  end if;
end $$;

