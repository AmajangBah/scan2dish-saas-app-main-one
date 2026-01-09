"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { getRestaurantId } from "@/lib/getRestaurantId";
import { revalidatePath } from "next/cache";

export interface OnboardingProgress {
  id: string;
  restaurant_id: string;
  current_step: number;
  completed: boolean;
  steps_completed: number[];
  skipped: boolean;
  created_at: string;
  updated_at: string;
}

export interface OnboardingActionResult {
  success: boolean;
  error?: string;
  data?: OnboardingProgress;
}

/**
 * Get onboarding progress for current restaurant
 */
export async function getOnboardingProgress(): Promise<OnboardingProgress | null> {
  try {
    const restaurant_id = await getRestaurantId();
    if (!restaurant_id) return null;

    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from("onboarding_progress")
      .select("*")
      .eq("restaurant_id", restaurant_id)
      .single();

    if (error) {
      // If no record exists, create one
      if (error.code === "PGRST116") {
        const { data: newProgress, error: createError } = await supabase
          .from("onboarding_progress")
          .insert({
            restaurant_id,
            current_step: 1,
            completed: false,
            steps_completed: [],
            skipped: false,
          })
          .select()
          .single();

        if (createError) {
          console.error("Failed to create onboarding progress:", createError);
          return null;
        }

        return newProgress;
      }

      console.error("Failed to get onboarding progress:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Get onboarding progress error:", error);
    return null;
  }
}

/**
 * Update onboarding progress
 */
export async function updateOnboardingProgress(
  currentStep: number,
  stepsCompleted: number[]
): Promise<OnboardingActionResult> {
  try {
    const restaurant_id = await getRestaurantId();
    if (!restaurant_id) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from("onboarding_progress")
      .update({
        current_step: currentStep,
        steps_completed: stepsCompleted,
        completed: currentStep > 7,
      })
      .eq("restaurant_id", restaurant_id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update onboarding progress:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");

    return { success: true, data };
  } catch (error) {
    console.error("Update onboarding progress error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update progress",
    };
  }
}

/**
 * Mark onboarding as completed
 */
export async function completeOnboarding(): Promise<OnboardingActionResult> {
  try {
    const restaurant_id = await getRestaurantId();
    if (!restaurant_id) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from("onboarding_progress")
      .update({
        current_step: 7,
        completed: true,
        steps_completed: [1, 2, 3, 4, 5, 6, 7],
      })
      .eq("restaurant_id", restaurant_id)
      .select()
      .single();

    if (error) {
      console.error("Failed to complete onboarding:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");

    return { success: true, data };
  } catch (error) {
    console.error("Complete onboarding error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to complete onboarding",
    };
  }
}

/**
 * Skip onboarding
 */
export async function skipOnboarding(): Promise<OnboardingActionResult> {
  try {
    const restaurant_id = await getRestaurantId();
    if (!restaurant_id) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from("onboarding_progress")
      .update({
        skipped: true,
        completed: true,
      })
      .eq("restaurant_id", restaurant_id)
      .select()
      .single();

    if (error) {
      console.error("Failed to skip onboarding:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");

    return { success: true, data };
  } catch (error) {
    console.error("Skip onboarding error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to skip onboarding",
    };
  }
}

/**
 * Reset onboarding (for testing or if user wants to restart)
 */
export async function resetOnboarding(): Promise<OnboardingActionResult> {
  try {
    const restaurant_id = await getRestaurantId();
    if (!restaurant_id) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from("onboarding_progress")
      .update({
        current_step: 1,
        completed: false,
        steps_completed: [],
        skipped: false,
      })
      .eq("restaurant_id", restaurant_id)
      .select()
      .single();

    if (error) {
      console.error("Failed to reset onboarding:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard");

    return { success: true, data };
  } catch (error) {
    console.error("Reset onboarding error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to reset onboarding",
    };
  }
}
