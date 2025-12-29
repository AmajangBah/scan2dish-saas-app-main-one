"use client";

import { cn } from "@/lib/utils";

const tabs = [
  { id: "usage", label: "Usage" },
  { id: "billing", label: "Billing" },
  { id: "profile", label: "Business Profile" },
  { id: "branding", label: "Branding" },
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
    <div className="w-56 border-r h-full py-6 space-y-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={cn(
            "w-full text-left px-4 py-2 rounded-lg ",
            active === tab.id && "bg-orange-500 font-medium text-white"
          )}
          onClick={() => onSelect(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
