## Quick Deployment Checklist for Bug Fixes

### Critical: Apply RLS Policy Fix to Supabase

⚠️ **REQUIRED STEP** - This must be done before the app will work properly

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the SQL from `supabase/migrations/fix_admin_users_rls.sql`
4. Execute the migration
5. Wait for confirmation (should complete in seconds)

### Code Changes Applied ✅

- [x] `lib/auth/restaurant.ts` - Error handling for admin_users query
- [x] `app/actions/menu.ts` - Better error handling for menu creation
- [x] `app/actions/tables.ts` - Better error handling for table creation
- [x] `supabase/migrations/fix_admin_users_rls.sql` - RLS policy fix

### Testing Checklist

After deploying, test these scenarios:

1. **Authentication Flow**

   - [ ] Sign in as restaurant owner
   - [ ] Check browser console (should NOT show 406 errors)
   - [ ] Should see debug logs with `[Auth]` prefix

2. **Dashboard Navigation**

   - [ ] Log in successfully
   - [ ] Click "Menu" in sidebar → should stay logged in
   - [ ] Click "Tables" in sidebar → should stay logged in
   - [ ] Click "Orders" in sidebar → should stay logged in
   - [ ] Click other dashboard links → should stay logged in

3. **Create Menu Item**

   - [ ] Go to Dashboard → Menu
   - [ ] Click "Add Menu Item"
   - [ ] Fill in form and submit
   - [ ] Should see success message
   - [ ] Check console for `[Menu]` logs (should show success)

4. **Create Table**

   - [ ] Go to Dashboard → Tables
   - [ ] Click "Add Table"
   - [ ] Fill in form and submit
   - [ ] Should see success message
   - [ ] Check console for `[Table]` logs (should show success)

5. **Error Handling**
   - [ ] If auth fails, should see helpful error message
   - [ ] If permission denied, should see "Permission denied" message
   - [ ] App should NOT crash on errors

### Deployment Steps

1. **Pull the changes** to your deployment environment
2. **Run the migration** (copy SQL from `fix_admin_users_rls.sql` and execute in Supabase)
3. **Rebuild and deploy** your Next.js app:
   ```bash
   npm run build
   npm start
   ```
4. **Monitor logs** for any new issues
5. **Test all scenarios** from the checklist above

### Rollback Plan (If Needed)

If you need to revert the RLS policy changes:

```sql
-- Run this to restore original policy (less secure)
drop policy if exists admin_users_select_self on public.admin_users;
drop policy if exists admin_users_manage_admin_only on public.admin_users;

create policy admin_users_admin_all
on public.admin_users
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));
```

### Expected Error Messages (Normal)

These messages are expected and OK:

- `[Auth] Admin check blocked/error (expected for non-admin): 406` - Normal for restaurant owners
- `[Auth] Restaurant query error:` - Only appears if user has no restaurant

### Suspicious Error Messages

These indicate a real problem:

- `[Menu] Unexpected error:` - Database error, check Supabase logs
- `[Table] Unexpected error:` - Database error, check Supabase logs
- App crashes without error message - Session issue, check auth cookies

### Support & Debugging

If issues persist after deployment:

1. Clear browser cookies and cache
2. Try in an incognito/private window
3. Check Supabase Activity Logs for policy violations
4. Check Next.js server logs
5. Verify environment variables are set correctly
