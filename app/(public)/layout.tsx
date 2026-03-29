"use client";

import React from "react";
import Navbar from "@/components/public/Navbar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 w-full flex flex-col items-center">
        {children}
      </main>
    </div>
  );
}
