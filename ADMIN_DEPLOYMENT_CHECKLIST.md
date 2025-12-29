# Admin System Deployment Checklist

Use this checklist to deploy the admin system to production.

## Pre-Deployment

### Code Review
- [ ] All admin files committed
- [ ] No hardcoded credentials
- [ ] Environment variables configured
- [ ] TypeScript compiles with no errors
- [ ] ESLint passes

### Testing
- [ ] Admin login works locally
- [ ] Restaurant enable/disable works
- [ ] Payment recording works
- [ ] Enforcement blocks customers
- [ ] Activity logs record actions
- [ ] Dashboard loads < 2 seconds

### Documentation
- [ ] Admin credentials documented (secure location)
- [ ] Deployment steps documented
- [ ] Rollback plan prepared
- [ ] Support contact information ready

## Database Migration

### Backup First
```sql
-- Create backup before migration
-- In Supabase: Settings → Database → Backups → Create backup
```

- [ ] Database backup created
- [ ] Backup verified and downloadable
- [ ] Backup timestamp noted: _______________

### Run Migration

- [ ] Navigate to Supabase SQL Editor
- [ ] Open `/supabase/migrations/admin_system.sql`
- [ ] Review migration (don't run yet!)
- [ ] Copy migration SQL
- [ ] Paste into SQL Editor
- [ ] Click "Run"
- [ ] Wait for success (5-10 seconds)
- [ ] Verify no errors

### Verify Migration
```sql
-- Check tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('admin_users', 'commission_payments', 'admin_activity_logs');
-- Should return 3 rows

-- Check new columns added
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'restaurants' 
AND column_name IN ('menu_enabled', 'enforcement_reason', 'total_commission_owed');
-- Should return 3 rows

-- Check RLS policies
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'admin_users';
-- Should return admin policies

-- Check functions created
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('is_admin', 'get_restaurant_status', 'record_commission_payment');
-- Should return 3 rows
```

- [ ] All tables created
- [ ] All columns added
- [ ] All policies created
- [ ] All functions created

## Admin User Creation

### Create Auth User

- [ ] Go to Supabase → Authentication → Users
- [ ] Click "Add User"
- [ ] Email: ___________________ (record this)
- [ ] Password: Strong password (12+ chars)
- [ ] User created successfully
- [ ] Copy user ID: ___________________

### Create Admin Record

```sql
-- Replace YOUR_USER_ID_HERE with actual user ID
INSERT INTO public.admin_users (
  user_id,
  email,
  full_name,
  role,
  is_active
) VALUES (
  'YOUR_USER_ID_HERE',
  'admin@yourdomain.com',
  'Your Name',
  'super_admin',
  true
);
```

- [ ] SQL executed successfully
- [ ] No errors returned

### Verify Admin

```sql
SELECT 
  au.email,
  au.full_name,
  au.role,
  au.is_active,
  u.email as auth_email
FROM admin_users au
JOIN auth.users u ON u.id = au.user_id
WHERE au.email = 'admin@yourdomain.com';
```

- [ ] Query returns 1 row
- [ ] is_active = true
- [ ] role = super_admin
- [ ] Emails match

## Application Deployment

### Build & Deploy

- [ ] Run `npm run build` locally (test)
- [ ] Build succeeds with no errors
- [ ] Commit all changes
- [ ] Push to repository
- [ ] Deploy to hosting (Vercel, etc.)
- [ ] Deployment succeeds
- [ ] Site is live

### Environment Variables

Verify these are set in production:

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Any other required variables

### Post-Deploy Verification

- [ ] Site loads: https://yourdomain.com
- [ ] Homepage works
- [ ] Login page loads: /login
- [ ] Dashboard accessible: /dashboard (for restaurants)
- [ ] Admin redirect works: /admin redirects to login if not authenticated

## Admin Access Testing

### Login Test

- [ ] Go to: https://yourdomain.com/login
- [ ] Enter admin email
- [ ] Enter admin password
- [ ] Click Login
- [ ] Redirected to: /admin (not /dashboard)
- [ ] Admin panel loads successfully

### Navigation Test

- [ ] Dashboard shows metrics
- [ ] Restaurants page loads
- [ ] Payments page loads
- [ ] Orders page loads
- [ ] Activity page loads
- [ ] All navigation links work

### Permission Test

- [ ] Can view all restaurants
- [ ] Can view all orders
- [ ] Can view all payments
- [ ] Activity logs show your login

## Enforcement Testing

### Setup Test Restaurant

If you don't have a restaurant yet:
```sql
-- Create test restaurant (optional)
INSERT INTO restaurants (user_id, name, phone, currency)
VALUES ('some-user-id', 'Test Restaurant', '1234567890', 'USD');
```

- [ ] Test restaurant exists
- [ ] Restaurant ID: ___________________

### Test Menu Disable

- [ ] Go to /admin/restaurants
- [ ] Find test restaurant
- [ ] Click disable button (red X)
- [ ] Enter reason: "Testing enforcement"
- [ ] Confirm disable
- [ ] Restaurant shows "Disabled" status

### Test Customer Block

- [ ] Get table ID for test restaurant
- [ ] Open: /menu/[tableId] in incognito window
- [ ] Should see: "Menus Currently Unavailable"
- [ ] Should NOT see menu items
- [ ] ✅ Enforcement working!

### Test Re-Enable

- [ ] Back in admin panel
- [ ] Click enable button (green check)
- [ ] Confirm enable
- [ ] Restaurant shows "Active" status
- [ ] Customer view (/menu/[tableId]) now works
- [ ] ✅ Re-enable working!

## Payment Testing

### Record Test Payment

- [ ] Go to /admin/payments
- [ ] Click "Record Payment"
- [ ] Select test restaurant
- [ ] Amount: 50.00
- [ ] Method: Cash
- [ ] Reference: TEST-001
- [ ] Notes: Deployment test
- [ ] Submit

### Verify Payment

- [ ] Payment appears in list
- [ ] Shows correct amount
- [ ] Shows correct restaurant
- [ ] Shows your admin name

### Check Restaurant Balance

- [ ] Go to /admin/restaurants/[test-restaurant-id]
- [ ] Commission section shows payment
- [ ] total_commission_paid increased by 50.00
- [ ] last_payment_date updated
- [ ] Balance decreased

## Activity Logging Test

- [ ] Go to /admin/activity
- [ ] See your login action
- [ ] See menu disable action
- [ ] See menu enable action
- [ ] See payment recorded action
- [ ] All logs show correct timestamp
- [ ] All logs show your name

## Performance Check

### Dashboard Load Time

- [ ] Go to /admin (dashboard)
- [ ] Time the page load: _______ seconds
- [ ] Should be < 2 seconds
- [ ] If slow, refresh materialized view:

```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY admin_dashboard_metrics;
```

### Restaurant List Load

- [ ] Go to /admin/restaurants
- [ ] Time the page load: _______ seconds
- [ ] Should be < 3 seconds
- [ ] All data displays correctly

## Security Verification

### Middleware Protection

- [ ] Logout
- [ ] Try to access /admin directly
- [ ] Should redirect to /login
- [ ] Try to access /api/admin/restaurants
- [ ] Should return 403 or redirect

### RLS Verification

Create a regular restaurant user and verify they CANNOT:

- [ ] Access /admin routes (redirected to /dashboard)
- [ ] See other restaurants' data
- [ ] Call admin API endpoints
- [ ] View admin_users table
- [ ] View admin_activity_logs

### Admin Access Verification

Login as admin and verify you CAN:

- [ ] See all restaurants
- [ ] See all orders
- [ ] See all payments
- [ ] See all activity logs
- [ ] Disable any restaurant
- [ ] Record payments for any restaurant

## Documentation

### Create Internal Docs

- [ ] Admin credentials stored securely (password manager)
- [ ] Deployment notes saved
- [ ] Rollback procedure documented
- [ ] Support contact saved
- [ ] Next admin training scheduled

### Notify Team

- [ ] Development team notified
- [ ] Support team notified
- [ ] Management notified
- [ ] Admin users trained

## Monitoring Setup (Optional but Recommended)

### Metrics to Monitor

- [ ] Admin login frequency
- [ ] Enforcement actions per day
- [ ] Payment recording frequency
- [ ] Dashboard load time
- [ ] API error rates

### Alerts to Set Up

- [ ] Failed admin logins (security)
- [ ] Slow dashboard loads (performance)
- [ ] No payments in 7 days (business)
- [ ] High enforcement rate (business)

## Post-Deployment

### First Week Checks

Day 1:
- [ ] Check for errors in logs
- [ ] Verify admin can login
- [ ] Test enforcement works

Day 3:
- [ ] Review activity logs
- [ ] Check dashboard performance
- [ ] Verify no security issues

Day 7:
- [ ] Full system audit
- [ ] Review all features
- [ ] Gather admin feedback
- [ ] Plan improvements

### Maintenance Tasks

Weekly:
- [ ] Review activity logs
- [ ] Check outstanding commission
- [ ] Verify no stale data

Monthly:
- [ ] Review admin users (remove inactive)
- [ ] Audit enforcement decisions
- [ ] Check database performance
- [ ] Update documentation

## Rollback Plan (If Needed)

If something goes wrong:

1. **Restore Database**
   ```sql
   -- In Supabase: Settings → Database → Backups
   -- Select backup from before migration
   -- Click "Restore"
   ```

2. **Revert Code**
   ```bash
   git revert <commit-hash>
   git push
   # Redeploy
   ```

3. **Verify Rollback**
   - [ ] Site works
   - [ ] Old data intact
   - [ ] No errors

## Sign-Off

Deployment completed by: ___________________

Date: ___________________

Time: ___________________

Production URL: ___________________

Admin Email: ___________________

Backup Created: ___________________

Issues Encountered: 
___________________________________________________________________
___________________________________________________________________

Resolution:
___________________________________________________________________
___________________________________________________________________

## ✅ Deployment Complete!

Your admin system is now live and operational.

Next steps:
1. Monitor for 24 hours
2. Train additional admins
3. Set up automated metrics refresh
4. Plan future enhancements

Congratulations! 🎉
