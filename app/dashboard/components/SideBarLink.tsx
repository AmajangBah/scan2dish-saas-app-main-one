"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

interface SideBarLinkProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  badgeCount?: number;
}

const SideBarLink = ({ href, label, icon, badgeCount }: SideBarLinkProps) => {
  const pathname = usePathname();

  const active =
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === href || pathname.startsWith(`${href}/`);

  const handleLogout = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // For logout, use full page reload to ensure session is properly cleared
    // before middleware evaluates the request. This prevents redirect loops.
    if (href === "/logout") {
      e.preventDefault();
      window.location.href = href;
    }
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} tooltip={label}>
        <Link
          href={href}
          aria-current={active ? "page" : undefined}
          onClick={handleLogout}
        >
          {icon}
          <span className="flex-1 min-w-0">{label}</span>
          {typeof badgeCount === "number" && badgeCount > 0 && (
            <span
              className="ml-auto inline-flex items-center justify-center rounded-full bg-orange-600 text-white text-[11px] font-semibold tabular-nums px-2 py-0.5"
              aria-label={`${badgeCount} unread orders`}
              title={`${badgeCount} unread`}
            >
              {badgeCount}
            </span>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};
export default SideBarLink;
