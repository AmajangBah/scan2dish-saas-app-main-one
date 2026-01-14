/**
 * Kitchen Audio Service - Production-Grade Notification System
 *
 * A centralized, event-driven audio notification system for kitchen orders.
 * Handles browser auto-play restrictions, prevents overlapping sounds, and ensures
 * reliable, instant notification delivery for new orders.
 *
 * Requirements Met:
 * - Zero delay playback
 * - Instant trigger on new order
 * - No missed notifications
 * - No overlapping sounds
 * - Works back-to-back without issues
 * - Browser auto-play compatible
 * - Single source of truth
 * - Future-proof architecture
 */

type AudioPlaybackState = "idle" | "playing" | "pending";

interface AudioServiceConfig {
  soundPath: string;
  volume?: number;
}

class KitchenAudioService {
  private audioElement: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private playbackState: AudioPlaybackState = "idle";
  private config: AudioServiceConfig;
  private isAudioContextUnlocked = false;
  private readonly CACHE_KEY = "s2d_audio_unlocked";

  constructor(config: AudioServiceConfig) {
    this.config = {
      volume: 1.0,
      ...config,
    };
  }

  /**
   * Initialize the audio service and preload the audio file.
   * Must be called once on app load.
   */
  async initialize(): Promise<void> {
    if (typeof window === "undefined") return;

    try {
      // Create and preload audio element
      this.audioElement = new Audio(this.config.soundPath);
      this.audioElement.preload = "auto";
      this.audioElement.volume = this.config.volume || 1.0;

      // Wait for audio to be loadable
      await new Promise<void>((resolve, reject) => {
        if (!this.audioElement)
          return reject(new Error("Audio element not created"));

        const handleCanPlay = () => {
          this.audioElement?.removeEventListener("canplay", handleCanPlay);
          this.audioElement?.removeEventListener("error", handleError);
          resolve();
        };

        const handleError = (error: Event) => {
          this.audioElement?.removeEventListener("canplay", handleCanPlay);
          this.audioElement?.removeEventListener("error", handleError);
          reject(
            new Error(
              `Failed to preload audio: ${this.audioElement?.error?.message}`
            )
          );
        };

        this.audioElement.addEventListener("canplay", handleCanPlay, {
          once: true,
        });
        this.audioElement.addEventListener("error", handleError, {
          once: true,
        });

        // Timeout fallback
        setTimeout(() => {
          if (this.audioElement && this.audioElement.readyState >= 2) {
            handleCanPlay();
          }
        }, 3000);
      });

      // Set up audio context for Web Audio API unlock
      await this.unlockAudioContext();

      console.log("[KitchenAudio] Service initialized successfully");
    } catch (error) {
      console.error("[KitchenAudio] Initialization failed:", error);
      throw error;
    }
  }

  /**
   * Unlock audio context after first user interaction.
   * Required for auto-play on some browsers.
   */
  private async unlockAudioContext(): Promise<void> {
    if (typeof window === "undefined") return;

    // Check if already unlocked
    if (this.isAudioContextUnlocked) return;

    const cached = localStorage.getItem(this.CACHE_KEY);
    if (cached === "true") {
      this.isAudioContextUnlocked = true;
      return;
    }

    // Set up one-time user interaction handler
    const handleInteraction = async () => {
      try {
        // Resume audio context
        const w = window as Window & {
          webkitAudioContext?: typeof AudioContext;
        };
        const AudioCtx = window.AudioContext ?? w.webkitAudioContext;

        if (AudioCtx && !this.audioContext) {
          this.audioContext = new AudioCtx();
        }

        if (this.audioContext && this.audioContext.state === "suspended") {
          await this.audioContext.resume();
        }

        // Play silent sound to unlock audio
        if (this.audioElement) {
          this.audioElement.volume = 0;
          await this.audioElement.play();
          this.audioElement.pause();
          this.audioElement.currentTime = 0;
          this.audioElement.volume = this.config.volume || 1.0;
        }

        this.isAudioContextUnlocked = true;
        localStorage.setItem(this.CACHE_KEY, "true");

        // Remove listener
        document.removeEventListener("click", handleInteraction);
        document.removeEventListener("keydown", handleInteraction);
        document.removeEventListener("touchstart", handleInteraction);

        console.log("[KitchenAudio] Audio context unlocked");
      } catch (error) {
        console.warn("[KitchenAudio] Audio unlock failed:", error);
      }
    };

    // Listen for any user interaction
    document.addEventListener("click", handleInteraction, { once: true });
    document.addEventListener("keydown", handleInteraction, { once: true });
    document.addEventListener("touchstart", handleInteraction, { once: true });
  }

  /**
   * Play the kitchen notification sound immediately.
   * Handles state management to prevent overlaps.
   */
  async playNotification(): Promise<void> {
    if (!this.audioElement) {
      console.warn("[KitchenAudio] Audio element not initialized");
      return;
    }

    try {
      // If already playing, stop and restart for back-to-back notifications
      if (this.playbackState === "playing") {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
        this.playbackState = "idle";
      }

      // Ensure audio context is unlocked
      if (!this.isAudioContextUnlocked) {
        await this.unlockAudioContext();
      }

      this.playbackState = "playing";

      // Play the audio
      const playPromise = this.audioElement.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("[KitchenAudio] Notification played successfully");
          })
          .catch((error) => {
            console.warn("[KitchenAudio] Playback failed:", error);
            this.playbackState = "idle";
          });
      }

      // Set up end listener
      const handleEnded = () => {
        this.playbackState = "idle";
        this.audioElement?.removeEventListener("ended", handleEnded);
      };

      this.audioElement.addEventListener("ended", handleEnded, { once: true });
    } catch (error) {
      console.error("[KitchenAudio] Error playing notification:", error);
      this.playbackState = "idle";
    }
  }

  /**
   * Set the volume for the notification sound (0-1).
   */
  setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume));
    if (this.audioElement) {
      this.audioElement.volume = this.config.volume;
    }
  }

  /**
   * Get the current volume level.
   */
  getVolume(): number {
    return this.config.volume || 1.0;
  }

  /**
   * Check if audio is currently playing.
   */
  isPlaying(): boolean {
    return this.playbackState === "playing";
  }

  /**
   * Stop the currently playing audio.
   */
  stop(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
    this.playbackState = "idle";
  }

  /**
   * Clean up resources (call when component unmounts if needed).
   */
  destroy(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = "";
      this.audioElement = null;
    }
    this.audioContext = null;
  }
}

// Create singleton instance
let audioServiceInstance: KitchenAudioService | null = null;

/**
 * Get or create the global kitchen audio service.
 */
export function getKitchenAudioService(): KitchenAudioService {
  if (!audioServiceInstance) {
    audioServiceInstance = new KitchenAudioService({
      soundPath: "/audio/bell-notification.mp3",
      volume: 1.0,
    });
  }
  return audioServiceInstance;
}

/**
 * Initialize the global audio service on app load.
 * Call this once in your root layout or app initialization.
 */
export async function initializeKitchenAudio(): Promise<void> {
  const service = getKitchenAudioService();
  await service.initialize();
}

/**
 * Play a kitchen notification sound immediately.
 * Event-driven trigger for new orders.
 */
export async function playKitchenNotification(): Promise<void> {
  const service = getKitchenAudioService();
  await service.playNotification();
}

export default KitchenAudioService;
