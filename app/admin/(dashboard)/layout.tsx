import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="sticky top-0 z-10 flex h-14 w-full items-center gap-2 border-b bg-background/95 backdrop-blur px-4">
          <SidebarTrigger />
        </header>
        <main className="flex-1">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
