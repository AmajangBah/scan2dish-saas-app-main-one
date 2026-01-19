import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Don't check auth here - let the client handle redirects
  // Having multiple Supabase clients validating auth in parallel
  // causes cookie synchronization issues in production (Vercel Edge)
  return children;
}
