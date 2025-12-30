"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();

  const handleChange = (newLocale: string) => {
    // App Router uses a required /[locale]/... segment, so always keep a locale prefix.
    // This also avoids “falling out” of the localized tree and losing next-intl context.
    const pathnameWithoutLocale = pathname.startsWith(`/${locale}`)
      ? pathname.slice(`/${locale}`.length) || "/"
      : pathname || "/";

    const qs = searchParams?.toString();
    const next = `/${newLocale}${pathnameWithoutLocale}${qs ? `?${qs}` : ""}`;
    router.push(next);
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
