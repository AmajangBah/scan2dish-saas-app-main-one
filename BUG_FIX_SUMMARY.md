## Issue Resolution: Authentication & RLS Policy Fixes

### Problems Identified and Fixed

#### 1. **406 Error on `admin_users` Query (ROOT CAUSE)**

**Error:** `GET https://deyklihffiiygiyditkk.supabase.co/rest/v1/admin_users?select=id%2Cis_active&user_id=eq.... 406 (Not Acceptable)`

**Root Cause:**

- The `admin_users` table had an RLS policy that only allowed admins to access it
- Restaurant owners cannot read from the `admin_users` table
- The auth context code in `lib/auth/restaurant.ts` tried to query this table without error handling
- When the RLS policy blocked the request (406 error), the code didn't handle it gracefully

**Solution Implemented:**

1. **Updated `lib/auth/restaurant.ts`** - Added try-catch and error handling to the `isAdminUserId()` function:

   - Now gracefully handles 406 errors (RLS blocking)
   - Returns `false` (not admin) when access is denied
   - Logs debug info for troubleshooting

2. **Created RLS policy migration** - `supabase/migrations/fix_admin_users_rls.sql`:
   - Added policy allowing authenticated users to SELECT their own record from `admin_users`
   - This allows the auth check to work without circular dependency
   - Maintains security: users can only check themselves, not others

---

#### 2. **Session Loss on Sidebar Navigation**

**Problem:** Clicking sidebar links while logged in redirected back to login

**Root Cause:**

- The 406 error from `admin_users` query caused `getRestaurantAuthContext()` to fail silently
- The dashboard layout couldn't retrieve context, treating the user as unauthenticated
- Caused redirect loops

**Solution:**

- Better error handling and logging in `getRestaurantAuthContext()`
- Now distinguishes between "no restaurant found" vs "error occurred"
- Provides debug information for troubleshooting

---

#### 3. **Menu Item & Table Creation Failures**

**Problem:** Creating menu items or tables caused app crashes with permission errors

**Root Cause:**

- Auth failures weren't properly caught in server actions
- RLS errors weren't being properly identified or reported
- Unhandled exceptions caused app crashes

**Solution Implemented:**
Updated both `app/actions/menu.ts` and `app/actions/tables.ts`:

- Added explicit try-catch around `requireRestaurant()` auth checks
- Better error classification (RLS errors vs other errors)
- User-friendly error messages
- Detailed console logging with context tags `[Menu]` and `[Table]`

---

### Files Modified

1. **lib/auth/restaurant.ts**

   - Enhanced `isAdminUserId()` with error handling
   - Added error logging to `getRestaurantAuthContext()`
   - Added exception handling

2. **app/actions/menu.ts**

   - Wrapped auth check in try-catch
   - Added RLS error detection
   - Improved error messages

3. **app/actions/tables.ts**

   - Wrapped auth check in try-catch
   - Added RLS error detection
   - Improved error messages

4. **supabase/migrations/fix_admin_users_rls.sql** (NEW)
   - Replaced circular RLS policy with safer approach
   - Allows users to check their own admin status
   - Maintains admin-only management of admin users

---

### Next Steps

1. **Apply the RLS policy fix:**

   - Run the migration in your Supabase SQL editor:

   ```bash
   -- Run this in Supabase SQL editor
   drop policy if exists admin_users_admin_all on public.admin_users;
   drop policy if exists admin_users_select_self on public.admin_users;
   drop policy if exists admin_users_manage_admin_only on public.admin_users;

   create policy admin_users_select_self
   on public.admin_users
   for select
   to authenticated
   using (user_id = auth.uid());

   create policy admin_users_manage_admin_only
   on public.admin_users
   for all
   to authenticated
   using (
     exists (
       select 1
       from public.admin_users
       where user_id = auth.uid()
         and is_active = true
     )
   )
   with check (
     exists (
       select 1
       from public.admin_users
       where user_id = auth.uid()
         and is_active = true
     )
   );
   ```

2. **Test the fixes:**

   - Sign in as restaurant owner
   - Navigate through dashboard sidebar links
   - Create a new menu item
   - Create a new table
   - Check browser console for any errors (should now be handled gracefully)

3. **Monitor logs:**
   - Check browser console for `[Auth]`, `[Menu]`, and `[Table]` prefixed logs
   - These will provide detailed error information if issues persist

---

### Security Notes

- Restaurant owners can no longer access other users' admin status
- They can only verify their own non-admin status
- Actual admin user creation still requires proper admin credentials
- RLS policies remain restrictive by default
