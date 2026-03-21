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
    if (!rdToken.trim()) return toast.error("API Key cannot be blank.");
    setSaving(true);
    try {
      const res = await fetch('/api/backend/settings/configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'REAL_DEBRID_API_KEY', value: rdToken.trim() })
      });
      if (!res.ok) throw new Error("Failed to save configuration");
      toast.success("Real-Debrid API Key updated securely!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">API Keys</h1>
          <p className="text-muted-foreground mt-1 text-sm">Provider access tokens mapping logic to external databases.</p>
        </div>
        <Button variant="destructive" onClick={handleSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-primary" />
            <CardTitle>Real-Debrid Integration</CardTitle>
          </div>
          <CardDescription>
            Privately link your infinite bandwidth payload token. This token remains synced gracefully inside the database and overrides internal `.env` architecture limits.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label className="font-semibold text-muted-foreground">Master API Key</Label>
            <Input 
              type="password" 
              placeholder="Paste your private API token from real-debrid.com/apitoken"
              value={rdToken}
              onChange={(e) => setRdToken(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 border-t py-4 justify-end">
          <Button onClick={handleSaveRDKey} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Encrypting..." : "Save API Key"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
