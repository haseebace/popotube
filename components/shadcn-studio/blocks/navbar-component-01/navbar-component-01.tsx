"use client";

import Link from "next/link";
import { MenuIcon, SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import Logo from "@/components/shadcn-studio/logo";

export type NavigationItem = {
  title: string;
  href: string;
};

const Navbar = ({ navigationData }: { navigationData: NavigationItem[] }) => {
  const mid = Math.ceil(navigationData.length / 2);
  const leftItems = navigationData.slice(0, mid);
  const rightItems = navigationData.slice(mid);

  return (
    <header className="bg-background sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-7 sm:px-6">
        <div className="text-muted-foreground flex min-w-0 flex-1 items-center justify-center gap-8 font-medium lg:gap-16">
          {leftItems.map((item) => (
            <Link
              key={`${item.href}-${item.title}`}
              href={item.href}
              className="hover:text-primary max-md:hidden"
            >
              {item.title}
            </Link>
          ))}
          <Link href="/" className="text-foreground shrink-0">
            <Logo className="gap-3" />
          </Link>
          {rightItems.map((item) => (
            <Link
              key={`${item.href}-${item.title}`}
              href={item.href}
              className="hover:text-primary max-md:hidden"
            >
              {item.title}
            </Link>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-6">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/search" aria-label="Search">
              <SearchIcon />
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger className="md:hidden" asChild>
              <Button variant="outline" size="icon" aria-label="Menu">
                <MenuIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuGroup>
                {navigationData.map((item, index) => (
                  <DropdownMenuItem key={`${item.href}-${index}`} asChild>
                    <Link href={item.href}>{item.title}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
