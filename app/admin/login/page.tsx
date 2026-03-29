"use client";

import { useState } from "react";
import { login } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import GridDistortion from "@/components/GridDistortion";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const errorMsg = await login(formData);
    if (errorMsg) {
      setError(errorMsg);
      setLoading(false);
    }
  }

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Canvas lives at z-0 and fills the whole screen — must NOT be -z-10 */}
      <div className="absolute inset-0 z-0">
        <GridDistortion
          imageSrc="/17ab0f53-b471-46c2-bef1-58d033640a1d.jpg"
          grid={20}
          mouse={0.45}
          strength={0.4}
          relaxation={0.9}
        />
      </div>

      {/* Dark scrim — pointer-events-none so mouse passes straight through to the canvas */}
      <div className="absolute inset-0 z-10 bg-black/55 pointer-events-none" />

      {/* Card wrapper — pointer-events-none on the shell, auto only on the card itself */}
      <div className="absolute inset-0 z-20 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-sm">
          <Card className="w-full max-w-sm backdrop-blur-sm bg-background/80">
            <CardHeader>
              <CardTitle className="text-2xl">Admin sign-in</CardTitle>
              <CardDescription>
                Sign in to manage ingestion, the library, and settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
