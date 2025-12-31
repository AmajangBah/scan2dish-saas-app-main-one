// Client-safe i18n constants.
//
// IMPORTANT:
// - Keep server-only next-intl request configuration in `i18n/request.ts`
// - This file is imported by client components (e.g. `components/LanguageSwitcher.tsx`)

export const locales = ["en", "fr", "es"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  es: "Español",
};

export const localeFlags: Record<Locale, string> = {
  en: "🇬🇧",
  fr: "🇫🇷",
  es: "🇪🇸",
};
