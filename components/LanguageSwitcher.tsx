"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { locales, localeNames, localeFlags, type Locale } from "@/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Language switcher component
 * Allows users to switch between English, French, and Spanish
 */
export default function LanguageSwitcher({
  triggerClassName,
}: {
  triggerClassName?: string;
}) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (newLocale: string) => {
    // Remove current locale from pathname if it exists
    const pathnameWithoutLocale = pathname.replace(`/${locale}`, "");
    
    // Add new locale to pathname (unless it's the default)
    const newPathname = newLocale === "en" 
      ? pathnameWithoutLocale || "/"
      : `/${newLocale}${pathnameWithoutLocale || ""}`;
    
    router.push(newPathname);
  };

  return (
    <Select value={locale} onValueChange={handleChange}>
      <SelectTrigger className={triggerClassName || "w-[140px]"}>
        <SelectValue>
          <span className="flex items-center gap-2">
            <span>{localeFlags[locale as Locale]}</span>
            <span>{localeNames[locale as Locale]}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {locales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            <span className="flex items-center gap-2">
              <span>{localeFlags[loc]}</span>
              <span>{localeNames[loc]}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
