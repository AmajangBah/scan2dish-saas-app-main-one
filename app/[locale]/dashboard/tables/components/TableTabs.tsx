"use client";

import { cn } from "@/lib/utils";

export default function TableTabs({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) {
  const tabs = ["all", "available", "occupied", "reserved", "no-qr"];

  return (
    <div className="flex space-x-1 border-b overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={cn(
            "px-4 py-2",
            activeTab === tab
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
