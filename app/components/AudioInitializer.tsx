"use client";

import { useEffect } from "react";
import { initializeKitchenAudio } from "@/lib/services/kitchenAudioService";

/**
 * Initializes the kitchen audio service on app load.
 * Preloads the notification sound file for instant playback.
 */
export default function AudioInitializer() {
  useEffect(() => {
    initializeKitchenAudio().catch((error) => {
      console.error("[App] Failed to initialize kitchen audio:", error);
    });
  }, []);

  return null;
}
