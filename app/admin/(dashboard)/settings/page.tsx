"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { LogOut, User as UserIcon, Calendar, Box, Activity, Crown } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface RDUser {
  id: number;
  username: string;
  email: string;
  points: number;
  locale: string;
  avatar: string;
  type: string;
  premium: number;
  expiration: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [rdUser, setRdUser] = useState<RDUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRDUser() {
      try {
        const res = await fetch('/api/backend/settings/real-debrid/user');
        if (res.ok) {
          const data = await res.json();
          setRdUser(data.user);
        }
      } catch (err) {
        console.error("Failed to load RD user", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRDUser();
  }, []);

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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Account</h1>
          <p className="text-muted-foreground mt-1 text-sm">Real-Debrid profile used by this backend.</p>
        </div>
        <Button variant="destructive" onClick={handleSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign out
        </Button>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Real-Debrid profile</CardTitle>
          <CardDescription>
            Cached downloads and streams use this account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="text-muted-foreground animate-pulse text-sm">Loading profile…</div>
          ) : rdUser ? (
            <div className="flex flex-col space-y-6">
              <div className="flex items-center space-x-6 bg-muted/30 p-4 rounded-xl border border-border/40">
                <Avatar className="h-20 w-20 border-2 border-primary/20">
                  <AvatarImage src={rdUser.avatar} />
                  <AvatarFallback className="text-xl font-bold"><UserIcon className="w-8 h-8 text-muted-foreground"/></AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-2">
                     <h3 className="text-2xl font-bold">{rdUser.username}</h3>
                     {rdUser.type === 'premium' && (
                       <span className="flex items-center text-[10px] uppercase font-bold tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                         <Crown className="w-3 h-3 mr-1" />
                         Premium
                       </span>
                     )}
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">{rdUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                  <div className="flex items-center space-x-3">
                    <Activity className="w-5 h-5 text-green-500" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Subscription ends</span>
                      <span className="text-xs text-muted-foreground">Premium renewal date</span>
                    </div>
                  </div>
                  <div className="font-semibold text-sm">
                    {new Date(rdUser.expiration).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                  <div className="flex items-center space-x-3">
                    <Box className="w-5 h-5 text-blue-500" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Points</span>
                      <span className="text-xs text-muted-foreground">Real-Debrid rewards balance</span>
                    </div>
                  </div>
                  <div className="font-semibold text-sm">
                    {rdUser.points.toLocaleString()} pts
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-red-400 text-sm">Couldn&apos;t load Real-Debrid account. Set REAL_DEBRID_API_KEY in the environment or under Integrations, then refresh.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
