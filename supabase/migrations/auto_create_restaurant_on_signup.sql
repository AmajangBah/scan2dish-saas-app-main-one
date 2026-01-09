-- =============================================================================
-- Auto-Create Restaurant on User Signup
-- =============================================================================
-- When a new user is created in auth.users, automatically create a corresponding
-- restaurant record. This ensures the invariant: 1 user = 1 restaurant.
-- This prevents orphaned users without restaurants and eliminates redirect loops.

-- Create the trigger function for restaurant creation
create or replace function public.auto_create_restaurant_on_signup()
returns trigger as $$
begin
  -- Extract business name from user metadata if available, otherwise use email
  insert into public.restaurants (
    user_id,
    name,
    phone,
    brand_color,
    currency
  ) values (
    new.id,
    coalesce(new.raw_user_meta_data->>'business_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'phone', null),
    '#C84501', -- Default brand color
    'GMD' -- Default currency
  );
  
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Create the trigger on auth.users
drop trigger if exists trg_auto_create_restaurant on auth.users;

create trigger trg_auto_create_restaurant
after insert on auth.users
for each row execute function public.auto_create_restaurant_on_signup();

-- =============================================================================
-- Auto-Create Onboarding Progress when Restaurant is Created
-- =============================================================================
-- Automatically create an onboarding_progress record when a restaurant is created,
-- ensuring every restaurant has an onboarding record to track progress.

create or replace function public.auto_create_onboarding_on_restaurant()
returns trigger as $$
begin
  insert into public.onboarding_progress (
    restaurant_id,
    current_step,
    completed,
    steps_completed,
    skipped
  ) values (
    new.id,
    1, -- Start at step 1
    false,
    '[]'::jsonb,
    false
  );
  
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Create the trigger on restaurants
drop trigger if exists trg_auto_create_onboarding on public.restaurants;

create trigger trg_auto_create_onboarding
after insert on public.restaurants
for each row execute function public.auto_create_onboarding_on_restaurant();

