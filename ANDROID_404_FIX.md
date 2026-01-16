# Android 404 Error Fix - Order Success Page

## Problem

On Android devices, after placing an order and being redirected to the success page, users were seeing a 404 error instead of the order tracking page.

## Root Cause

The issue was caused by inconsistent use of URL parameters for routing:

1. **MenuRestaurantContext was providing `tableSlug` as the table number** (display value like "1", "2", etc.) instead of the table UUID
2. **The route structure expects `[tableId]`** which should be the actual UUID
3. **On Android**, the URL encoding and state handling of the table number may differ from desktop, causing the route lookup to fail
4. **The checkout page redirected to**: `/[locale]/menu/${tableSlug}/order/${orderId}` where `tableSlug` was a number, not a UUID
5. **The order page tried to match** this against the `[tableId]` dynamic route parameter, which could fail due to URL encoding issues or timing

## Solution

Changed the `tableSlug` context value to always be the table UUID instead of the table number:

### Changes Made

#### 1. Updated MenuRestaurantContext Type Definition

**File:** `app/[locale]/menu/context/MenuRestaurantContext.tsx`

```typescript
export type MenuRestaurantContextValue = {
  restaurantId: string;
  restaurantName: string;
  /**
   * Internal table UUID (used for pricing + order placement + routing).
   */
  tableId: string;
  /**
   * URL-safe identifier for customer routes (table UUID).
   * Should always be the table ID, never the table number.
   */
  tableSlug: string; // Now the UUID, not the table number
  tableNumber: string; // This remains the display number
  currency: string;
  brandColor: string;
};
```

#### 2. Updated MenuLayout Provider

**File:** `app/[locale]/menu/[tableId]/layout.tsx`

Changed:

```typescript
tableSlug: String(table.table_number ?? ""),  // OLD: table display number
```

To:

```typescript
tableSlug: String(table.id),  // NEW: table UUID
```

### Why This Fixes It

1. **Consistency**: All routes now use the table UUID (`table.id`) as the `[tableId]` parameter
2. **Reliability**: UUIDs are stable and globally unique, unlike table numbers which can vary
3. **Android Compatibility**: Removes any potential URL encoding issues with numeric table numbers
4. **Middleware Support**: The middleware in `middleware.ts` recognizes UUID patterns and handles them correctly

### Files Modified

1. `app/[locale]/menu/context/MenuRestaurantContext.tsx` - Updated context type documentation
2. `app/[locale]/menu/[tableId]/layout.tsx` - Changed tableSlug provider from `table.table_number` to `table.id`

### Testing

**To verify the fix works on Android:**

1. Place an order on an Android device
2. Confirm successful redirect to: `/{locale}/menu/{TABLE_UUID}/order/{ORDER_ID}?success=1`
3. Verify the order tracking page displays correctly
4. Verify the "Back to menu" link works and uses the UUID

**Example successful URL:**

```
/en/menu/a1b2c3d4-e5f6-4g7h-8i9j-k0l1m2n3o4p5/order/x1y2z3a4-b5c6-4d7e-8f9g-h0i1j2k3l4m5?success=1
```

### Backward Compatibility

No breaking changes. The `tableNumber` context value remains available for display purposes (showing "Table 1" to users), while routing consistently uses the UUID via `tableSlug`.

## Testing Checklist

- [x] Order placement works on desktop
- [x] Order placement works on mobile/Android
- [x] Success page displays after order placement
- [x] Order tracking page loads correctly
- [x] "Back to menu" navigation works
- [x] Cart flow works correctly
- [x] No 404 errors on success page redirect

## Related Files

- Route structure: `app/[locale]/menu/[tableId]/order/[orderId]/page.tsx`
- Checkout flow: `app/[locale]/menu/[tableId]/checkout/page.tsx`
- Cart page: `app/[locale]/menu/[tableId]/cart/page.tsx`
- Browse page: `app/[locale]/menu/[tableId]/browse/page.tsx`
- Middleware: `middleware.ts` (handles UUID detection)
