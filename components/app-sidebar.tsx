"use client";

import { Home, Library, Download, Settings, Server } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarHeader,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/admin", icon: Server },
  { title: "Search", url: "/admin/search", icon: Home },
  { title: "Library", url: "/admin/library", icon: Library },
  { title: "Downloads", url: "/admin/downloads", icon: Download },
];

const settingItems = [
  { title: "Account Details", url: "/admin/settings" },
  { title: "Integrations", url: "/admin/settings/integrations" },
  { title: "Queue & Downloads", url: "/admin/settings/queue" },
  { title: "Utilities", url: "/admin/settings/utilities" },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="h-14 flex items-center border-b border-border px-4">
        <span className="font-bold text-lg tracking-tight">🪐 PoPoTube</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              <SidebarMenuItem>
                <SidebarMenuButton className="pointer-events-none mt-4 font-semibold text-muted-foreground/70">
                  <Settings className="w-4 h-4 mr-2" />
                  <span>Settings Configuration</span>
                </SidebarMenuButton>
                <SidebarMenuSub className="pr-0 mr-0 border-l border-border/50 ml-4">
                  {settingItems.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton asChild isActive={pathname === subItem.url} className={pathname === subItem.url ? "bg-muted" : ""}>
                        <Link href={subItem.url}>
                          <span>{subItem.title}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
