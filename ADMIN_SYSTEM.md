# Scan2Dish Admin System Documentation

## Overview

The Scan2Dish Admin System provides full operational control over the platform, enabling super admins to:

- Monitor all restaurant activity
- Enforce commission payment compliance
- Control menu availability per restaurant
- Track payments and financials
- View comprehensive activity logs

## Architecture

### Database Schema

#### New Tables

1. **admin_users**
   - Separate from restaurant users
   - Roles: super_admin, admin, support
   - Links to auth.users

2. **commission_payments**
   - Manual payment recording
   - Tracks all commission transactions
   - References restaurant and recording admin

3. **admin_activity_logs**
   - Complete audit trail
   - Tracks all admin actions
   - Immutable log for compliance

#### Enhanced Tables

**restaurants** - Added fields:
- `menu_enabled` (boolean) - Controls customer menu access
- `enforcement_reason` (text) - Why menu was disabled
- `last_payment_date` (timestamp)
- `total_commission_owed` (numeric)
- `total_commission_paid` (numeric)
- `commission_rate` (numeric)

### Enforcement Flow

```
Customer scans QR → Table Layout checks restaurant.menu_enabled
  ↓
  If FALSE → Show "Menus Currently Unavailable" message
  ↓
  If TRUE → Allow menu access

Order attempt → API checks restaurant.menu_enabled
  ↓
  If FALSE → Reject with 403 error
  ↓
  If TRUE → Create order + auto-calculate commission
```

### Security Model

#### Row Level Security (RLS)

**Admin Access:**
- Admins can see ALL restaurants, orders, tables, menu items
- RLS policies check `is_admin()` function
- Restaurant owners still restricted to their own data

**Enforcement:**
- Menu access checked server-side (cannot be bypassed)
- Middleware protects `/admin` routes
- API routes require admin authentication

## Setup Instructions

### 1. Run Database Migration

```sql
-- In Supabase SQL Editor, run:
\i supabase/migrations/admin_system.sql
```

This creates:
- Admin tables
- RLS policies
- Helper functions
- Materialized view for dashboard metrics

### 2. Create Your First Admin User

```sql
-- Step 1: Create auth user (or use existing)
-- Go to Supabase Auth → Users → Add User
-- Create with email/password

-- Step 2: Get the user_id from auth.users
-- Then insert into admin_users:

INSERT INTO public.admin_users (
  user_id,
  email,
  full_name,
  role,
  is_active
) VALUES (
  'YOUR_AUTH_USER_ID_HERE',
  'admin@scan2dish.com',
  'Admin Name',
  'super_admin',
  true
);
```

### 3. Access Admin Panel

Navigate to: `https://your-domain.com/admin`

- Admin users are redirected here on login
- Regular restaurant users go to `/dashboard`

### 4. Refresh Dashboard Metrics (Optional)

The dashboard uses a materialized view for performance. Refresh periodically:

```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY public.admin_dashboard_metrics;
```

Or via API:
```javascript
await supabase.rpc('refresh_admin_dashboard_metrics');
```

## Admin Features

### Dashboard (`/admin`)

**Key Metrics:**
- Total restaurants (active/disabled)
- Orders (24h, 7d, 30d)
- Revenue and commission totals
- Outstanding commission balances

**Real-time Data:**
- Recent admin activity
- Restaurants with overdue payments
- Platform health overview

### Restaurant Management (`/admin/restaurants`)

**List View:**
- Search and filter restaurants
- View stats (orders, menu items, tables)
- See commission balance
- Quick enable/disable controls

**Detail View (`/admin/restaurants/[id]`):**
- Full restaurant profile
- Commission breakdown
- Recent orders
- Payment history
- Enable/disable with reason

**Actions:**
- ✅ Enable Menu - Allows customer ordering
- ❌ Disable Menu - Blocks customer access (requires reason)

### Commission & Payments (`/admin/payments`)

**Features:**
- Record manual payments (cash, bank transfer, mobile money)
- View all payment history
- Filter by restaurant
- See outstanding balances

**Recording Payment:**
1. Click "Record Payment"
2. Select restaurant (shows current balance)
3. Enter amount, method, reference
4. Submit → Updates restaurant totals automatically

**Auto-Updates:**
- Restaurant `total_commission_paid` increments
- Restaurant `last_payment_date` updates
- Activity log created
- Commission balance recalculated

### Orders Feed (`/admin/orders`)

**Features:**
- View ALL orders across ALL restaurants
- Filter by restaurant and status
- See commission per order
- Real-time order monitoring

**Use Cases:**
- Platform-wide order tracking
- Revenue verification
- Support and troubleshooting
- Business intelligence

### Activity Logs (`/admin/activity`)

**Tracked Actions:**
- Restaurant enabled/disabled
- Menu enabled/disabled
- Payments recorded
- Commission adjustments
- Restaurant/order views
- Settings changes

**Each Log Contains:**
- Admin who performed action
- Timestamp
- Restaurant affected
- Action details (JSON)
- IP address (future enhancement)

## Enforcement Scenarios

### Scenario 1: Unpaid Commission

1. Restaurant accumulates commission: $500
2. Admin reviews in `/admin/restaurants`
3. Restaurant doesn't pay → Admin disables menu
4. Reason: "Unpaid commission: $500"
5. Customers see: "Menus currently unavailable"
6. Restaurant owner can still access dashboard
7. Restaurant pays → Admin records payment
8. Admin re-enables menu
9. Customers can order again

### Scenario 2: Policy Violation

1. Restaurant violates terms
2. Admin disables menu
3. Reason: "Policy violation - under review"
4. No orders can be placed
5. Admin investigates
6. Issue resolved → Menu re-enabled

### Scenario 3: Manual Suspension

1. Restaurant requests temporary suspension
2. Admin disables menu
3. Reason: "Temporary closure - owner request"
4. Restaurant re-opens
5. Admin re-enables

## API Endpoints

### Admin APIs

All require admin authentication.

**Dashboard:**
```
GET /api/admin/dashboard
Returns: Platform metrics and activity
```

**Restaurants:**
```
GET /api/admin/restaurants?status=active&search=name
Returns: List of restaurants with stats

GET /api/admin/restaurants/[id]
Returns: Detailed restaurant info

PATCH /api/admin/restaurants/[id]
Body: { menu_enabled: boolean, enforcement_reason: string }
Returns: Updated restaurant
```

**Payments:**
```
POST /api/admin/payments
Body: {
  restaurant_id: string,
  amount: number,
  payment_method: 'cash' | 'bank_transfer' | 'mobile_money' | 'other',
  reference_number?: string,
  notes?: string
}
Returns: Payment ID

GET /api/admin/payments?restaurant_id=xxx
Returns: Payment history
```

**Orders:**
```
GET /api/admin/orders?restaurant_id=xxx&status=pending&limit=50
Returns: Global orders feed
```

**Activity:**
```
GET /api/admin/activity?action_type=payment_recorded&limit=100
Returns: Activity logs
```

### Public APIs

**Menu Status Check:**
```
GET /api/menu/check-status?tableId=xxx
Returns: { menu_enabled, enforcement_reason }
```

**Order Creation (with enforcement):**
```
POST /api/orders/create
Body: { table_id, restaurant_id, items, ... }
Returns: Order or 403 if menu disabled
```

## Helper Functions

### Server-Side Functions (lib/supabase/admin.ts)

```typescript
// Check if current user is admin
const isAdmin = await isAdmin();

// Get current admin user
const admin = await getAdminUser();

// Require admin (throws if not)
const admin = await requireAdmin();

// Log admin activity
await logAdminActivity({
  action_type: 'menu_disabled',
  restaurant_id: 'xxx',
  details: { reason: 'Unpaid commission' }
});

// Check restaurant menu status
const enabled = await isRestaurantMenuEnabled('restaurant-id');

// Get enforcement status
const status = await getRestaurantEnforcementStatus('restaurant-id');
// Returns: { enabled: boolean, reason: string | null }
```

### Database Functions

```sql
-- Check if user is admin
SELECT public.is_admin('user-uuid');

-- Get restaurant status with stats
SELECT * FROM public.get_restaurant_status('restaurant-uuid');

-- Record payment (auto-updates totals)
SELECT public.record_commission_payment(
  'restaurant-uuid',
  100.00,
  'cash',
  'REF123',
  'Weekly payment',
  'admin-uuid'
);
```

## Middleware Protection

**Admin Route Protection:**
```typescript
// middleware.ts checks:
1. User is authenticated
2. User exists in admin_users table
3. is_active = true
4. Redirects non-admins to /dashboard
```

**Menu Route Enforcement:**
```typescript
// app/menu/[tableId]/layout.tsx checks:
1. Table exists and is active
2. Restaurant menu_enabled = true
3. Shows enforcement message if disabled
```

## Performance Considerations

### Materialized View

The `admin_dashboard_metrics` view pre-calculates expensive aggregations:

- Refresh automatically via cron (recommended)
- Or manually when needed
- Concurrent refresh (non-blocking)

### Indexing

Optimized indexes for:
- Restaurant lookups
- Commission payments by restaurant/date
- Activity logs by admin/restaurant/date
- Order aggregations

### Caching

Consider caching:
- Dashboard metrics (5-15 min TTL)
- Restaurant status checks (1 min TTL)
- Activity logs (30 sec TTL)

## Security Best Practices

### Admin User Management

1. **Limit Super Admins:** Only 2-3 trusted users
2. **Use 'admin' role:** For day-to-day operations
3. **Use 'support' role:** For read-only support staff
4. **Audit regularly:** Review admin_activity_logs

### Enforcement

1. **Always provide reason:** When disabling menus
2. **Document offline:** Keep records of enforcement decisions
3. **Communicate:** Notify restaurant owners
4. **Re-enable promptly:** After payment/resolution

### Data Access

1. **Admins see everything:** By design
2. **Log all actions:** Immutable audit trail
3. **Review logs:** Regular compliance checks
4. **Secure credentials:** Strong passwords, 2FA

## Troubleshooting

### Admin can't access /admin

**Check:**
1. User exists in `admin_users` table
2. `is_active = true`
3. `user_id` matches `auth.users.id`
4. Clear browser cache
5. Check middleware logs

### Menu not blocked for disabled restaurant

**Check:**
1. `restaurants.menu_enabled = false`
2. Layout is server-side (not cached)
3. RLS policies active
4. No client-side bypass

### Commission totals incorrect

**Fix:**
```sql
-- Recalculate from orders
UPDATE restaurants r
SET total_commission_owed = (
  SELECT COALESCE(SUM(commission_amount), 0)
  FROM orders
  WHERE restaurant_id = r.id
)
WHERE id = 'restaurant-uuid';
```

### Dashboard metrics stale

```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY admin_dashboard_metrics;
```

## Future Enhancements

### Planned Features

1. **Automated Enforcement**
   - Auto-disable after X days overdue
   - Email warnings before enforcement
   - Grace period configuration

2. **Payment Integrations**
   - Stripe/PayPal webhook handlers
   - Automatic payment reconciliation
   - Subscription management

3. **Advanced Analytics**
   - Restaurant performance scores
   - Churn prediction
   - Revenue forecasting

4. **Communication Tools**
   - In-app messaging
   - Email templates
   - SMS notifications

5. **Bulk Operations**
   - Batch commission adjustments
   - Multi-restaurant actions
   - CSV exports

### Technical Debt

- Add IP address capture in activity logs
- Implement rate limiting on admin APIs
- Add email notifications for enforcement
- Create automated backup system

## Support

For issues or questions:
1. Check activity logs first
2. Review enforcement status
3. Verify RLS policies active
4. Check Supabase logs
5. Contact platform support

## License & Compliance

- All admin actions logged permanently
- GDPR compliant (right to access logs)
- SOC 2 ready (audit trail complete)
- Commission enforcement legally defensible (Terms of Service)

---

**Built for:** Scan2Dish SaaS Platform  
**Version:** 1.0  
**Last Updated:** December 2025
