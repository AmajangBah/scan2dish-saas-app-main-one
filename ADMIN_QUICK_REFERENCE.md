# Admin System Quick Reference

## Quick Commands

### Check if user is admin
```sql
SELECT public.is_admin('user-uuid');
```

### Get restaurant status
```sql
SELECT * FROM public.get_restaurant_status('restaurant-uuid');
```

### Record payment
```sql
SELECT public.record_commission_payment(
  'restaurant-uuid',  -- Restaurant ID
  100.00,            -- Amount
  'cash',            -- Method: cash, bank_transfer, mobile_money, other
  'REF123',          -- Reference (optional)
  'Weekly payment',  -- Notes (optional)
  'admin-uuid'       -- Admin user ID
);
```

### Refresh dashboard metrics
```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY admin_dashboard_metrics;
```

### Get all admins
```sql
SELECT * FROM public.admin_users WHERE is_active = true;
```

### Disable restaurant
```sql
UPDATE public.restaurants 
SET 
  menu_enabled = false,
  enforcement_reason = 'Unpaid commission'
WHERE id = 'restaurant-uuid';
```

### Enable restaurant
```sql
UPDATE public.restaurants 
SET 
  menu_enabled = true,
  enforcement_reason = NULL
WHERE id = 'restaurant-uuid';
```

## Key URLs

| Page | URL | Description |
|------|-----|-------------|
| Admin Dashboard | `/admin` | Overview and metrics |
| Restaurants | `/admin/restaurants` | Manage all restaurants |
| Restaurant Detail | `/admin/restaurants/[id]` | Single restaurant view |
| Payments | `/admin/payments` | Record and view payments |
| Orders | `/admin/orders` | Global orders feed |
| Activity | `/admin/activity` | Audit logs |

## API Endpoints

### Dashboard
```bash
GET /api/admin/dashboard
# Returns platform metrics
```

### Restaurants
```bash
GET /api/admin/restaurants?status=active&search=name
# List restaurants

GET /api/admin/restaurants/[id]
# Get restaurant details

PATCH /api/admin/restaurants/[id]
# Body: { menu_enabled: boolean, enforcement_reason: string }
# Enable/disable menu
```

### Payments
```bash
POST /api/admin/payments
# Body: {
#   restaurant_id: string,
#   amount: number,
#   payment_method: 'cash' | 'bank_transfer' | 'mobile_money' | 'other',
#   reference_number?: string,
#   notes?: string
# }

GET /api/admin/payments?restaurant_id=xxx
# List payments
```

### Orders
```bash
GET /api/admin/orders?restaurant_id=xxx&status=pending&limit=50
# Global orders feed
```

### Activity
```bash
GET /api/admin/activity?action_type=payment_recorded&limit=100
# Activity logs
```

## Admin Roles

| Role | Access |
|------|--------|
| `super_admin` | Full access - manage everything including other admins |
| `admin` | Full operational access - restaurants, payments, orders |
| `support` | Read-only access (future) |

## Action Types (Activity Logs)

- `restaurant_enabled`
- `restaurant_disabled`
- `menu_enabled`
- `menu_disabled`
- `payment_recorded`
- `commission_adjusted`
- `restaurant_viewed`
- `order_viewed`
- `settings_changed`

## Payment Methods

- `cash` - Cash payment
- `bank_transfer` - Bank transfer
- `mobile_money` - Mobile money (M-Pesa, etc.)
- `other` - Other payment method

## Order Status

- `pending` - Order placed, awaiting preparation
- `preparing` - Being prepared
- `completed` - Delivered/completed
- `cancelled` - Cancelled

## Database Tables

### admin_users
```sql
- id (uuid, PK)
- user_id (uuid, FK → auth.users)
- email (text, unique)
- full_name (text)
- role (text: super_admin, admin, support)
- is_active (boolean)
- created_at, updated_at
- last_login_at
```

### commission_payments
```sql
- id (uuid, PK)
- restaurant_id (uuid, FK → restaurants)
- amount (numeric)
- payment_method (text)
- payment_date (timestamp)
- reference_number (text, optional)
- notes (text, optional)
- recorded_by (uuid, FK → admin_users)
- created_at, updated_at
```

### admin_activity_logs
```sql
- id (uuid, PK)
- admin_id (uuid, FK → admin_users)
- action_type (text)
- restaurant_id (uuid, FK, optional)
- order_id (uuid, FK, optional)
- details (jsonb)
- ip_address (text, optional)
- user_agent (text, optional)
- created_at
```

### restaurants (new fields)
```sql
- menu_enabled (boolean) - Controls customer access
- enforcement_reason (text) - Why disabled
- last_payment_date (timestamp)
- total_commission_owed (numeric)
- total_commission_paid (numeric)
- commission_rate (numeric)
```

## Helper Functions (TypeScript)

```typescript
import { 
  isAdmin, 
  getAdminUser, 
  requireAdmin,
  logAdminActivity,
  isRestaurantMenuEnabled,
  getRestaurantEnforcementStatus
} from '@/lib/supabase/admin';

// Check if current user is admin
const adminStatus = await isAdmin(); // boolean

// Get current admin user
const admin = await getAdminUser(); // AdminUser | null

// Require admin (throws if not)
const admin = await requireAdmin(); // AdminUser or throws

// Log activity
await logAdminActivity({
  action_type: 'menu_disabled',
  restaurant_id: 'xxx',
  details: { reason: 'Unpaid commission' }
});

// Check restaurant status
const enabled = await isRestaurantMenuEnabled('restaurant-id');

// Get enforcement details
const status = await getRestaurantEnforcementStatus('restaurant-id');
// Returns: { enabled: boolean, reason: string | null }
```

## Common Workflows

### 1. Disable Restaurant for Non-Payment

1. Go to `/admin/restaurants`
2. Find restaurant
3. Click red disable button
4. Enter reason: "Unpaid commission: $XXX"
5. Confirm
6. Customer QR codes now show "Menus unavailable"

### 2. Record Payment and Re-Enable

1. Restaurant pays commission
2. Go to `/admin/payments`
3. Click "Record Payment"
4. Select restaurant, enter amount, method
5. Submit
6. Go to `/admin/restaurants/[id]`
7. Click green enable button
8. Customer access restored

### 3. Monitor Platform Activity

1. Go to `/admin`
2. Review key metrics
3. Check outstanding commission
4. Review recent activity
5. Investigate any issues

### 4. Audit Admin Actions

1. Go to `/admin/activity`
2. Filter by action type
3. Review who did what when
4. Verify compliance

## Troubleshooting

### Can't access /admin
```sql
-- Check admin exists
SELECT * FROM admin_users WHERE email = 'your-email';

-- Should return: is_active = true
```

### Menu not blocked
```sql
-- Check restaurant status
SELECT id, name, menu_enabled, enforcement_reason 
FROM restaurants 
WHERE id = 'restaurant-uuid';

-- Should show: menu_enabled = false
```

### Commission totals wrong
```sql
-- Recalculate
UPDATE restaurants r
SET total_commission_owed = (
  SELECT COALESCE(SUM(commission_amount), 0)
  FROM orders WHERE restaurant_id = r.id
)
WHERE id = 'restaurant-uuid';
```

### Dashboard slow
```sql
-- Refresh metrics
REFRESH MATERIALIZED VIEW CONCURRENTLY admin_dashboard_metrics;
```

## Security Checklist

- [ ] Strong admin passwords (12+ chars)
- [ ] 2FA enabled
- [ ] Limited super_admins (2-3 max)
- [ ] Review activity logs weekly
- [ ] Document enforcement decisions
- [ ] Secure credential storage

## Files Reference

| File | Purpose |
|------|---------|
| `/supabase/migrations/admin_system.sql` | Main migration |
| `/supabase/migrations/create_first_admin.sql` | Helper script |
| `/lib/supabase/admin.ts` | Server-side helpers |
| `/app/admin/*` | Admin UI pages |
| `/app/api/admin/*` | Admin API routes |
| `/app/menu/[tableId]/layout.tsx` | Enforcement layer |
| `/middleware.ts` | Route protection |

## Support

- Full documentation: `ADMIN_SYSTEM.md`
- Setup guide: `SETUP_ADMIN.md`
- Architecture: `ARCHITECTURE_NOTES.md`

## Quick Stats Queries

### Platform Overview
```sql
SELECT 
  COUNT(DISTINCT r.id) as total_restaurants,
  COUNT(DISTINCT r.id) FILTER (WHERE r.menu_enabled) as active_restaurants,
  COUNT(o.id) as total_orders,
  SUM(o.total) as total_revenue,
  SUM(o.commission_amount) as total_commission
FROM restaurants r
LEFT JOIN orders o ON o.restaurant_id = r.id;
```

### Top Restaurants by Orders
```sql
SELECT 
  r.name,
  COUNT(o.id) as order_count,
  SUM(o.total) as revenue,
  SUM(o.commission_amount) as commission
FROM restaurants r
JOIN orders o ON o.restaurant_id = r.id
GROUP BY r.id, r.name
ORDER BY order_count DESC
LIMIT 10;
```

### Outstanding Commission
```sql
SELECT 
  r.name,
  r.total_commission_owed,
  r.total_commission_paid,
  (r.total_commission_owed - r.total_commission_paid) as balance,
  r.last_payment_date,
  r.menu_enabled
FROM restaurants r
WHERE (r.total_commission_owed - r.total_commission_paid) > 0
ORDER BY balance DESC;
```

### Recent Activity
```sql
SELECT 
  al.action_type,
  al.created_at,
  au.full_name as admin_name,
  r.name as restaurant_name,
  al.details
FROM admin_activity_logs al
JOIN admin_users au ON au.id = al.admin_id
LEFT JOIN restaurants r ON r.id = al.restaurant_id
ORDER BY al.created_at DESC
LIMIT 20;
```
