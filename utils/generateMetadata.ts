// utils/generateMetadata.ts
export function generateMetadataFromPath(pathname: string) {
  // Remove leading/trailing slashes
  const cleaned = pathname.replace(/^\/|\/$/g, "");
  // Split path into segments
  const segments = cleaned.split("/");

  // Take last segment for page title
  const page = segments[segments.length - 1] || "Dashboard";

  // Capitalize first letter
  const capitalizedPage = page.charAt(0).toUpperCase() + page.slice(1);

  return {
    title: `${capitalizedPage} | Scan2Dish`,
    description: `Manage your restaurant ${capitalizedPage.toLowerCase()} efficiently with Scan2Dish. Track orders, update menus, customize your customer interface, and view analytics.`,
  };
}
