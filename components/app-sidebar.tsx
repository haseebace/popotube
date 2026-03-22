"use client";

import {
  Home,
  Library,
  Download,
  Settings,
  Server,
  ChevronRight,
  Folder,
} from "lucide-react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const items = [
  { title: "Dashboard", url: "/admin", icon: Server },
  { title: "Search", url: "/admin/search", icon: Home },
  { title: "Active Downloads", url: "/admin/activedownloads", icon: Download },
  { title: "Torrents", url: "/admin/torrents", icon: Library },
  {
    title: "Downloaded & Unrestricted",
    url: "/admin/downloaded-unrestricted",
    icon: Folder,
  },
  {
    title: "Settings",
    url: "/admin/settings",
    icon: Settings,
    subItems: [
      { title: "Account Details", url: "/admin/settings" },
      { title: "Integrations", url: "/admin/settings/integrations" },
      { title: "Queue & Downloads", url: "/admin/settings/queue" },
      { title: "Utilities", url: "/admin/settings/utilities" },
    ],
  },
];

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const sidebarVariants = {
  container: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1,
      },
    },
  },
  item: {
    hidden: { opacity: 0, x: 20 },
    show: { 
      opacity: 1, 
      x: 0,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30
      }
    },
    exit: { 
      opacity: 0, 
      x: 20,
      transition: { duration: 0.2 }
    },
  },
  line: {
    hidden: { scaleY: 0 },
    show: { 
      scaleY: 1,
      transition: {
        duration: 0.4,
        ease: "easeInOut" as const
      }
    },
    exit: {
      scaleY: 0,
      transition: {
        duration: 0.2,
        ease: "easeInOut" as const
      }
    }
  }
};

function CollapsibleSidebarItem({ item, pathname }: { item: any, pathname: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible
      key={item.title}
      className="group/collapsible"
      open={isOpen}
      onOpenChange={setIsOpen}
      asChild
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            isActive={pathname.startsWith(item.url)}
            asChild
          >
            <motion.div 
              whileHover="hover" 
              className="flex items-center w-full cursor-pointer"
            >
              {item.title === "Settings" ? (
                <motion.div
                  variants={{
                    hover: { rotate: 90 }
                  }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="mr-2 flex items-center justify-center shrink-0"
                >
                  <item.icon className="size-4 text-muted-foreground/80" />
                </motion.div>
              ) : (
                <item.icon className="size-4 shrink-0 mr-2 text-muted-foreground/80" />
              )}
              <span className="text-sm font-normal text-foreground/80">{item.title}</span>
              <ChevronRight className={`ml-auto transition-transform duration-500 text-muted-foreground/50 ${isOpen ? 'rotate-90' : ''}`} />
            </motion.div>
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent forceMount>
          <AnimatePresence>
            {isOpen && (
              <SidebarMenuSub className="mr-0 pr-0 border-l-0 relative ml-3 pl-3">
                <motion.div
                  variants={sidebarVariants.line}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="absolute left-0 top-0 w-px bg-border origin-top h-full"
                />
                <motion.div
                  variants={sidebarVariants.container}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="flex flex-col gap-1"
                >
                  {item.subItems!.map((sub: any) => (
                    <motion.div key={sub.title} variants={sidebarVariants.item}>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={pathname === sub.url}
                        >
                          <Link href={sub.url} className="flex items-center w-full">
                            <span className="text-[13px] font-normal text-foreground/60">{sub.title}</span>
                          </Link>

                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </motion.div>
                  ))}
                </motion.div>
              </SidebarMenuSub>
            )}
          </AnimatePresence>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="h-14 flex items-center border-b border-border px-4">
        <span className="font-bold text-lg tracking-tight"> PoPoTube</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/50">Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const hasSubItems = item.subItems && item.subItems.length > 0;

                if (hasSubItems) {
                  return <CollapsibleSidebarItem key={item.title} item={item} pathname={pathname} />;
                }

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                      <Link href={item.url} className="flex items-center w-full">
                        <item.icon className="size-4 shrink-0 mr-2 text-muted-foreground/80" />
                        <span className="text-sm font-normal text-foreground/80">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}


