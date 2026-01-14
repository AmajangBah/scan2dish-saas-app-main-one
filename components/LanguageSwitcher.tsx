"use client";

import { useTransition } from "react";
import {
  useRouter,
  usePathname,
  useSearchParams,
  useParams,
} from "next/navigation";
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
  const params = useParams();
  const locale = typeof params.locale === "string" ? params.locale : "en";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleChange = (newLocale: string) => {
    // usePathname from next/navigation returns the full path including locale
    // e.g., "/fr/menu/zora" or "/en/menu/zora"
    // We need to remove the current locale prefix and replace it with the new one

    const segments = pathname.split("/").filter(Boolean); // ["fr", "menu", "zora"]

    // Check if the first segment is a known locale and remove it
    let pathWithoutLocale = pathname;
    if (segments.length > 0 && locales.includes(segments[0] as Locale)) {
      // Remove the locale segment from the start
      pathWithoutLocale = "/" + segments.slice(1).join("/");
    }

    const qs = searchParams?.toString();
    const next = `/${newLocale}${pathWithoutLocale}${qs ? `?${qs}` : ""}`;

    // Use startTransition to manage the async state update
    startTransition(() => {
      router.push(next);
      router.refresh();
    });
  };

  return (
    <Select value={locale} onValueChange={handleChange}>
      <SelectTrigger
        suppressHydrationWarning
        className={triggerClassName || "w-[140px]"}
      >
        <div className="flex items-center gap-2">
          <span>{localeFlags[locale as Locale]}</span>
          <span className="hidden sm:inline">
            {localeNames[locale as Locale]}
          </span>
        </div>
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
