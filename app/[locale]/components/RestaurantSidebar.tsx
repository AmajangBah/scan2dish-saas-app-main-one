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
  SidebarSeparator,
} from "@/components/ui/sidebar";

import {
  LayoutDashboard,
  Notebook,
  Utensils,
  Table2,
  BarChart2,
  BadgePercent,
  Boxes,
  Settings,
  LogOut,
} from "lucide-react";

import Route from "../../constants/Route";
import SideBarLink from "./SideBarLink";

const RestaurantSidebar = ({ restaurantName }: { restaurantName: string }) => {
  return (
    <Sidebar collapsible="icon" variant="inset">
      {/* HEADER */}
      <SidebarHeader className="border-b px-3 py-4">
        <div className="flex flex-col gap-1">
          <div className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            Scan2Dish
          </div>
          <h2 className="text-base font-semibold leading-tight truncate">
            {restaurantName}
          </h2>
        </div>
      </SidebarHeader>

      {/* MAIN NAV */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] tracking-wide uppercase text-muted-foreground">
            Overview
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SideBarLink
                href={Route.DASHBOARD}
                label="Overview"
                icon={<LayoutDashboard className="h-4 w-4" />}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] tracking-wide uppercase text-muted-foreground">
            Operations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SideBarLink
                href={Route.ORDERS}
                label="Orders"
                icon={<Notebook className="h-4 w-4" />}
              />

              <SideBarLink
                href={Route.MENU}
                label="Menu"
                icon={<Utensils className="h-4 w-4" />}
              />

              <SideBarLink
                href={Route.TABLES}
                label="Tables"
                icon={<Table2 className="h-4 w-4" />}
              />

              <SideBarLink
                href={Route.INVENTORY}
                label="Inventory"
                icon={<Boxes className="h-4 w-4" />}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] tracking-wide uppercase text-muted-foreground">
            Insights
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SideBarLink
                href={Route.ANALYTICS}
                label="Analytics"
                icon={<BarChart2 className="h-4 w-4" />}
              />

              <SideBarLink
                href={Route.DISCOUNT}
                label="Discounts"
                icon={<BadgePercent className="h-4 w-4" />}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* FOOTER */}
      <SidebarFooter className="mb-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] tracking-wide uppercase text-muted-foreground">
            Account
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SideBarLink
                href={Route.SETTINGS}
                label="Settings"
                icon={<Settings className="h-4 w-4" />}
              />

              <SideBarLink
                href={Route.LOGOUT}
                label="Logout"
                icon={<LogOut className="h-4 w-4" />}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
};

export default RestaurantSidebar;
