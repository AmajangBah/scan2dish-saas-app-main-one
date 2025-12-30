import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { maybeCreateServiceSupabase } from "@/lib/supabase/service";
import KitchenClient from "./KitchenClient";
import KitchenPinClient from "./KitchenPinClient";
import { verifyKitchenSession } from "@/lib/utils/kitchenAuth";

export default async function KitchenPage({
  params,
}: {
  params: Promise<{ restaurantId: string }>;
}) {
  const { restaurantId } = await params;

  const service = maybeCreateServiceSupabase();
  if (!service) {
    return (
      <div className="min-h-dvh bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full border border-neutral-800 bg-neutral-950 rounded-2xl p-6">
          <div className="text-xl font-semibold">Kitchen unavailable</div>
          <p className="text-sm text-neutral-400 mt-2">
            Missing server configuration. Set{" "}
            <code className="text-neutral-200">SUPABASE_SERVICE_ROLE_KEY</code> and{" "}
            <code className="text-neutral-200">KITCHEN_SESSION_SECRET</code>.
          </p>
        </div>
      </div>
    );
  }

  const { data: restaurant, error } = await service
    .from("restaurants")
    .select("id, name, kitchen_enabled, kitchen_pin_hash")
    .eq("id", restaurantId)
    .single();

  if (error || !restaurant) notFound();
  if (!restaurant.kitchen_enabled) notFound();

  const pinHash = restaurant.kitchen_pin_hash as string | null;
  if (pinHash) {
    const cookieStore = await cookies();
    const token = cookieStore.get(`s2d_kitchen_${restaurantId}`)?.value;
    const ok = token ? verifyKitchenSession(token, restaurantId) : false;
    if (!ok) {
      return (
        <KitchenPinClient
          restaurantId={restaurantId}
          restaurantName={String(restaurant.name)}
        />
      );
    }
  }

  return (
    <KitchenClient
      restaurantId={restaurantId}
      restaurantName={String(restaurant.name)}
    />
  );
}

