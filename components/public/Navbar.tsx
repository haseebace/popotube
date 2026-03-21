'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Search, Film, Home, List } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <header className={cn(
      "z-50 w-full transition-all duration-300",
      isHome 
        ? "absolute top-0 bg-transparent text-white border-none shadow-none" 
        : "sticky top-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    )}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
            <Film className="h-6 w-6 text-primary" />
            <span>PoPoTube</span>
          </Link>

          <nav className="flex items-center gap-1 md:gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              asChild 
              className={cn(
                "px-2 md:px-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]",
                isHome ? "hover:bg-white/20 text-white" : ""
              )}
            >
              <Link href="/">
                <Home className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Home</span>
              </Link>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              asChild 
              className={cn(
                "px-2 md:px-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]",
                isHome ? "hover:bg-white/20 text-white" : ""
              )}
            >
              <Link href="/categories">
                <List className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Categories</span>
              </Link>
            </Button>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            asChild
            className={cn(
              "drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]",
              isHome ? "hover:bg-white/20 text-white" : ""
            )}
          >
            <Link href="/search">
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

