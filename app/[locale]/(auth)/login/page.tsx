import Route from "@/app/constants/Route";
import LoginClient from "./LoginClient";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) || {};
  const redirect = typeof sp.redirect === "string" ? sp.redirect : undefined;
  const redirectTo = redirect || Route.DASHBOARD;

  return <LoginClient redirectTo={redirectTo} />;
}
