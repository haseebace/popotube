import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Search, Film, Home, List } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Film className="h-6 w-6 text-primary" />
            <span>PoPoTube</span>
          </Link>

          <nav className="flex items-center gap-1 md:gap-2">
            <Button variant="ghost" size="sm" asChild className="px-2 md:px-4">
              <Link href="/">
                <Home className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Home</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="px-2 md:px-4">
              <Link href="/categories">
                <List className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Categories</span>
              </Link>
            </Button>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
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
