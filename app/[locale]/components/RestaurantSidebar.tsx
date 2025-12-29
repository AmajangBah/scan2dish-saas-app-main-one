"use client";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
} from "@/components/ui/sidebar";

import {
  LayoutDashboard,
  Notebook,
  Utensils,
  Table2,
  BarChart2,
  BadgePercent,
  Settings,
  LogOut,
} from "lucide-react";

import Route from "../../constants/Route";
import SideBarLink from "./SideBarLink";

const RestaurantSidebar = ({ restaurantName }: { restaurantName: string }) => {
  return (
    <Sidebar collapsible="icon">
      {/* HEADER */}
      <SidebarHeader className="border-b px-4 py-6">
        <h2 className="text-xl font-bold">{restaurantName}</h2>
      </SidebarHeader>

      {/* MAIN NAV */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SideBarLink
                href={Route.DASHBOARD}
                label="Overview"
                icon={<LayoutDashboard className="h-5 w-5" />}
              />

              <SideBarLink
                href={Route.ORDERS}
                label="Orders"
                icon={<Notebook className="h-5 w-5" />}
              />

              <SideBarLink
                href={Route.MENU}
                label="Menu"
                icon={<Utensils className="h-5 w-5" />}
              />

              <SideBarLink
                href={Route.TABLES}
                label="Tables"
                icon={<Table2 className="h-5 w-5" />}
              />

              <SideBarLink
                href={Route.ANALYTICS}
                label="Analytics"
                icon={<BarChart2 className="h-5 w-5" />}
              />

              <SideBarLink
                href={Route.DISCOUNT}
                label="Discounts"
                icon={<BadgePercent className="h-5 w-5" />}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* FOOTER */}
      <SidebarFooter className="mb-4">
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SideBarLink
                href={Route.SETTINGS}
                label="Settings"
                icon={<Settings className="h-5 w-5" />}
              />

              <SideBarLink
                href={Route.LOGOUT}
                label="Logout"
                icon={<LogOut className="h-5 w-5" />}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
};

export default RestaurantSidebar;
