"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

interface SideBarLinkProps {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const SideBarLink = ({ href, label, icon }: SideBarLinkProps) => {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={clsx(
        "flex items-center gap-3 px-6 py-3 rounded-md text-[15px] font-medium transition",
        active
          ? "bg-orange-600 text-white shadow-sm"
          : "text-gray-700 hover:bg-gray-100"
      )}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
};
export default SideBarLink;
