import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";
import en from "../messages/en.json";
import fr from "../messages/fr.json";
import es from "../messages/es.json";

import { defaultLocale, locales, type Locale } from "../i18n";

export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale = (locale ?? defaultLocale) as Locale;
  if (!locales.includes(resolvedLocale)) notFound();

  return {
    locale: resolvedLocale,
    messages: { en, fr, es }[resolvedLocale],
  };
});

