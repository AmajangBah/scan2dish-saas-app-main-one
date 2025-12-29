/**
 * Admin authentication and helper functions
 * Provides server-side utilities for admin operations
 */

import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

export interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: "super_admin" | "admin" | "support";
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

/**
 * Check if the current user is an admin
 * Cached per request to avoid repeated DB calls
 */
export const isAdmin = cache(async (): Promise<boolean> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data, error } = await supabase
    .from("admin_users")
    .select("id, is_active")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  return !error && !!data;
});

/**
 * Get the current admin user data
 */
export const getAdminUser = cache(async (): Promise<AdminUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("admin_users")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (error || !data) return null;

  return data as AdminUser;
});

/**
 * Require admin access - throws if not admin
 * Use in API routes and server actions
 */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdminUser();

  if (!admin) {
    throw new Error("Unauthorized: Admin access required");
  }

  return admin;
}

/**
 * Log admin activity
 */
export async function logAdminActivity(params: {
  action_type:
    | "restaurant_enabled"
    | "restaurant_disabled"
    | "menu_enabled"
    | "menu_disabled"
    | "payment_recorded"
    | "commission_adjusted"
    | "restaurant_viewed"
    | "order_viewed"
    | "settings_changed";
  restaurant_id?: string;
  order_id?: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  const supabase = await createClient();
  const admin = await getAdminUser();

  if (!admin) return;

  await supabase.from("admin_activity_logs").insert({
    admin_id: admin.id,
    action_type: params.action_type,
    restaurant_id: params.restaurant_id,
    order_id: params.order_id,
    details: params.details || {},
  });
}

/**
 * Check if a restaurant's menu is enabled
 * Used for enforcement in menu/order routes
 */
export async function isRestaurantMenuEnabled(
  restaurantId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("restaurants")
    .select("menu_enabled")
    .eq("id", restaurantId)
    .single();

  if (error || !data) return false;

  return data.menu_enabled;
}

/**
 * Get restaurant enforcement status with reason
 */
export async function getRestaurantEnforcementStatus(restaurantId: string): Promise<{
  enabled: boolean;
  reason: string | null;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("restaurants")
    .select("menu_enabled, enforcement_reason")
    .eq("id", restaurantId)
    .single();

  if (error || !data) {
    return { enabled: false, reason: "Restaurant not found" };
  }

  return {
    enabled: data.menu_enabled,
    reason: data.enforcement_reason,
  };
}
