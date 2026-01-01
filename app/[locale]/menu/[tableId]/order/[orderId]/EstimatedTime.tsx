"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  status: "pending" | "preparing" | "completed" | "cancelled";
  createdAt: string;
};

export default function EstimatedTime({ status, createdAt }: Props) {
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setNowMs(Date.now()), 0);
    const id = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(id);
    };
  }, []);

  const text = useMemo(() => {
    if (status === "completed") return "Ready now!";
    if (status === "cancelled") return "Cancelled";

    // Default "menu-friendly" estimate if we don't have a clock yet.
    if (nowMs === null) return "7–15 minutes";

    const createdMs = new Date(createdAt).getTime();
    const minutesElapsed = Math.floor(Math.max(0, nowMs - createdMs) / 60_000);

    if (status === "preparing") {
      const remaining = Math.max(0, 15 - minutesElapsed);
      return remaining > 0 ? `${remaining} minutes` : "Ready soon!";
    }

    return "7–15 minutes";
  }, [createdAt, nowMs, status]);

  return <>{text}</>;
}

