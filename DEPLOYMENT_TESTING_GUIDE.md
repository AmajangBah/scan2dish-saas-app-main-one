# 📋 DEPLOYMENT & TESTING GUIDE

## Pre-Deployment Checklist

### 1. **Verify File Changes**

```bash
# These files were modified:
ls -la middleware.ts                      # ✓ NEW FILE created
ls -la proxy.ts.DELETED_DO_NOT_USE       # ✓ OLD FILE renamed (disabled)
cat lib/supabase/server.ts               # ✓ Comments updated, logic clean
cat lib/supabase/client.ts               # ✓ No changes (already correct)
```

### 2. **Verify No Broken Imports**

```bash
# Ensure no files import the deleted proxy.ts
grep -r "from.*proxy" app lib  # Should return nothing
grep -r "import.*proxy" app lib  # Should return nothing
```

### 3. **Install Dependencies**

```bash
npm install
# Verify these are present:
# - @supabase/auth-helpers-nextjs ^0.15.0
# - @supabase/ssr ^0.8.0
```

### 4. **Build Test**

```bash
npm run build

# Expected: No errors
# You might see warnings (normal) but no TypeScript errors
# If errors: check middleware.ts import statements
```

### 5. **Local Testing**

```bash
npm run dev

# Test flows (see next section)
```

---

## Local Testing (Before Production)

### **Test 1: Restaurant User Login Flow**

```
1. Open http://localhost:3000/login
2. Enter restaurant email + password
3. Click "Sign In"
   ✓ Should redirect to /onboarding or /dashboard
   ✓ NO infinite redirect loops
4. Refresh the page (F5)
   ✓ Should STAY logged in (no redirect to login)
5. Open DevTools → Application → Cookies
   ✓ Should see sb-*-auth-token.0
   ✓ Should see sb-*-auth-token.1
   ✓ Values should be clean JWT segments (starting with "ey")
   ✓ NO "base64-" prefix
   ✓ NO truncated/corrupted characters
6. Check server logs (npm run dev terminal)
   ✓ Should see: "User session check: user = [uuid]"
   ✓ Should NOT see: "FORCED httpOnly:true"
   ✓ Should NOT see: "Failed to decode"
```

### **Test 2: Dashboard Navigation**

```
1. While logged in, navigate to /dashboard
2. Should load immediately (no redirect)
3. Click around: Orders, Menu, Settings, etc.
4. Should stay logged in (user context preserved)
5. Open DevTools → Network tab
   ✓ Should NOT see repeated login redirects
   ✓ Cookies should remain stable (same values)
```

### **Test 3: Session Refresh**

```
1. Log in to dashboard
2. Keep page open for 1 minute
3. Check browser cookies every 30 seconds
   ✓ Values might change (Supabase auto-refresh)
   ✓ But should never see "base64-" prefix
   ✓ Should always be valid JWT format
4. After 60 minutes
   ✓ Token might expire in browser
   ✓ Next request should trigger refresh
   ✓ User should stay logged in (automatic)
```

### **Test 4: Admin User Login Flow**

```
1. Open http://localhost:3000/auth/admin/sign-in
2. Enter admin email + password
3. Click "Sign In"
   ✓ Should redirect to /admin
   ✓ NO infinite redirects
4. Refresh page
   ✓ Should STAY logged in
5. Same cookie verification as Test 1
```

### **Test 5: Cookie Integrity Check**

```javascript
// In browser DevTools console:

// ✓ Get auth tokens
document.cookie
  .split(";")
  .filter((c) => c.includes("auth-token"))
  .forEach((c) => console.log(c));

// Expected output: sb-[uuid]-auth-token.0=eyJ...
// NOT: sb-[uuid]-auth-token.0=base64-eyJ...

// ✓ Verify no corrupted values
const cookies = document.cookie.split(";");
cookies.forEach((c) => {
  const [name, value] = c.split("=");
  if (name.includes("auth-token")) {
    console.log(`${name}: ${value.substring(0, 30)}...`);
    // Should show clean JWT, not base64- or JSON garbage
  }
});
```

### **Test 6: Logout & Re-login**

```
1. While logged in, click "Logout"
   ✓ Should redirect to /login
   ✓ Auth cookies should be deleted
2. Log back in
   ✓ Should work normally
   ✓ Should get fresh auth tokens
   ✓ Should be able to access dashboard immediately
```

### **Test 7: Multiple Tabs**

```
1. Log in in Tab A
2. Open Tab B to same domain
   ✓ Tab B should see same session (shared cookies)
   ✓ Both tabs should show logged-in state
3. Refresh Tab B
   ✓ Should stay logged in
4. Click logout in Tab A
   ✓ Tab B should also be logged out (next action)
```

---

## Server Logs to Watch

### **Good Signs (Expected)**

```
[middleware] User session check: user = a1b2c3d4-e5f6-... (user@example.com)
[middleware] Dashboard route check: user = authenticated
[middleware] Restaurant query: found restaurant ID x1y2z3...
[auth] User found: a1b2c3d4-e5f6-...
```

### **Bad Signs (Problems)**

```
❌ [Proxy] FORCED httpOnly:true  → proxy.ts still running (should be gone)
❌ [Proxy] Failed to decode JSON → proxy.ts still parsing cookies
❌ Failed to parse session JSON → Corrupted auth cookies
❌ Unterminated string in JSON → Cookie encoding error
❌ [middleware] user = null → Session lost (still broken)
```

---

## Supabase Dashboard Checks

### **Auth Logs**

```
Navigate: Authentication → User Management → Logs

Good Signs:
✓ Successful JWT access token grants
✓ Successful session refreshes
✓ User IDs matching your test accounts

Bad Signs:
✗ JWT decoding errors
✗ Session validation failures
✗ "Unterminated string" errors
✗ Repeated token invalidations
```

### **Stored Sessions**

```
If Supabase stores session data:
Navigate: Authentication → Sessions (if available)

Good Signs:
✓ Active sessions for logged-in users
✓ Proper expiration times (1 hour for access token)
✓ Clean session state

Bad Signs:
✗ Corrupted session data
✗ Missing user_id fields
✗ Invalid JWT payloads
```

---

## Rollback Plan

If something breaks after deployment:

### **Option 1: Quick Rollback (Disable Middleware)**

```typescript
// middleware.ts - add early return to disable
export async function middleware(request: NextRequest) {
  // Temporarily skip all auth handling
  return NextResponse.next();
}
```

### **Option 2: Full Rollback (Restore Old Proxy)**

```bash
# Rename back to re-enable old proxy
mv proxy.ts.DELETED_DO_NOT_USE proxy.ts

# Restore old lib/supabase/server.ts from git
git checkout lib/supabase/server.ts

# Delete new middleware
rm middleware.ts
```

### **Option 3: Git Rollback**

```bash
git revert <commit-hash>
npm run build
npm run dev
# Test locally before re-pushing
```

---

## Troubleshooting

### **Problem: "Cannot find module '@supabase/auth-helpers-nextjs'"**

```bash
# Solution:
npm install
npm run build
```

### **Problem: "middleware.ts not being called"**

```
Check:
1. Is file named exactly "middleware.ts" (not proxy.ts)?
2. Is it in root directory (same level as app/, lib/)?
3. Does config.matcher look correct?
4. Are there no syntax errors in the file?
5. Try: npm run build (will show errors if present)
```

### **Problem: "Still seeing 'FORCED httpOnly:true' in logs"**

```
Cause: Old proxy.ts is still running
Solution:
1. Verify proxy.ts is renamed to proxy.ts.DELETED_DO_NOT_USE
2. Clear .next build cache: rm -rf .next
3. Rebuild: npm run build
4. Restart: npm run dev
```

### **Problem: "getUser() returns null after middleware runs"**

```
This should NOT happen with new middleware.

If it does:
1. Check Supabase environment variables (.env.local)
2. Verify NEXT_PUBLIC_SUPABASE_URL is correct
3. Verify NEXT_PUBLIC_SUPABASE_ANON_KEY is correct
4. Check Supabase auth logs for JWT decode errors
5. Verify cookies were sent to server (check Network tab)
```

### **Problem: "Cookies still being deleted (maxAge: 0)"**

```
This should NOT happen with new middleware.

If it does:
1. Verify proxy.ts is completely disabled
2. Check lib/supabase/server.ts doesn't have forced options
3. Look for other files manipulating auth cookies
4. Check npm_modules/@supabase version is correct
5. Clear .next: rm -rf .next && npm run build
```

---

## Production Deployment

### **Before Going Live:**

1. ✓ All local tests pass (see test flows above)
2. ✓ Build completes without errors
3. ✓ Server logs show expected messages
4. ✓ Browser cookies are clean JWT segments
5. ✓ No "FORCED" or "Failed to decode" messages
6. ✓ Admin login works
7. ✓ Restaurant login works
8. ✓ Session persists across page refreshes

### **Deploy Steps:**

```bash
# 1. Commit changes
git add middleware.ts SUPABASE_AUTH_FIX_COMPLETE.md
git commit -m "fix: Replace proxy.ts with official Supabase middleware pattern

- Remove custom auth proxy (proxy.ts) - was corrupting sessions
- Implement createMiddlewareClient() pattern
- Eliminate forced cookie options
- Fix 'Unterminated string in JSON' errors
- Restore stable session management"

# 2. Push to production branch
git push origin main

# 3. Your CI/CD pipeline will:
# - Run npm install
# - Run npm run build
# - Deploy if build succeeds
# - Run smoke tests

# 4. Monitor Supabase auth logs for errors
# 5. Monitor user feedback for login issues
```

### **Monitor After Deployment:**

```bash
# First 24 hours:
- Watch Supabase auth logs for errors
- Monitor error tracking (Sentry, etc.) for auth failures
- Check user reports of login issues
- Verify no increase in "session expired" complaints

# First week:
- Compare metrics pre/post deployment
- Verify auth-related error rates decreased
- Check average session duration increased
- Confirm no cookie-related issues
```

---

## Success Criteria

Your fix is working when:

- ✅ No more "Unterminated string in JSON" errors
- ✅ No more repeated auth cookie deletions
- ✅ No more infinite redirect loops
- ✅ Dashboard loads on first request
- ✅ Session persists across refreshes
- ✅ User stays logged in without manual intervention
- ✅ Admin panel works
- ✅ Restaurant dashboard works
- ✅ Auth logs are clean (no decode errors)
- ✅ No more user = null in middleware

---

**Questions?** Check [SUPABASE_AUTH_FIX_COMPLETE.md](./SUPABASE_AUTH_FIX_COMPLETE.md) for detailed root cause analysis.
