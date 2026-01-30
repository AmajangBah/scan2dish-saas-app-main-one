import { createServerSupabase } from "@/lib/supabase/server";

export async function getRestaurantId() {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Hard separation: admins are not restaurant users
  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("id, is_active")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();
  if (adminUser) return null;

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  return restaurant?.id || null;
}
