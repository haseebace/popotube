"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function UtilitiesPage() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out securely.");
      router.push('/admin/login');
    } catch (error: any) {
      toast.error(error.message || "Failed to sign out.");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">App Utilities</h1>
          <p className="text-muted-foreground mt-1 text-sm">Cache flushing and deep system management engines.</p>
        </div>
        <Button variant="destructive" onClick={handleSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>

      <Card className="border-border/60 shadow-sm opacity-60">
        <CardHeader>
          <CardTitle>System & Memory Utilities</CardTitle>
          <CardDescription>Destructive overrides and deep system flushes. (Coming soon)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" disabled className="w-full justify-start text-red-500 hover:text-red-500">Purge TMDB Response Cache</Button>
          <Button variant="outline" disabled className="w-full justify-start text-red-500 hover:text-red-500">Flush Redis Memory Queues</Button>
        </CardContent>
      </Card>
    </div>
  );
}
