-- =============================================================================
-- Create First Admin User - Helper Script
-- =============================================================================
-- Use this script to quickly create your first admin user
-- 
-- INSTRUCTIONS:
-- 1. First create an auth user in Supabase Auth UI
-- 2. Copy the user_id from auth.users
-- 3. Replace YOUR_USER_ID_HERE below with the actual ID
-- 4. Replace the email and name with your details
-- 5. Run this script

-- =============================================================================
-- STEP 1: Verify auth user exists
-- =============================================================================
-- Run this first to get your user_id:
-- SELECT id, email FROM auth.users WHERE email = 'your-email@domain.com';

-- =============================================================================
-- STEP 2: Create admin record (EDIT THIS SECTION)
-- =============================================================================

INSERT INTO public.admin_users (
  user_id,
  email,
  full_name,
  role,
  is_active
) VALUES (
  'YOUR_USER_ID_HERE',           -- ⚠️ REPLACE THIS with actual user_id from auth.users
  'admin@yourdomain.com',         -- ⚠️ REPLACE with your email (must match auth user)
  'Your Full Name',               -- ⚠️ REPLACE with your name
  'super_admin',                  -- Options: 'super_admin', 'admin', 'support'
  true
);

-- =============================================================================
-- STEP 3: Verify admin was created
-- =============================================================================

SELECT 
  au.id,
  au.email,
  au.full_name,
  au.role,
  au.is_active,
  u.email as auth_email,
  u.created_at as auth_created_at
FROM public.admin_users au
JOIN auth.users u ON u.id = au.user_id
WHERE au.email = 'admin@yourdomain.com';  -- ⚠️ REPLACE with your email

-- If this returns 1 row, you're all set! ✅

-- =============================================================================
-- Optional: Create additional admins
-- =============================================================================

-- Day-to-day admin (can do most operations)
-- INSERT INTO public.admin_users (user_id, email, full_name, role, is_active)
-- VALUES ('another-user-id', 'admin2@domain.com', 'Jane Smith', 'admin', true);

-- Support staff (read-only, for future use)
-- INSERT INTO public.admin_users (user_id, email, full_name, role, is_active)
-- VALUES ('support-user-id', 'support@domain.com', 'Support Team', 'support', true);

-- =============================================================================
-- Troubleshooting
-- =============================================================================

-- Problem: "duplicate key value violates unique constraint"
-- Solution: Admin already exists, check with:
-- SELECT * FROM public.admin_users WHERE email = 'your-email@domain.com';

-- Problem: "insert or update on table violates foreign key constraint"
-- Solution: Auth user doesn't exist, create in Supabase Auth UI first

-- Problem: Can't access /admin after creating
-- Solution: 
-- 1. Clear browser cache
-- 2. Log out and log back in
-- 3. Verify is_active = true:
--    SELECT is_active FROM public.admin_users WHERE email = 'your-email@domain.com';

-- =============================================================================
-- Security Note
-- =============================================================================
-- ⚠️ Only create admin users for trusted individuals
-- ⚠️ Use strong passwords (12+ characters)
-- ⚠️ Enable 2FA in Supabase Auth
-- ⚠️ Limit super_admin role to 2-3 people maximum
-- ⚠️ Review admin_activity_logs regularly

-- =============================================================================
-- Next Steps
-- =============================================================================
-- After creating your admin:
-- 1. Login at /login with your admin email
-- 2. You'll be redirected to /admin (not /dashboard)
-- 3. Test by disabling a restaurant menu
-- 4. Record a test payment
-- 5. Check activity logs
-- 
-- See SETUP_ADMIN.md for detailed instructions
