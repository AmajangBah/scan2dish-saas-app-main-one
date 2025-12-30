 "use client";

 import { useEffect, useMemo, useRef, useState } from "react";
 import Link from "next/link";
 import { usePathname } from "next/navigation";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Button } from "@/components/ui/button";
 import { Switch } from "@/components/ui/switch";
 import { cn } from "@/lib/utils";
 import { createBrowserSupabase } from "@/lib/supabase/client";
 import { toast } from "sonner";
 import { CheckCircle2, CookingPot, Hourglass, ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/utils/currency";

 type OrderStatus = "pending" | "preparing" | "completed";

 export type LiveOrderSummary = {
   id: string;
   table: string;
   status: OrderStatus;
   total: string;
   createdAt: string;
 };

 type RestaurantTableJoin =
   | { table_number?: string }
   | { table_number?: string }[]
   | null
   | undefined;

 type OrderRow = {
   id: string;
   status: OrderStatus;
   total: number | string | null;
   created_at: string;
   restaurant_tables: RestaurantTableJoin;
 };

 export default function LiveOrdersWidget({
   restaurantId,
  currency,
   initialOrders,
 }: {
   restaurantId: string;
  currency: string;
   initialOrders: LiveOrderSummary[];
 }) {
   const pathname = usePathname();
   const locale = useMemo(
     () => pathname.split("/").filter(Boolean)[0] || "en",
     [pathname]
   );
   const ordersHref = `/${locale}/dashboard/orders`;

   const [orders, setOrders] = useState<LiveOrderSummary[]>(initialOrders);
   const [liveStatus, setLiveStatus] = useState<
     "connecting" | "live" | "reconnecting" | "offline"
   >("connecting");
   const [newOrderSince, setNewOrderSince] = useState<Record<string, number>>(
     {}
   );

   // Sound settings (shared with Orders page)
   const [soundEnabled, setSoundEnabled] = useState(false);
   const [volume, setVolume] = useState(0.6);
   const audioRef = useRef<{ ctx: AudioContext; gain: GainNode } | null>(null);
   const notifiedIdsRef = useRef<Set<string>>(new Set());
   const liveStatusRef = useRef(liveStatus);

   function storageKey(key: string) {
     return `s2d_${key}_${restaurantId}`;
   }

   useEffect(() => {
     liveStatusRef.current = liveStatus;
   }, [liveStatus]);

   useEffect(() => {
     try {
       const enabled = window.localStorage.getItem(storageKey("sound_enabled"));
       const storedVol = window.localStorage.getItem(storageKey("sound_volume"));
       setSoundEnabled(enabled === "true");
       if (storedVol) {
         const n = Number(storedVol);
         if (!Number.isNaN(n)) setVolume(Math.min(1, Math.max(0, n)));
       }
       const storedNotified = JSON.parse(
         window.localStorage.getItem(storageKey("notified_order_ids")) || "[]"
       ) as string[];
       notifiedIdsRef.current = new Set(storedNotified);
     } catch {
       // ignore
     }
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [restaurantId]);

   useEffect(() => {
     if (audioRef.current) {
       audioRef.current.gain.gain.value = volume;
     }
     try {
       window.localStorage.setItem(storageKey("sound_volume"), String(volume));
     } catch {
       // ignore
     }
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [volume, restaurantId]);

   async function ensureAudioReady() {
     try {
       if (!audioRef.current) {
         const w = window as Window & { webkitAudioContext?: typeof AudioContext };
         const AudioCtx = window.AudioContext ?? w.webkitAudioContext;
         if (!AudioCtx) return false;
         const ctx = new AudioCtx();
         const gain = ctx.createGain();
         gain.gain.value = volume;
         gain.connect(ctx.destination);
         audioRef.current = { ctx, gain };
       }
       if (audioRef.current.ctx.state !== "running") {
         await audioRef.current.ctx.resume();
       }
       audioRef.current.gain.gain.value = volume;
       return true;
     } catch {
       return false;
     }
   }

   function playNewOrderSound() {
     if (!soundEnabled) return;
     const audio = audioRef.current;
     if (!audio || audio.ctx.state !== "running") return;

    const now = audio.ctx.currentTime;
    const g = audio.gain;

     const o1 = audio.ctx.createOscillator();
     o1.type = "sine";
    o1.frequency.value = 880;
    o1.connect(g);
    o1.start(now);
    o1.stop(now + 0.08);

     const o2 = audio.ctx.createOscillator();
     o2.type = "sine";
    o2.frequency.value = 660;
    o2.connect(g);
    o2.start(now + 0.1);
    o2.stop(now + 0.22);
   }

   function maybeNotifyNewOrder(orderId: string) {
     if (notifiedIdsRef.current.has(orderId)) return;
     notifiedIdsRef.current.add(orderId);
     try {
       const key = storageKey("notified_order_ids");
       const existing = JSON.parse(
         window.localStorage.getItem(key) || "[]"
       ) as string[];
       const next = [orderId, ...existing.filter((x) => x !== orderId)].slice(
         0,
         150
       );
       window.localStorage.setItem(key, JSON.stringify(next));
     } catch {
       // ignore
     }
     setNewOrderSince((prev) =>
       prev[orderId] ? prev : { ...prev, [orderId]: Date.now() }
     );
     playNewOrderSound();
   }

   function mapRow(row: OrderRow): LiveOrderSummary {
     const rt = row.restaurant_tables;
     const tableNumber = Array.isArray(rt)
       ? rt[0]?.table_number
       : rt?.table_number;
     return {
       id: String(row.id),
       table: tableNumber || "Unknown",
       status: row.status,
       total: Number(row.total || 0).toFixed(2),
       createdAt: String(row.created_at),
     };
   }

   async function refreshOnce() {
     const supabase = createBrowserSupabase();
     const { data } = await supabase
       .from("orders")
       .select(
         `
         id,
         status,
         total,
         created_at,
         restaurant_tables(table_number)
       `
       )
       .eq("restaurant_id", restaurantId)
       .in("status", ["pending", "preparing"])
       .order("created_at", { ascending: false })
       .limit(10);

     const rows = (data ?? []) as unknown as OrderRow[];
     const mapped = rows.map(mapRow);

     setOrders((prev) => {
       const existingIds = new Set(prev.map((o) => o.id));
       for (const o of mapped) {
         if (!existingIds.has(o.id)) maybeNotifyNewOrder(o.id);
       }
       return mapped.slice(0, 6);
     });
   }

   useEffect(() => {
     const supabase = createBrowserSupabase();
     setLiveStatus("connecting");

     type ChangePayload = { new: Partial<OrderRow> & { id?: string } };

     const channel = supabase
       .channel(`restaurant-live-orders-${restaurantId}`)
       .on(
         "postgres_changes",
         {
           event: "INSERT",
           schema: "public",
           table: "orders",
           filter: `restaurant_id=eq.${restaurantId}`,
         },
         async (payload) => {
           const p = payload as unknown as ChangePayload;
           const id = String(p.new?.id ?? "");
           if (!id) return;
           await refreshOnce();
         }
       )
       .on(
         "postgres_changes",
         {
           event: "UPDATE",
           schema: "public",
           table: "orders",
           filter: `restaurant_id=eq.${restaurantId}`,
         },
         async () => {
           await refreshOnce();
         }
       )
       .subscribe((status) => {
         if (status === "SUBSCRIBED") setLiveStatus("live");
         else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT")
           setLiveStatus("reconnecting");
         else if (status === "CLOSED") setLiveStatus("offline");
       });

     const interval = window.setInterval(() => {
       if (liveStatusRef.current === "live") return;
       refreshOnce().catch(() => {
         // ignore
       });
     }, 10_000);

     refreshOnce().catch(() => {
       // ignore
     });

     return () => {
       window.clearInterval(interval);
       supabase.removeChannel(channel);
     };
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [restaurantId]);

   useEffect(() => {
     const t = window.setInterval(() => {
       const cutoff = Date.now() - 2 * 60_000;
       setNewOrderSince((prev) => {
         const next: Record<string, number> = {};
         for (const [id, ts] of Object.entries(prev)) {
           if (ts >= cutoff) next[id] = ts;
         }
         return next;
       });
     }, 15_000);
     return () => window.clearInterval(t);
   }, []);

   const statusMeta: Record<
     OrderStatus,
     { label: string; badgeClass: string; icon: React.ReactNode }
   > = {
     pending: {
       label: "New",
       badgeClass: "bg-red-100 text-red-700 border-red-200",
       icon: <Hourglass className="h-3.5 w-3.5" />,
     },
     preparing: {
       label: "Preparing",
       badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
       icon: <CookingPot className="h-3.5 w-3.5" />,
     },
     completed: {
       label: "Completed",
       badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
       icon: <CheckCircle2 className="h-3.5 w-3.5" />,
     },
   };

   return (
     <Card className="shadow-sm">
       <CardHeader className="pb-3">
         <div className="flex items-start justify-between gap-4">
           <div className="min-w-0">
             <CardTitle className="text-base font-semibold">
               Live orders
             </CardTitle>
             <div className="mt-1 flex items-center gap-2">
               <span
                 className={cn(
                   "h-2.5 w-2.5 rounded-full",
                   liveStatus === "live"
                     ? "bg-emerald-500"
                     : liveStatus === "connecting" || liveStatus === "reconnecting"
                     ? "bg-amber-500 animate-pulse"
                     : "bg-gray-400"
                 )}
               />
               <span className="text-xs text-muted-foreground">
                 {liveStatus === "live"
                   ? "Live"
                   : liveStatus === "connecting"
                   ? "Connecting…"
                   : liveStatus === "reconnecting"
                   ? "Reconnecting…"
                   : "Offline"}
               </span>
             </div>
           </div>

           <Link href={ordersHref} className="shrink-0">
             <Button variant="outline" size="sm" className="gap-2">
               Open
               <ArrowRight className="h-4 w-4" />
             </Button>
           </Link>
         </div>
       </CardHeader>

       <CardContent className="space-y-4">
         <div className="flex flex-col gap-2">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
               <span className="text-xs text-muted-foreground">Sound</span>
               <Switch
                 checked={soundEnabled}
                 onCheckedChange={async (checked) => {
                   if (checked) {
                     const ok = await ensureAudioReady();
                     if (!ok) {
                       toast.error(
                         "Sound blocked by browser. Tap again after interacting."
                       );
                       setSoundEnabled(false);
                       return;
                     }
                   }
                   setSoundEnabled(checked);
                   try {
                     window.localStorage.setItem(
                       storageKey("sound_enabled"),
                       String(checked)
                     );
                   } catch {
                     // ignore
                   }
                 }}
               />
             </div>
             <div className="flex items-center gap-2">
               <span className="text-xs text-muted-foreground">Volume</span>
               <input
                 type="range"
                 min={0}
                 max={1}
                 step={0.05}
                 value={volume}
                 onChange={(e) => setVolume(Number(e.target.value))}
                 className="w-28"
                 disabled={!soundEnabled}
                 aria-label="Sound volume"
               />
             </div>
           </div>
         </div>

         {orders.length > 0 ? (
           <div className="space-y-2">
             {orders.slice(0, 5).map((o) => {
               const meta = statusMeta[o.status];
               const isNew =
                 Boolean(newOrderSince[o.id]) && o.status === "pending";
               return (
                 <div
                   key={o.id}
                   className={cn(
                     "flex items-center justify-between gap-3 rounded-lg border bg-muted/20 px-3 py-2",
                     isNew && "ring-2 ring-orange-500/25"
                   )}
                 >
                   <div className="min-w-0">
                     <div className="flex items-center gap-2">
                       <div className="text-sm font-semibold truncate">
                         Table {o.table}
                       </div>
                       {isNew && (
                         <span className="inline-flex h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                       )}
                     </div>
                     <div className="text-xs text-muted-foreground truncate">
                      {formatPrice(Number(o.total || 0), currency)} •{" "}
                       {new Date(o.createdAt).toLocaleTimeString("en-US", {
                         hour: "2-digit",
                         minute: "2-digit",
                       })}
                     </div>
                   </div>

                   <Badge
                     variant="outline"
                     className={cn("gap-1.5", meta.badgeClass)}
                   >
                     {meta.icon}
                     {meta.label}
                   </Badge>
                 </div>
               );
             })}
           </div>
         ) : (
           <div className="rounded-lg border border-dashed p-4 text-center">
             <div className="text-sm font-semibold">No live orders</div>
             <p className="text-xs text-muted-foreground mt-1">
               New orders will appear here instantly.
             </p>
           </div>
         )}
       </CardContent>
     </Card>
   );
 }

