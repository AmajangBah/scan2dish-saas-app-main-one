# 🛡️ Scan2Dish Admin System

A complete SaaS admin panel for managing restaurants, enforcing commission payments, and operating Scan2Dish like a serious business.

## 🎯 What This System Does

### For Platform Operators (You)

✅ **Full Visibility**
- See ALL restaurants and their activity
- Monitor orders across the entire platform
- Track commission owed and paid
- View complete audit trail

✅ **Complete Control**
- Enable/disable restaurant menus
- Block ordering for non-compliant restaurants
- Record commission payments
- Manage restaurant accounts

✅ **Commission Enforcement**
- Restaurants that don't pay → Menu automatically disabled
- Customers see: "Menus currently unavailable"
- Orders blocked server-side (cannot be bypassed)
- Restaurant owner dashboard remains accessible

### For Restaurant Owners

- Dashboard access ALWAYS available (never blocked)
- Can see their menu is disabled
- Can contact you to resolve payment
- Menu re-enabled immediately after payment

### For Customers

- If restaurant is compliant → Full menu access
- If restaurant is non-compliant → Clear message, no menu access
- Server-side enforcement (secure, reliable)

## 📁 What Was Built

### Database
- **3 new tables**: admin_users, commission_payments, admin_activity_logs
- **Enhanced restaurants table**: menu_enabled, commission tracking
- **RLS policies**: Admins see everything, restaurants see only their data
- **Helper functions**: Automated commission calculation, payment recording
- **Materialized view**: Fast dashboard metrics

### Backend
- **7 admin API routes**: Dashboard, restaurants, payments, orders, activity
- **Enforcement API**: Order creation with menu status checks
- **Admin helpers**: Authentication, logging, status checks
- **Middleware**: Protected admin routes, role-based access

### Frontend
- **Admin layout**: Sidebar navigation, role display
- **5 admin pages**: Dashboard, restaurants, payments, orders, activity
- **Restaurant controls**: Enable/disable with reason
- **Payment recording**: Modal form with auto-calculations
- **Enforcement message**: Customer-facing when menu disabled

### Documentation
- **ADMIN_SYSTEM.md**: Complete technical documentation
- **SETUP_ADMIN.md**: 5-minute quick start guide
- **ARCHITECTURE_NOTES.md**: Design decisions and rationale
- **ADMIN_QUICK_REFERENCE.md**: Commands and queries cheat sheet
- **ADMIN_DEPLOYMENT_CHECKLIST.md**: Production deployment guide

## 🚀 Quick Start

### 1. Run Migration (2 minutes)

```sql
-- In Supabase SQL Editor
\i supabase/migrations/admin_system.sql
```

### 2. Create Admin User (2 minutes)

```sql
-- Step 1: Create auth user in Supabase Auth UI
-- Step 2: Insert admin record
INSERT INTO public.admin_users (user_id, email, full_name, role, is_active)
VALUES ('YOUR_AUTH_USER_ID', 'admin@domain.com', 'Your Name', 'super_admin', true);
```

### 3. Login (1 minute)

- Go to `/login`
- Enter admin credentials
- Redirected to `/admin` dashboard
- ✅ You're in!

**Full setup guide:** [SETUP_ADMIN.md](SETUP_ADMIN.md)

## 🎨 Admin Panel Features

### Dashboard (`/admin`)

<table>
<tr>
<td width="50%">

**Key Metrics**
- Total restaurants
- Orders (24h, 7d, 30d)
- Revenue totals
- Commission outstanding

</td>
<td width="50%">

**Quick Views**
- Restaurants with overdue payments
- Recent admin activity
- Platform health status

</td>
</tr>
</table>

### Restaurant Management (`/admin/restaurants`)

- **List all restaurants** with stats (orders, menu items, tables)
- **Search and filter** by name and status
- **Quick controls** to enable/disable menus
- **Detail view** with commission breakdown and payment history

### Commission & Payments (`/admin/payments`)

- **Record payments** (cash, bank transfer, mobile money)
- **View payment history** across all restaurants
- **Track outstanding balances**
- **Auto-update** restaurant commission totals

### Global Orders Feed (`/admin/orders`)

- **See ALL orders** across all restaurants
- **Filter** by restaurant and status
- **Track commission** per order
- **Monitor** platform activity

### Activity Logs (`/admin/activity`)

- **Complete audit trail** of all admin actions
- **Filter** by action type
- **See** who did what and when
- **Compliance ready** for audits

## 🔐 Enforcement How It Works

### The Flow

```
1. Customer scans QR code
   ↓
2. Server checks: restaurants.menu_enabled
   ↓
3. If FALSE → Show "Menus unavailable" message
   ↓
4. If TRUE → Show menu
   ↓
5. Customer tries to order
   ↓
6. API checks: restaurants.menu_enabled
   ↓
7. If FALSE → Reject with 403 error
   ↓
8. If TRUE → Create order + calculate commission
```

### Security Layers

1. **Layout Layer**: Server-side check before rendering
2. **API Layer**: Validation before order creation
3. **Database Layer**: RLS policies prevent data access

**Result:** Cannot be bypassed by customer or restaurant owner

## 📊 Sample Scenarios

### Scenario 1: Unpaid Commission

```
Restaurant: "Pizza Place"
Commission owed: $500
Commission paid: $0
Balance: $500

Admin Action:
1. Go to /admin/restaurants
2. Find "Pizza Place"
3. Click disable (🔴)
4. Reason: "Unpaid commission: $500"
5. Confirm

Result:
- Customers see: "Menus currently unavailable"
- No orders can be placed
- Owner can still access their dashboard
- Activity logged

Resolution:
1. Restaurant pays $500
2. Admin records payment
3. Admin re-enables menu
4. Customers can order again
```

### Scenario 2: Payment & Re-enable

```
1. Restaurant pays $500 cash
2. Admin → /admin/payments → Record Payment
3. Select restaurant, enter $500, cash, reference
4. Submit → Balance now $0
5. Go to restaurant detail
6. Click enable (✅)
7. Menu immediately available to customers
8. All actions logged
```

## 🗂️ File Structure

```
/workspace/
├── supabase/
│   └── migrations/
│       ├── admin_system.sql              # Main migration ⭐
│       └── create_first_admin.sql        # Helper script
├── lib/
│   └── supabase/
│       └── admin.ts                      # Admin helpers ⭐
├── app/
│   ├── admin/                            # Admin pages ⭐
│   │   ├── layout.tsx                    # Admin layout
│   │   ├── page.tsx                      # Dashboard
│   │   ├── restaurants/
│   │   │   ├── page.tsx                  # List
│   │   │   ├── [id]/page.tsx             # Detail
│   │   │   └── RestaurantControls.tsx    # Enable/disable
│   │   ├── payments/
│   │   │   ├── page.tsx                  # List
│   │   │   └── RecordPaymentButton.tsx   # Record form
│   │   ├── orders/page.tsx               # Global feed
│   │   └── activity/page.tsx             # Logs
│   ├── api/
│   │   ├── admin/                        # Admin APIs ⭐
│   │   │   ├── dashboard/route.ts
│   │   │   ├── restaurants/route.ts
│   │   │   ├── restaurants/[id]/route.ts
│   │   │   ├── payments/route.ts
│   │   │   ├── orders/route.ts
│   │   │   └── activity/route.ts
│   │   ├── orders/create/route.ts        # With enforcement ⭐
│   │   └── menu/check-status/route.ts
│   └── menu/[tableId]/
│       └── layout.tsx                    # Enforcement layer ⭐
├── middleware.ts                         # Admin route protection ⭐
└── docs/
    ├── ADMIN_SYSTEM.md                   # Full documentation
    ├── SETUP_ADMIN.md                    # Quick start
    ├── ARCHITECTURE_NOTES.md             # Design docs
    ├── ADMIN_QUICK_REFERENCE.md          # Cheat sheet
    └── ADMIN_DEPLOYMENT_CHECKLIST.md     # Production guide
```

**⭐ = Critical files**

## 🔑 Key Concepts

### Admin Roles

| Role | Access |
|------|--------|
| `super_admin` | Full access + manage admins |
| `admin` | Full operational access |
| `support` | Read-only (future) |

### Commission Flow

```
Order Created
  ↓
Auto-calculate: total × commission_rate
  ↓
Add to: restaurants.total_commission_owed
  ↓
Admin records payment
  ↓
Add to: restaurants.total_commission_paid
  ↓
Balance = owed - paid
```

### Enforcement States

| State | Menu Enabled | Customer Access | Owner Access |
|-------|--------------|-----------------|--------------|
| Active | ✅ true | Full access | Full access |
| Disabled | ❌ false | Blocked | Full access |

## 🛠️ Development

### Local Setup

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Access admin
# Login at localhost:3000/login
# Will redirect to localhost:3000/admin
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Testing

```typescript
// Test admin access
const isAdmin = await isAdmin();

// Test enforcement
const enabled = await isRestaurantMenuEnabled('restaurant-id');

// Test payment recording
await recordCommissionPayment({...});
```

## 📚 Documentation

| Document | Purpose | Audience |
|----------|---------|----------|
| [ADMIN_SYSTEM.md](ADMIN_SYSTEM.md) | Complete technical docs | Developers |
| [SETUP_ADMIN.md](SETUP_ADMIN.md) | Quick start guide | Everyone |
| [ARCHITECTURE_NOTES.md](ARCHITECTURE_NOTES.md) | Design decisions | Developers |
| [ADMIN_QUICK_REFERENCE.md](ADMIN_QUICK_REFERENCE.md) | Commands cheat sheet | Admins |
| [ADMIN_DEPLOYMENT_CHECKLIST.md](ADMIN_DEPLOYMENT_CHECKLIST.md) | Production deployment | DevOps |

## 🎯 Core Enforcement Rule

> **If a restaurant does not pay commission, their menu is disabled.**

**Implementation:**
1. Admin sets `menu_enabled = false`
2. Server-side layout blocks customer access
3. API rejects order creation attempts
4. Customer sees clear message
5. Restaurant owner dashboard remains accessible
6. Admin records payment → Re-enables menu
7. All actions logged permanently

**Cannot be bypassed.**

## ✨ Highlights

### What Makes This Great

✅ **Production Ready**
- Full RLS security
- Server-side enforcement
- Complete audit trail
- Performance optimized

✅ **Operator Friendly**
- Intuitive admin UI
- Quick actions
- Clear status indicators
- Comprehensive logs

✅ **Legally Defensible**
- All actions logged
- Enforcement reasons required
- Audit trail permanent
- Compliance ready

✅ **Scalable**
- Materialized views for performance
- Indexed for fast queries
- Can handle 1000s of restaurants
- Ready for growth

## 🚧 Future Enhancements

### Planned
- [ ] Automated enforcement (auto-disable after X days)
- [ ] Email notifications (warnings, confirmations)
- [ ] Payment integrations (Stripe, PayPal)
- [ ] Advanced analytics (performance scoring, forecasting)
- [ ] Bulk operations (multi-restaurant actions)

### Consider
- [ ] SMS notifications
- [ ] In-app messaging
- [ ] Subscription management
- [ ] Multi-currency support
- [ ] API rate limiting

## 💡 Pro Tips

1. **Review activity logs weekly** - Catch issues early
2. **Document enforcement reasons** - Legal protection
3. **Communicate with restaurants** - Better relationships
4. **Set payment reminders** - Proactive management
5. **Keep admin credentials secure** - Use password manager + 2FA

## 🆘 Support

### Common Issues

**Can't access /admin?**
→ Check admin_users table, verify is_active = true

**Menu not blocked?**
→ Check restaurants.menu_enabled = false, clear cache

**Commission totals wrong?**
→ Run recalculation SQL (see ADMIN_QUICK_REFERENCE.md)

**Dashboard slow?**
→ Refresh materialized view (see docs)

### Getting Help

1. Check [ADMIN_SYSTEM.md](ADMIN_SYSTEM.md) for detailed docs
2. Review [ADMIN_QUICK_REFERENCE.md](ADMIN_QUICK_REFERENCE.md) for commands
3. Check activity logs for clues
4. Verify RLS policies are active
5. Review Supabase logs

## 📈 Success Metrics

Track these to measure success:

- **Commission Collection Rate**: Target 95%+
- **Average Days to Payment**: Target < 30
- **Enforcement Actions**: Monitor trends
- **Restaurant Churn**: Due to enforcement
- **Platform Revenue**: Total commission collected

## 🎉 You're Ready!

Your admin system is:

✅ Fully functional  
✅ Secure and reliable  
✅ Production ready  
✅ Well documented  
✅ Easy to use  

**Now you can:**

- Monitor everything happening on Scan2Dish
- Enforce commission compliance
- Manually manage restaurants
- Operate Scan2Dish like a serious business

---

**Built with:** Next.js 16, Supabase, TypeScript  
**License:** Proprietary  
**Version:** 1.0  
**Status:** Production Ready ✅

**Questions?** Check the documentation or review the code.

**Let's build something great! 🚀**
