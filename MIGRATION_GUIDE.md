# 📚 Migration Guide - From Old to New Notification System

## Overview

This document explains what changed and how to migrate any custom code that used the old `useNotificationSound` hook.

---

## What Changed

### Old System

```typescript
// OLD - DO NOT USE
import { useNotificationSound } from "@/hooks/useNotificationSound";

function MyComponent({ restaurantId }: { restaurantId: string }) {
  const {
    playSound,
    notifyAction,
    notifyNewOrder,
    soundEnabled,
    setVolume,
    // ... etc
  } = useNotificationSound(restaurantId);

  const handleOrderReceived = async () => {
    await notifyNewOrder(orderId); // Complex async logic
  };

  return /* ... */;
}
```

### New System

```typescript
// NEW - USE THIS
import { playKitchenNotification } from "@/lib/services/kitchenAudioService";

function MyComponent() {
  const handleOrderReceived = async () => {
    await playKitchenNotification(); // One simple function
  };

  return /* ... */;
}
```

---

## Migration Steps

### Step 1: Remove Old Hook Import

**Before:**

```typescript
import { useNotificationSound } from "@/hooks/useNotificationSound";
```

**After:**

```typescript
// Remove the import entirely, or:
import { playKitchenNotification } from "@/lib/services/kitchenAudioService";
```

### Step 2: Remove Hook Call

**Before:**

```typescript
const { playSound, notifyAction, notifyNewOrder } =
  useNotificationSound(restaurantId);
```

**After:**

```typescript
// Delete this line entirely - no hook needed
```

### Step 3: Replace Function Calls

**Before:**

```typescript
// Notify on new order
await notifyNewOrder(orderId);

// Notify on action
await notifyAction("user-action");

// Play sound
playSound();
```

**After:**

```typescript
// For ANY notification - use this one function
await playKitchenNotification();
```

### Step 4: Remove Settings Components

**Before:**

```typescript
import NotificationSettings from "@/components/NotificationSettings";

export default function MySettings() {
  return <NotificationSettings restaurantId={restaurantId} />;
}
```

**After:**

```typescript
// Remove the import and component usage
// Audio is now handled globally - no per-restaurant settings UI needed
```

---

## API Comparison

### Old API (DEPRECATED)

| Function                             | Purpose                     | Status         |
| ------------------------------------ | --------------------------- | -------------- |
| `useNotificationSound(restaurantId)` | Hook to use in component    | ❌ **DELETED** |
| `playSound()`                        | Play current selected sound | ❌ **DELETED** |
| `notifyNewOrder(orderId)`            | Notify on new order         | ❌ **DELETED** |
| `notifyAction(actionType)`           | Notify on action            | ❌ **DELETED** |
| `soundEnabled`                       | State for sound on/off      | ❌ **DELETED** |
| `setSoundEnabled()`                  | Enable/disable sound        | ❌ **DELETED** |
| `selectedSound`                      | Current sound selection     | ❌ **DELETED** |
| `setSelectedSound()`                 | Change sound                | ❌ **DELETED** |
| `volume`                             | Volume level state          | ❌ **DELETED** |
| `setVolume()`                        | Change volume               | ❌ **DELETED** |

### New API (CURRENT)

| Function                    | Purpose                  | Status           |
| --------------------------- | ------------------------ | ---------------- |
| `playKitchenNotification()` | Play notification sound  | ✅ **USE THIS**  |
| `getKitchenAudioService()`  | Get service instance     | ✅ Advanced only |
| `initializeKitchenAudio()`  | Initialize (auto-called) | ✅ Auto-init     |

### Advanced Service Methods

If you need advanced control:

```typescript
import { getKitchenAudioService } from "@/lib/services/kitchenAudioService";

const service = getKitchenAudioService();

// Get current volume
const vol = service.getVolume(); // Returns 0-1

// Set volume
service.setVolume(0.8); // 0 to 1

// Check if playing
const playing = service.isPlaying(); // true/false

// Stop current playback
service.stop();

// Destroy service (rarely needed)
service.destroy();
```

---

## Examples

### Example 1: Kitchen Order Notification

**Before:**

```typescript
const { notifyNewOrder } = useNotificationSound(restaurantId);

function handleNewOrder(orderId: string) {
  console.log("New order:", orderId);
  await notifyNewOrder(orderId);
}
```

**After:**

```typescript
import { playKitchenNotification } from "@/lib/services/kitchenAudioService";

function handleNewOrder(orderId: string) {
  console.log("New order:", orderId);
  await playKitchenNotification();
}
```

### Example 2: User Action Notification

**Before:**

```typescript
const { notifyAction } = useNotificationSound(restaurantId);

function handleQuantityChange() {
  // ... update quantity ...
  await notifyAction("quantity-change");
}
```

**After:**

```typescript
function handleQuantityChange() {
  // ... update quantity ...
  // No notification call needed - we don't notify on actions anymore
  // (Sound is reserved for kitchen orders only)
}
```

### Example 3: Test Sound

**Before:**

```typescript
const { playSound } = useNotificationSound(restaurantId);

<button onClick={playSound}>Test Sound</button>;
```

**After:**

```typescript
import { playKitchenNotification } from "@/lib/services/kitchenAudioService";

<button onClick={() => playKitchenNotification()}>Test Sound</button>;
```

---

## Breaking Changes

### Settings Component Removed

The `NotificationSettings` UI component is no longer available.

**If you had settings UI:**

```typescript
// OLD - NO LONGER AVAILABLE
<NotificationSettings restaurantId={restaurantId} />
```

**New approach:**
Audio is now handled globally. If you need per-user volume preferences in the future, implement them separately using localStorage and `getKitchenAudioService().setVolume()`.

### Hook No Longer Exists

The `useNotificationSound` hook has been completely removed.

**If you have code using this hook:**
Remove the import and use `playKitchenNotification()` instead.

### Per-Sound Selection Removed

You can no longer select between different sounds (chime, bell, ping, etc.).

**The system now:**

- Uses one kitchen bell sound for all notifications
- Sound is optimized for kitchen environment
- If you need different sounds in future, modify `kitchenAudioService.ts` to add them

### Settings Storage Removed

localStorage keys like `s2d_sound_enabled`, `s2d_sound_volume`, etc. are no longer used.

**New storage:**
Only `s2d_kitchen_notified_order_ids` is used (to track which orders have triggered notifications).

---

## Troubleshooting Migration

### "Module not found: useNotificationSound"

**Solution**: Remove the import and replace with `playKitchenNotification`

### "NotificationSettings is not exported"

**Solution**: Remove the import and don't render the component

### "playSound is not a function"

**Solution**: Use `await playKitchenNotification()` instead

### Component won't compile

**Solution**: Delete all references to `useNotificationSound`, ensure you're using new import

---

## Feature Mapping

| Old Feature                         | New Equivalent                | Notes                              |
| ----------------------------------- | ----------------------------- | ---------------------------------- |
| Multiple sounds (chime, bell, etc.) | One kitchen bell sound        | Optimized for kitchen              |
| Per-restaurant sound selection      | N/A                           | Can be added later if needed       |
| Per-user volume preferences         | Can use service.setVolume()   | Implement separately if needed     |
| Settings UI component               | N/A                           | Removed - simpler system           |
| Sound on/off toggle                 | Always on for kitchen         | Can add per-view setting if needed |
| Sound test button                   | Use playKitchenNotification() | Same function                      |

---

## Future Enhancement: Custom Sounds

If you want to add support for custom sounds later:

```typescript
// In kitchenAudioService.ts constructor:

constructor(config: AudioServiceConfig) {
  this.config = {
    soundPath: "/audio/your-custom-sound.mp3",  // Change this
    volume: 1.0,
    ...config,
  };
}
```

Or make it configurable:

```typescript
import { getKitchenAudioService } from "@/lib/services/kitchenAudioService";

// Create new instance with custom sound
const customService = new KitchenAudioService({
  soundPath: "/audio/custom-bell.mp3",
  volume: 0.8,
});
```

---

## Future Enhancement: Volume Preferences

If you want to add user volume preferences:

```typescript
import { getKitchenAudioService } from "@/lib/services/kitchenAudioService";

// In your settings component:
function VolumeControl() {
  const service = getKitchenAudioService();
  const currentVolume = service.getVolume();

  return (
    <input
      type="range"
      min="0"
      max="1"
      step="0.1"
      value={currentVolume}
      onChange={(e) => service.setVolume(parseFloat(e.target.value))}
    />
  );
}
```

---

## Questions?

- **Quick start**: See `KITCHEN_NOTIFICATION_QUICK_GUIDE.md`
- **Full docs**: See `KITCHEN_NOTIFICATION_SYSTEM.md`
- **Code reference**: See `lib/services/kitchenAudioService.ts` (well-commented)

---

**Completed**: January 12, 2026  
**Old System**: Fully removed  
**New System**: Production-ready
