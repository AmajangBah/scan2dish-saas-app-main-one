"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const tabs = [
  { id: "usage", label: "Usage" },
  { id: "billing", label: "Billing" },
  { id: "profile", label: "Business Profile" },
  { id: "branding", label: "Branding" },
  { id: "kitchen", label: "Kitchen" },
  { id: "hours", label: "Opening Hours" },
  { id: "preferences", label: "Preferences" },
];

export default function SettingsSidebar({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="rounded-xl border bg-card p-2 space-y-1">
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          variant={active === tab.id ? "default" : "ghost"}
          className={cn("w-full justify-start", active === tab.id && "font-medium")}
          onClick={() => onSelect(tab.id)}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  );
}
