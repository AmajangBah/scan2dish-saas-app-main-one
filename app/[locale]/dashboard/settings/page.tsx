"use client";

import { useState } from "react";

import SettingsSidebar from "./components/SettingsSidebar";
import UsageSection from "./components/UsageSection";
import BillingSection from "./components/BillingSection";
import BusinessProfileSection from "./components/BusinessProfileSection";
import BrandingSection from "./components/BrandingSection";
import HoursSection from "./components/HoursSection";
import PreferencesSection from "./components/PreferencesSection";

export default function SettingsPage() {
  const [active, setActive] = useState("usage");

  return (
    <div className="flex h-[85vh]">
      <SettingsSidebar active={active} onSelect={setActive} />

      <div className="flex-1 overflow-y-auto">
        {active === "usage" && <UsageSection />}
        {active === "billing" && <BillingSection />}
        {active === "profile" && <BusinessProfileSection />}
        {active === "branding" && <BrandingSection />}
        {active === "hours" && <HoursSection />}
        {active === "preferences" && <PreferencesSection />}
      </div>
    </div>
  );
}
