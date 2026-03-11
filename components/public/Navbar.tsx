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

          <nav className="hidden md:flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/categories">
                <List className="mr-2 h-4 w-4" />
                Categories
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
