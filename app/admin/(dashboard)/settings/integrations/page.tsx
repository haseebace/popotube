"use client";

import { useEffect, useState } from "react";
import { LogOut, Save, Key } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function IntegrationsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [rdToken, setRdToken] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/backend/settings/configs/REAL_DEBRID_API_KEY');
        if (res.ok) {
          const data = await res.json();
          if (data.value) setRdToken(data.value);
        }
      } catch (err) {
        console.error("Failed to fetch Real-Debrid API Key config", err);
      }
    }
    loadConfig();
  }, []);

  const handleSaveRDKey = async () => {
    if (!rdToken.trim()) return toast.error("Enter an API key first.");
    setSaving(true);
    try {
      const res = await fetch('/api/backend/settings/configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'REAL_DEBRID_API_KEY', value: rdToken.trim() })
      });
      if (!res.ok) throw new Error("Couldn't save settings");
      toast.success("API key saved");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">API keys</h1>
          <p className="text-muted-foreground mt-1 text-sm">Tokens for Real-Debrid and other integrations.</p>
        </div>
        <Button variant="destructive" onClick={handleSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign out
        </Button>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-primary" />
            <CardTitle>Real-Debrid</CardTitle>
          </div>
          <CardDescription>
            Stored in the database and overrides REAL_DEBRID_API_KEY from the environment when set.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label className="font-semibold text-muted-foreground">API key</Label>
            <Input 
              type="password" 
              placeholder="Key from real-debrid.com/apitoken"
              value={rdToken}
              onChange={(e) => setRdToken(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 border-t py-4 justify-end">
          <Button onClick={handleSaveRDKey} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving…" : "Save API key"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
