"use client";

import { useState, useEffect } from "react";
import { getRestaurantProfile } from "@/app/actions/restaurant";

/**
 * Hook to get the current restaurant's currency
 * Returns the currency code and a loading state
 */
export function useCurrency() {
  const [currency, setCurrency] = useState<string>("GMD");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCurrency() {
      try {
        const result = await getRestaurantProfile();
        if (result.success && result.data) {
          const data = result.data as any;
          setCurrency(data.currency || "GMD");
        }
      } catch (error) {
        console.error("Failed to load currency:", error);
      } finally {
        setLoading(false);
      }
    }

    loadCurrency();
  }, []);

  return { currency, loading };
}
