-- =============================================================================
-- Fix: Admin Users RLS Policy for Auth Context
-- =============================================================================
-- Issue: Restaurant auth context was unnecessarily checking admin_users table
-- Solution: Removed the admin check from restaurant auth context entirely
--
-- Since admins and restaurants have completely separate tables and auth flows,
-- the check was redundant. If a user has no restaurant record, they're simply
-- not a restaurant user - no need to check if they're an admin.
--
-- This migration now only needs to protect the admin_users table from
-- unauthorized access, with the proxy.ts middleware handling admin routing.

-- Drop old problematic policies FIRST (before dropping their functions)
drop policy if exists admin_users_admin_all on public.admin_users;
drop policy if exists admin_users_select_self on public.admin_users;
drop policy if exists admin_users_manage_admin_only on public.admin_users;
drop policy if exists admin_users_admin_manage on public.admin_users;
drop policy if exists admin_users_admin_only on public.admin_users;

-- Drop the old functions (now safe after dropping dependent policies)
drop function if exists is_user_admin(uuid);
drop function if exists public.is_admin_user(uuid);

-- Create a simpler, non-recursive function for admin checks (used by proxy.ts)
-- This bypasses RLS to avoid circular checks
create function public.is_admin_user(user_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = $1
      and is_active = true
  );
$$;

-- Simple policy: Only actual admins can access admin_users table
-- Uses the security-definer function to avoid recursion
create policy admin_users_admin_only
on public.admin_users
for all
to authenticated
using (public.is_admin_user(auth.uid()))
with check (public.is_admin_user(auth.uid()));



