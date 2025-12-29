import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";
import en from "../messages/en.json";
import fr from "../messages/fr.json";
import es from "../messages/es.json";

// Supported locales
export const locales = ["en", "fr", "es"] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale = (locale ?? "en") as Locale;
  if (!locales.includes(resolvedLocale)) notFound();

  return {
    locale: resolvedLocale,
    messages: { en, fr, es }[resolvedLocale],
  };
});

