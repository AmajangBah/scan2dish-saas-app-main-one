"use client";

import { useState } from "react";

import SettingsSidebar from "./components/SettingsSidebar";
import UsageSection from "./components/UsageSection";
import BillingSection from "./components/BillingSection";
import BusinessProfileSection from "./components/BusinessProfileSection";
import BrandingSection from "./components/BrandingSection";
import HoursSection from "./components/HoursSection";
import PreferencesSection from "./components/PreferencesSection";
import KitchenSection from "./components/KitchenSection";

export default function SettingsPage() {
  const [active, setActive] = useState("usage");

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="lg:w-72">
        <SettingsSidebar active={active} onSelect={setActive} />
      </div>

      <div className="flex-1 min-w-0">
        {active === "usage" && <UsageSection />}
        {active === "billing" && <BillingSection />}
        {active === "profile" && <BusinessProfileSection />}
        {active === "branding" && <BrandingSection />}
        {active === "kitchen" && <KitchenSection />}
        {active === "hours" && <HoursSection />}
        {active === "preferences" && <PreferencesSection />}
      </div>
    </div>
  );
}
