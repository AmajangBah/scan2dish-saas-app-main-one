import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Keep non-localized core areas stable.
      {
        source: "/:locale/dashboard/:path*",
        destination: "/dashboard/:path*",
        permanent: false,
      },
      {
        source: "/:locale/admin/:path*",
        destination: "/admin/:path*",
        permanent: false,
      },
      {
        source: "/:locale/auth/admin/sign-in",
        destination: "/auth/admin/sign-in",
        permanent: false,
      },

      // Non-localized auth + onboarding.
      {
        source: "/:locale/login",
        destination: "/login",
        permanent: false,
      },
      {
        source: "/:locale/register/:path*",
        destination: "/register/:path*",
        permanent: false,
      },
      {
        source: "/:locale/onboarding",
        destination: "/onboarding",
        permanent: false,
      },
      {
        source: "/:locale/logout",
        destination: "/logout",
        permanent: false,
      },

      // Localized home collapses to the stable non-localized home.
      {
        source: "/:locale",
        destination: "/",
        permanent: false,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
