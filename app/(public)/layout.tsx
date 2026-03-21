'use client';

import React from 'react';
import Navbar from '@/components/public/Navbar';
import { usePathname } from 'next/navigation';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 w-full flex flex-col items-center">
        {children}
      </main>
    </div>
  );
}
