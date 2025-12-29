# Quick Setup Guide: Admin System

This guide will get your admin system up and running in 5 minutes.

## Prerequisites

- Supabase project configured
- Database connection ready
- Admin email address

## Step 1: Run Database Migration

1. Open Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy the contents of `/supabase/migrations/admin_system.sql`
4. Paste and click "Run"
5. Wait for success message (should take 5-10 seconds)

**Verify:**
```sql
-- Should return true
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'admin_users'
);
```

## Step 2: Create Admin User

### Option A: Via Supabase Dashboard (Recommended)

1. **Create Auth User:**
   - Go to Authentication → Users
   - Click "Add User"
   - Enter email: `admin@yourdomain.com`
   - Enter password (strong password!)
   - Click "Create User"
   - **Copy the user ID** (looks like: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

2. **Create Admin Record:**
   - Go to Table Editor → `admin_users`
   - Click "Insert" → "Insert Row"
   - Fill in:
     - `user_id`: Paste the user ID from step 1
     - `email`: Same email as auth user
     - `full_name`: Your name
     - `role`: Select `super_admin`
     - `is_active`: Check the box (true)
   - Click "Save"

### Option B: Via SQL

```sql
-- Step 1: Create auth user (replace with your details)
-- This is done in Supabase Auth UI, then get the ID

-- Step 2: Insert admin record
INSERT INTO public.admin_users (
  user_id,
  email,
  full_name,
  role,
  is_active
) VALUES (
  'YOUR-USER-ID-FROM-AUTH',  -- Replace this!
  'admin@yourdomain.com',
  'Your Name',
  'super_admin',
  true
);
```

## Step 3: Test Admin Access

1. **Deploy your app** (or run locally: `npm run dev`)

2. **Login:**
   - Go to `/login`
   - Use admin email and password
   - Should redirect to `/admin` (not `/dashboard`)

3. **Verify Admin Panel:**
   - See admin sidebar with shield icon
   - See "Dashboard", "Restaurants", "Payments", etc.
   - Check dashboard loads (may show 0s if no data yet)

## Step 4: Test Enforcement

Let's verify the enforcement system works:

1. **Find a test restaurant:**
   - Go to `/admin/restaurants`
   - Pick any restaurant (or create one)

2. **Disable the menu:**
   - Click the red "disable" button
   - Enter reason: "Testing enforcement"
   - Confirm

3. **Test customer view:**
   - Get a table QR for that restaurant
   - Scan it (or visit `/menu/[tableId]`)
   - Should see: "Menus Currently Unavailable"
   - ✅ Enforcement working!

4. **Re-enable:**
   - Go back to admin
   - Click green "enable" button
   - Customer view should work again

## Step 5: Record Test Payment

1. **Go to `/admin/payments`**

2. **Click "Record Payment"**

3. **Fill in:**
   - Restaurant: Select any
   - Amount: 50.00
   - Method: Cash
   - Reference: TEST-001
   - Notes: Test payment

4. **Submit**

5. **Verify:**
   - Payment appears in list
   - Restaurant balance updated
   - Activity log shows "Payment Recorded"

## Common Issues

### "Unauthorized" when accessing /admin

**Fix:**
```sql
-- Verify admin user exists and is active
SELECT * FROM public.admin_users WHERE email = 'your-email@domain.com';

-- Should return 1 row with is_active = true
-- If not, check user_id matches auth.users.id
```

### Restaurant menu not blocked

**Fix:**
1. Clear browser cache
2. Check `restaurants.menu_enabled` in database:
   ```sql
   SELECT id, name, menu_enabled FROM restaurants;
   ```
3. Ensure you're testing in a fresh browser tab

### Dashboard shows all zeros

**This is normal if:**
- No restaurants created yet
- No orders placed yet

**Fix:**
```sql
-- Manually refresh metrics
REFRESH MATERIALIZED VIEW admin_dashboard_metrics;
```

### Can't create admin user

**Check:**
1. Auth user created first (in Supabase Auth)
2. `user_id` exactly matches (no typos)
3. Email matches between auth and admin_users
4. Migration ran successfully

## Next Steps

### Add More Admins

```sql
-- For day-to-day admin
INSERT INTO public.admin_users (user_id, email, full_name, role, is_active)
VALUES ('user-uuid', 'admin2@domain.com', 'Jane Smith', 'admin', true);

-- For support/read-only
INSERT INTO public.admin_users (user_id, email, full_name, role, is_active)
VALUES ('user-uuid', 'support@domain.com', 'Support Team', 'support', true);
```

### Configure Auto-Refresh (Optional)

Set up a cron job to refresh dashboard metrics:

**Using Supabase Edge Functions:**
```typescript
// functions/refresh-metrics/index.ts
import { createClient } from '@supabase/supabase-js'

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_KEY')!
  )
  
  await supabase.rpc('refresh_admin_dashboard_metrics')
  
  return new Response('Metrics refreshed', { status: 200 })
})
```

**Schedule:** Run every 15 minutes via cron

### Enable Email Notifications (Future)

When ready, add:
- Email on menu disabled
- Weekly commission summary
- Payment received confirmation

## Security Checklist

- [ ] Strong admin passwords (12+ characters)
- [ ] 2FA enabled for admin users (Supabase Auth)
- [ ] Limited super_admin users (2-3 max)
- [ ] Regular activity log reviews
- [ ] Enforcement reasons always documented
- [ ] Admin credentials not shared

## You're All Set! 🎉

Your admin system is now live. You can:

- ✅ Monitor all restaurants
- ✅ Control menu availability
- ✅ Track commission
- ✅ Record payments
- ✅ View all orders
- ✅ Audit activity

**Pro Tips:**
1. Review activity logs weekly
2. Set up payment reminders
3. Document enforcement decisions
4. Communicate with restaurant owners
5. Keep admin credentials secure

Need help? Check `ADMIN_SYSTEM.md` for detailed documentation.
