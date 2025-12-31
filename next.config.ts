import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Only treat these path segments as locales.
      // IMPORTANT: Without this constraint, "/:locale" would match "/login", "/admin", "/Logo.png", etc.
      // which causes hard redirects back to "/" and breaks routing + public assets.
      //
      // Keep in sync with `i18n.ts` locales.
      // NOTE: Next redirect sources support regex groups.
      // Ref: https://nextjs.org/docs/app/api-reference/next-config-js/redirects

      // Keep non-localized core areas stable.
      {
        source: "/:locale(en|fr|es)/dashboard/:path*",
        destination: "/dashboard/:path*",
        permanent: false,
      },
      {
        source: "/:locale(en|fr|es)/admin/:path*",
        destination: "/admin/:path*",
        permanent: false,
      },
      {
        source: "/:locale(en|fr|es)/auth/admin/sign-in",
        destination: "/auth/admin/sign-in",
        permanent: false,
      },
      {
        source: "/:locale(en|fr|es)/kitchen/:path*",
        destination: "/kitchen/:path*",
        permanent: false,
      },

      // Non-localized auth + onboarding.
      {
        source: "/:locale(en|fr|es)/login",
        destination: "/login",
        permanent: false,
      },
      {
        source: "/:locale(en|fr|es)/register/:path*",
        destination: "/register/:path*",
        permanent: false,
      },
      {
        source: "/:locale(en|fr|es)/onboarding",
        destination: "/onboarding",
        permanent: false,
      },
      {
        source: "/:locale(en|fr|es)/logout",
        destination: "/logout",
        permanent: false,
      },

      // Localized home collapses to the stable non-localized home.
      {
        source: "/:locale(en|fr|es)",
        destination: "/",
        permanent: false,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
