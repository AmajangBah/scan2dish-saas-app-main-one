"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n";

const translations: Record<Locale, Record<string, string>> = {
  en: {
    success: "Success",
    orderSent: "Order sent!",
    sentToKitchen: "Your order was sent to the kitchen. You can track it live.",
    trackMyOrder: "Track my order",
    close: "Close",
  },
  fr: {
    success: "Succès",
    orderSent: "Commande envoyée!",
    sentToKitchen:
      "Votre commande a été envoyée à la cuisine. Vous pouvez la suivre en direct.",
    trackMyOrder: "Suivi de ma commande",
    close: "Fermer",
  },
  es: {
    success: "Éxito",
    orderSent: "¡Pedido enviado!",
    sentToKitchen:
      "Su pedido fue enviado a la cocina. Puede rastrearlo en vivo.",
    trackMyOrder: "Rastrear mi pedido",
    close: "Cerrar",
  },
};

function Confetti({ seed }: { seed: number }) {
  const pieces = useMemo(() => {
    // Deterministic-ish confetti layout
    const count = 24;
    const out: Array<{
      left: number;
      delay: number;
      dur: number;
      rot: number;
      size: number;
      hue: number;
    }> = [];

    let x = seed || 1;
    function rand() {
      // xorshift32
      x ^= x << 13;
      x ^= x >> 17;
      x ^= x << 5;
      return (x >>> 0) / 0xffffffff;
    }

    for (let i = 0; i < count; i++) {
      out.push({
        left: Math.round(rand() * 100),
        delay: Math.round(rand() * 250) / 1000,
        dur: 1.4 + rand() * 1.2,
        rot: Math.round(rand() * 360),
        size: 6 + Math.round(rand() * 8),
        hue: Math.round(rand() * 360),
      });
    }
    return out;
  }, [seed]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p, idx) => (
        <span
          key={idx}
          className="absolute top-[-12px] rounded-sm opacity-90"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size * 0.6}px`,
            backgroundColor: `hsl(${p.hue} 90% 60%)`,
            transform: `rotate(${p.rot}deg)`,
            animation: `s2d_confetti_fall ${p.dur}s ease-out ${p.delay}s both`,
          }}
        />
      ))}
      <style>{`
@keyframes s2d_confetti_fall {
  0% { transform: translateY(0) rotate(0deg); opacity: 0; }
  10% { opacity: 0.95; }
  100% { transform: translateY(105vh) rotate(540deg); opacity: 0; }
}
      `}</style>
    </div>
  );
}

export default function OrderSuccessSplash({
  trackHref,
  locale = "en",
}: {
  trackHref: string;
  locale?: Locale;
}) {
  const [open, setOpen] = useState(true);
  const [seed] = useState(() => Date.now());

  useEffect(() => {
    // Auto-dismiss after a short moment (still leaves Track button visible if user taps).
    const t = window.setTimeout(() => setOpen(false), 4500);
    return () => window.clearTimeout(t);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border bg-card shadow-xl">
        <Confetti seed={seed} />
        <div className="p-6 relative">
          <div className="text-xs text-muted-foreground">
            {translations[locale]["success"] || "Success"}
          </div>
          <div className="text-2xl font-extrabold tracking-tight mt-1">
            {translations[locale]["orderSent"] || "Order sent!"}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {translations[locale]["sentToKitchen"] ||
              "Your order was sent to the kitchen. You can track it live."}
          </p>

          <div className="mt-5 flex gap-2">
            <Button
              asChild
              className="flex-1 bg-[var(--menu-brand)] text-white hover:bg-[var(--menu-brand)]/90"
            >
              <Link href={trackHref}>
                {translations[locale]["trackMyOrder"] || "Track my order"}
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {translations[locale]["close"] || "Close"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
