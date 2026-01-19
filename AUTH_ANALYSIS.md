# Authentication System Analysis - Scan2Dish

## Overview

Your application implements a **two-tier authentication system** with proper separation between Restaurant Owners and Admins. The system uses Supabase Auth with Row-Level Security (RLS).

---

## 1. Authentication Systems Implemented

### A. **Restaurant Owner Authentication**

The main user-facing authentication system for restaurant owners.

**Entry Points:**

- `/register` - Signup page
- `/login` - Login page
- `/onboarding` - Post-login onboarding wizard
- `/dashboard` - Protected dashboard

**Flow:**

```
Signup → Email Confirmation → Login → Onboarding Wizard → Dashboard
```

**Key Files:**

- [app/register/page.tsx](app/register/page.tsx) - Client-side signup form
- [app/login/LoginClient.tsx](app/login/LoginClient.tsx) - Client-side login form
- [app/login/layout.tsx](app/login/layout.tsx) - Login layout with auth checks
- [lib/auth/restaurant.ts](lib/auth/restaurant.ts) - Server-side restaurant auth utilities

**Database Tables:**

- `auth.users` (Supabase managed)
- `restaurants` - One per user (unique constraint on `user_id`)
- `onboarding_progress` - Tracks completion status

---

### B. **Admin Authentication**

Separate authentication system for platform admins.

**Entry Points:**

- `/auth/admin/sign-in` - Admin login
- `/admin` - Protected admin dashboard

**Key Files:**

- [app/auth/admin/sign-in/AdminSignInClient.tsx](app/auth/admin/sign-in/AdminSignInClient.tsx) - Admin login form
- [lib/supabase/admin.ts](lib/supabase/admin.ts) - Admin utilities

**Database Tables:**

- `admin_users` - Admin accounts (created in migrations)
- `admin_activity_logs` - Audit trail
- `commission_payment_receipts` - Payments table

---

### C. **Public/Unauthenticated Access**

Customers can browse menus and place orders without authentication.

**Entry Points:**

- `/menu/[tableId]/browse` - Browse menu by table UUID
- Customers identified by table ID from QR code scan

**Database Access:**

- Read-only access to `menu_items` (via RLS)
- Ability to create `orders` (via RLS)

---

## 2. Authentication Architecture

### Session Management

**Browser Client Setup:**

```typescript
// lib/supabase/client.ts
createBrowserClient();
// - Uses public Supabase credentials
// - Manages session in localStorage
```

**Server Component Setup:**

```typescript
// lib/supabase/server.ts
createServerClient() with cookie sync
// - Uses official Supabase SSR pattern
// - Middleware.ts handles cookie persistence
// - Zero manual cookie manipulation
```

**Middleware Integration:**

```typescript
// middleware.ts
// - Runs on every request
// - Syncs Supabase cookies to response
// - Ensures session persists on Vercel Edge
```

### Session Persistence Flow

```
Request → Middleware (sync cookies) → Server Component →
getRestaurantAuthContext() → Database query → Response
```

---

## 3. Authentication Protection

### Restaurant Owner Protection

**Layout/Page Level:**

```typescript
// app/dashboard/layout.tsx
const ctx = await getRestaurantAuthContext();
if (!ctx) redirect("/login");
if (!ctx.onboardingCompleted) redirect("/onboarding");
```

**Server Actions/API Routes:**

```typescript
// app/actions/orders.ts
const ctx = await requireRestaurant();
// Throws error if not authenticated
```

**Restaurant Data Isolation:**

```sql
-- RLS Policy
CREATE POLICY restaurants_select_own ON restaurants
TO authenticated
USING (auth.uid() = user_id);
```

### Admin Protection

**Layout Level:**

```typescript
// app/admin/layout.tsx
const adminUser = await getAdminUser();
if (!adminUser) redirect("/auth/admin/sign-in");
```

**Admin RLS:**

```sql
CREATE POLICY admin_users_admin_all ON admin_users
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));
```

### Login Page Protection

**Prevents Already-Authenticated Users:**

```typescript
// app/login/layout.tsx
if (user) {
  if (adminUser) redirect("/admin");
  if (restaurant) redirect(onboardingCompleted ? "/dashboard" : "/onboarding");
}
```

---

## 4. What You're Doing RIGHT ✅

1. **Proper Separation of Concerns**
   - Restaurant owners and admins use separate login pages
   - Clear role-based access control

2. **Server-Side Session Management**
   - Uses official Supabase SSR pattern
   - Zero manual cookie manipulation
   - Middleware properly syncs cookies

3. **Request-Level Caching**
   - `getRestaurantAuthContext()` is cached per request
   - Prevents repeated database queries
   - Uses React `cache()`

4. **Onboarding Enforcement**
   - Users must complete onboarding before accessing dashboard
   - Tracked in database with completion status

5. **RLS (Row-Level Security)**
   - Restaurants can only access their own data
   - Customers can only access public/relevant data
   - Database enforces authorization

6. **Logout Implementation**
   - [app/logout/route.ts](app/logout/route.ts) properly signs out and redirects

7. **Email Confirmation**
   - Signup requires email verification
   - Configured in Supabase Auth settings

8. **Middleware Cookie Handling**
   - Middleware properly persists session cookies on edge
   - Critical for Vercel deployment

---

## 5. Issues & Recommendations 🚨

### CRITICAL ISSUES

#### 1. **Race Condition: Client-Side Redirect After Auth**

**Location:** [app/login/LoginClient.tsx](app/login/LoginClient.tsx#L75-L76)

**Problem:**

```typescript
const { redirectAfterLogin } = await import("@/app/actions/auth");
await redirectAfterLogin(redirectTo || Route.DASHBOARD);
```

This imports and calls a server action AFTER client-side auth. The server action simply does `redirect()`, which happens AFTER the client already logged in. There's a potential race condition.

**Better Approach:**

```typescript
// Use a server action for the entire auth flow, not just redirect
async function signInWithPassword(email: string, password: string) {
  "use server";
  // 1. Call Supabase auth
  // 2. Verify user is not admin
  // 3. Check restaurant exists
  // 4. Redirect server-side
}
```

---

#### 2. **Admin Check Uses `maybeSingle()` But Expects Data**

**Location:** [app/login/LoginClient.tsx](app/login/LoginClient.tsx#L57-L63)

**Current Code:**

```typescript
const { data: adminUser } = await supabase
  .from("admin_users")
  .select("id, is_active")
  .eq("user_id", data.user?.id)
  .eq("is_active", true)
  .maybeSingle();

if (adminUser) {
  // ← Could be null when no match
  await supabase.auth.signOut();
  throw new Error("Admin accounts must sign in at /auth/admin/sign-in.");
}
```

**Issue:** Logic is correct, but unnecessarily verbose. Should be clearer.

**Better:**

```typescript
const { data: adminUser, error } = await supabase
  .from("admin_users")
  .select("id, is_active")
  .eq("user_id", data.user?.id)
  .eq("is_active", true)
  .maybeSingle();

if (!error && adminUser) {
  // Explicit null/error check
  await supabase.auth.signOut();
  throw new Error("Admin accounts must sign in at /auth/admin/sign-in.");
}
```

---

#### 3. **Public Menu Access Not Authenticated**

**Location:** [middleware.ts](middleware.ts) and RLS policies

**Current State:**

- Customers scan QR code and access `/menu/[tableId]/browse`
- No authentication required
- Relies on table UUID being hard to guess

**Question:** Is this intentional?

**Risks:**

- Anyone with a table UUID can order from that table
- No rate limiting on orders
- Could be abused for DOS attacks

**Recommendations:**

```typescript
// Consider adding one or more of:
1. JWT token in QR code (rotate periodically)
2. Session cookie set on QR scan
3. Time-limited tokens
4. Rate limiting at the API level
5. IP-based restrictions
```

---

#### 4. **Signup Doesn't Auto-Create Restaurant**

**Location:** [app/register/page.tsx](app/register/page.tsx)

**Current Flow:**

```
Signup → Email Confirmation → Redirect to /register (no automatic restaurant creation)
```

**Question:** Does signup auto-create a restaurant entry?

**Looking at migrations:** [supabase/migrations/auto_create_restaurant_on_signup.sql](supabase/migrations/auto_create_restaurant_on_signup.sql)

This suggests there's a trigger, but verify it's working:

```sql
-- Should have a trigger like:
CREATE TRIGGER create_restaurant_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
```

**Action:** Verify this trigger exists in your Supabase database.

---

#### 5. **Missing Logout Links in Admin Dashboard**

**Location:** [app/admin/layout.tsx](app/admin/layout.tsx#L70+)

**Current Code:**

```typescript
<NavLink href="/admin/orders" icon={<ShoppingCart />}>
  Orders
</NavLink>
// ... more nav items
```

**Issue:** No logout link. Users must manually navigate to `/logout`.

**Fix:**

```typescript
<div className="space-y-1">
  <NavLink href="/logout" icon={<LogOut />}>
    Logout
  </NavLink>
</div>
```

---

#### 6. **No Session Expiration Handling**

**Potential Issue:**

Currently, no explicit handling of session expiration on the client.

**Recommendation:**

```typescript
// Create a hook to monitor session expiration
export function useSessionExpiration() {
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        redirect("/login");
      }
    });
    return () => subscription?.unsubscribe();
  }, []);
}
```

---

#### 7. **No CSRF Protection on Logout**

**Location:** [app/logout/route.ts](app/logout/route.ts)

**Current Code:**

```typescript
export async function GET(request: Request) {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  const url = new URL("/login", request.url);
  return NextResponse.redirect(url);
}
```

**Issue:** Uses GET, which is vulnerable to CSRF attacks (e.g., `<img src="/logout">`)

**Fix:**

```typescript
// Only accept POST
export async function POST(request: Request) {
  // ... same logic
}

// On client, use:
<form action="/logout" method="POST">
  <button>Logout</button>
</form>
```

---

#### 8. **Error Handling Doesn't Distinguish Auth Types**

**Location:** Multiple login/signup forms

**Issue:** All errors are caught generically:

```typescript
catch (err: unknown) {
  setErrorMsg(err instanceof Error ? err.message : "Login failed");
}
```

**Better UX:**

```typescript
catch (err: unknown) {
  if (err instanceof AuthApiError) {
    if (err.status === 401) setErrorMsg("Invalid email or password");
    if (err.status === 429) setErrorMsg("Too many login attempts. Try again later.");
    // ... etc
  } else {
    setErrorMsg("An unexpected error occurred");
  }
}
```

---

### MEDIUM PRIORITY IMPROVEMENTS

#### 9. **Email Verification in Auth Layout**

**Location:** [app/login/layout.tsx](app/login/layout.tsx)

**Suggestion:** Show a message if user's email is not yet verified:

```typescript
if (user && !user.email_confirmed_at) {
  redirect("/register/confirmation?email_resend=true");
}
```

---

#### 10. **No Password Reset Flow**

**Missing:** `/auth/reset-password` or similar

**Recommendation:** Add password reset:

```typescript
// /auth/reset-password
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  // ...
}
```

---

#### 11. **Admin Account Creation Manual**

**Note:** Admins must be created manually (likely via SQL in Supabase console)

**Consideration:** Add a secure admin provisioning flow (with invite links, etc.)

---

## 6. Security Checklist

- ✅ Uses HTTPS only (enforced by Next.js + deployment)
- ✅ Supabase RLS prevents data leaks
- ✅ Session tokens in cookies (http-only by default)
- ⚠️ **CSRF protection missing on `/logout`** (see issue #7)
- ⚠️ **No rate limiting on auth endpoints**
- ⚠️ **Public table access via UUID only** (should consider additional safeguards)
- ✅ Password validation enforced (6+ chars)
- ⚠️ **No brute-force protection visible**

---

## 7. Summary

Your authentication system is **well-structured and follows modern best practices** with proper use of Supabase SSR patterns and RLS. However, there are **7-11 issues** ranging from critical (race conditions, CSRF) to medium-priority (UX improvements, logging).

### Quick Wins (Do These First):

1. Fix CSRF on `/logout` (change GET → POST)
2. Add logout link to admin dashboard
3. Handle session expiration on client

### Important (Do These Soon):

4. Improve error messaging in auth forms
5. Add password reset flow
6. Implement rate limiting on auth endpoints

### Nice to Have:

7. Convert login flow to server action
8. Add session monitoring hook

---

## Files Involved

**Core Auth Files:**

- [lib/supabase/client.ts](lib/supabase/client.ts) - Browser client
- [lib/supabase/server.ts](lib/supabase/server.ts) - Server client
- [lib/auth/restaurant.ts](lib/auth/restaurant.ts) - Restaurant auth utils
- [lib/supabase/admin.ts](lib/supabase/admin.ts) - Admin utils
- [middleware.ts](middleware.ts) - Session sync

**Auth UI:**

- [app/login/LoginClient.tsx](app/login/LoginClient.tsx)
- [app/login/layout.tsx](app/login/layout.tsx)
- [app/register/page.tsx](app/register/page.tsx)
- [app/auth/admin/sign-in/AdminSignInClient.tsx](app/auth/admin/sign-in/AdminSignInClient.tsx)

**Protected Routes:**

- [app/dashboard/layout.tsx](app/dashboard/layout.tsx)
- [app/admin/layout.tsx](app/admin/layout.tsx)
- [app/logout/route.ts](app/logout/route.ts)

**Database:**

- [supabase/schema.sql](supabase/schema.sql)
- [supabase/migrations/admin_system.sql](supabase/migrations/admin_system.sql)
