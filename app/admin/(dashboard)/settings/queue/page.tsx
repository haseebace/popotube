"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function QueuePage() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out");
      router.push('/admin/login');
    } catch (error: any) {
      toast.error(error.message || "Couldn't sign out. Try again.");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Queue</h1>
          <p className="text-muted-foreground mt-1 text-sm">Concurrency and retries for background jobs (Redis / BullMQ).</p>
        </div>
        <Button variant="destructive" onClick={handleSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign out
        </Button>
      </div>

      <Card className="border-border/60 shadow-sm opacity-60">
        <CardHeader>
          <CardTitle>Queue settings</CardTitle>
          <CardDescription>Coming soon. You&apos;ll set worker concurrency and retry behavior here.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col space-y-1">
              <Label className="font-medium text-base">Auto-retry failed jobs</Label>
              <span className="text-sm text-muted-foreground w-3/4">Retry downloads when the host or link fails (placeholder).</span>
            </div>
            <Switch checked disabled />
          </div>
          <Separator />
          <div className="grid gap-2">
            <Label>Max concurrent downloads</Label>
            <Input type="number" value={5} disabled />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
