import AdminSignInClient from "./AdminSignInClient";

export default async function AdminSignInPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) || {};
  const redirect = typeof sp.redirect === "string" ? sp.redirect : undefined;
  return <AdminSignInClient redirect={redirect} />;
}

