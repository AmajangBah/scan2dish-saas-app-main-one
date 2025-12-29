"use client";

import { cn } from "@/lib/utils";

export default function TableTabs({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) {
  const tabs: { id: string; label: string }[] = [
    { id: "all", label: "All" },
    { id: "available", label: "Available" },
    { id: "occupied", label: "Occupied" },
    { id: "reserved", label: "Reserved" },
    { id: "no-qr", label: "Missing QR" },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={cn(
            "shrink-0 rounded-full px-3 py-1.5 text-sm transition-colors border",
            activeTab === tab.id
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-muted-foreground hover:text-foreground hover:bg-muted/40 border-border"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
