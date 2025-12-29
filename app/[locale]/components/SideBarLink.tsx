"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface SideBarLinkProps {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const SideBarLink = ({ href, label, icon }: SideBarLinkProps) => {
  const pathname = usePathname();

  const locale = pathname.split("/").filter(Boolean)[0] || "en";
  const hrefWithLocale = `/${locale}${href}`;

  const active =
    pathname === hrefWithLocale ||
    (hrefWithLocale !== `/${locale}/dashboard` &&
      pathname.startsWith(`${hrefWithLocale}/`)) ||
    (hrefWithLocale === `/${locale}/dashboard` &&
      pathname.startsWith(`/${locale}/dashboard`));

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} tooltip={label}>
        <Link href={hrefWithLocale} aria-current={active ? "page" : undefined}>
          {icon}
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};
export default SideBarLink;
