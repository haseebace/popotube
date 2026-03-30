import React from "react";
import CinematicNavbar from "@/components/public/CinematicNavbar";
import MotionConfigProvider from "@/components/public/MotionConfigProvider";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MotionConfigProvider>
      <div className="public-shell flex min-h-screen flex-col bg-surface text-on-surface">
        <CinematicNavbar />
        <main className="flex w-full flex-1 flex-col pt-14">{children}</main>
      </div>
    </MotionConfigProvider>
  );
}
