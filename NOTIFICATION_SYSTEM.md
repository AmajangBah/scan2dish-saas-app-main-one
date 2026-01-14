# Notification System Upgrade

## Overview

The notification system has been completely redesigned to provide **instant, reliable notifications** with zero delay. The system now supports **multiple notification sound options** that users can customize and persist across sessions.

## Key Features

### 1. **Instant Notifications**

- Notifications trigger immediately when orders are placed
- Notification sounds play every time an action occurs (no debouncing)
- Zero artificial delays introduced by the system

### 2. **Multiple Sound Options**

Users can choose from 5 different notification sounds:

- **Chime** (default) - Classic two-tone chime
- **Bell** - Clear bell tone
- **Ping** - Soft ping sound
- **Alert** - High-pitched alert tone
- **Ding** - Single ding tone

### 3. **Persistent User Preferences**

- Selected sound type is saved to localStorage
- Volume settings persist across sessions
- Sound enabled/disabled state is remembered
- No need to reconfigure on each visit

### 4. **Action-Based Notifications**

Notifications trigger for:

- New order arrivals (immediate playback)
- Quantity changes (increase/decrease buttons)
- Any other user actions requiring feedback

## Implementation

### Core Hook: `useNotificationSound`

Located in: `hooks/useNotificationSound.ts`

```typescript
const {
  soundEnabled, // Boolean: sound enabled/disabled
  setSoundEnabled, // Toggle sound on/off
  volume, // Number: 0-1 (default 0.6)
  setVolume, // Update volume
  selectedSound, // Current sound type
  setSelectedSound, // Change sound
  playSound, // Play immediately
  notifyNewOrder, // Notify on new order
  notifyAction, // Notify on action
  ensureAudioReady, // Ensure audio context is ready
  availableSounds, // All available sounds
} = useNotificationSound(restaurantId);
```

### Usage Examples

#### In Components

```typescript
import { useNotificationSound } from "@/hooks/useNotificationSound";

function MyComponent() {
  const { notifyAction, notifyNewOrder } = useNotificationSound(restaurantId);

  // Play sound for an action
  const handleClick = async () => {
    await notifyAction("user-action");
  };

  // Notify on order
  const handleNewOrder = async (orderId) => {
    await notifyNewOrder(orderId);
  };
}
```

#### In Quantity Selector

```typescript
// Plays sound every time quantity is increased/decreased
const handleIncrease = async () => {
  onChange(value + 1);
  await notifyAction("quantity-increase");
};
```

#### In Order Notifications

```typescript
// Plays sound instantly when new order arrives
function maybeNotifyNewOrder(orderId: string) {
  notifyNewOrder(orderId);
}
```

### Settings Component

Located in: `components/NotificationSettings.tsx`

Provides a complete UI for users to customize notifications:

- Toggle sound on/off
- Select preferred notification sound
- Adjust volume with slider
- Test sound button

## Sound Definitions

Each sound is defined with:

- **name**: Unique identifier (e.g., "chime")
- **displayName**: User-friendly name (e.g., "Chime")
- **description**: Short explanation
- **generate**: Function to generate sound using Web Audio API

### Adding Custom Sounds

To add a new notification sound, add it to the `NOTIFICATION_SOUNDS` object in `hooks/useNotificationSound.ts`:

```typescript
const NOTIFICATION_SOUNDS: Record<NotificationSoundType, SoundDefinition> = {
  // ... existing sounds
  mysound: {
    name: "mysound",
    displayName: "My Sound",
    description: "Description of my sound",
    generate: (ctx, gain, now) => {
      // Use Web Audio API to generate sound
      const osc = ctx.createOscillator();
      osc.frequency.value = 1000;
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + 0.1);
    },
  },
};
```

## Storage

All preferences are stored in localStorage with keys:

- `s2d_sound_enabled_{restaurantId}` - Boolean
- `s2d_sound_volume_{restaurantId}` - Number (0-1)
- `s2d_sound_type_{restaurantId}` - String (sound name)
- `s2d_notified_order_ids_{restaurantId}` - JSON array of order IDs

## Browser Compatibility

The system uses the Web Audio API, which is supported in:

- Chrome/Edge 15+
- Firefox 25+
- Safari 6+
- Opera 12+

Auto-enable on first interaction ensures compatibility with browser autoplay policies.

## Performance Considerations

### Instant Playback

- Sounds are generated directly using Web Audio API (no file loading)
- No network latency
- Microsecond-level precision

### Memory Efficient

- Single AudioContext per component
- Lazy initialization on first use
- No sound file assets to load

### Multiple Rapid Notifications

- Each notification plays independently
- No debouncing or queuing
- Full overlap support (multiple sounds can play together)

## User Experience

### First Time User

1. User loads page
2. On first interaction (click or keystroke), audio context initializes
3. System plays a test sound to confirm audio is working
4. User can then customize sounds in settings

### Customization Flow

1. User navigates to notification settings
2. Selects preferred sound from dropdown
3. Adjusts volume with slider
4. Clicks "Test Sound" to preview
5. Changes are automatically saved to localStorage

## Technical Details

### AudioContext Management

- Created on first use (browser autoplay policy compliant)
- Automatically resumed if suspended
- Singleton pattern per component instance

### Error Handling

- Graceful fallback if AudioContext unavailable
- Console logging for debugging
- User-friendly error messages via toast notifications

### State Persistence

- All preferences persisted to localStorage
- Automatic loading on component mount
- No server-side storage required

## Testing

### Manual Testing Checklist

- [ ] Notifications play instantly on order arrival
- [ ] Notifications play on every quantity change
- [ ] Volume control adjusts all sounds
- [ ] Sound selection persists after refresh
- [ ] Volume persists after refresh
- [ ] Test sound button works
- [ ] Toggling sound on/off works
- [ ] All 5 sounds play correctly
- [ ] Multiple rapid notifications play together

### Browser Testing

- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers (iOS Safari, Chrome Android)

## Migration Notes

### From Old System

The old system had:

- Single hardcoded sound (two-tone chime)
- Delayed notifications via `ensureAudioReady().then()`
- Manual state management in multiple components
- Potential missed notifications during rapid actions

### New System Advantages

- Multiple sound options
- Instant playback with zero artificial delay
- Centralized state management via hook
- No missed notifications (every action plays)
- Type-safe with TypeScript

## Future Enhancements

Potential improvements for future versions:

1. Allow upload of custom audio files
2. Different sounds for different event types
3. Haptic feedback support
4. Do Not Disturb mode with schedule
5. Sound playback analytics/logging
6. Webhook notifications for mobile
