"use client";

import { useCallback, useEffect, useState } from "react";
import { publicBackendApiUrl } from "@/lib/backend-public-url";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Video {
  id: string;
  title: string;
  info_hash: string;
  status: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  progress: number;
}

const POLL_MS = 4000;

export default function DownloadsPage() {
  const [downloads, setDownloads] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDownloads = useCallback(async () => {
    try {
      const res = await fetch(
        publicBackendApiUrl("/api/admin/active-downloads"),
      );
      if (!res.ok) throw new Error("Failed to load active downloads");
      const data = (await res.json()) as { downloads?: Video[] };
      setDownloads(data.downloads ?? []);
    } catch (e) {
      console.error("Error fetching downloads", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDownloads();
    const id = setInterval(() => void loadDownloads(), POLL_MS);
    return () => clearInterval(id);
  }, [loadDownloads]);

  function renderStatusBadge(status: string, errorMsg?: string | null) {
    if (status === "failed") {
      return (
        <Badge variant="destructive" title={errorMsg || "Failed"}>
          Failed
        </Badge>
      );
    }
    if (status === "completed") {
      return (
        <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>
      );
    }
    return (
      <Badge variant="secondary" className="animate-pulse capitalize">
        {status.replace("_", " ")}
      </Badge>
    );
  }

  function formatRelativeDate(dateStr: string) {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "Unknown" : d.toLocaleString();
  }

  async function handleCancelJob(videoId: string) {
    try {
      const res = await fetch(publicBackendApiUrl("/api/cancel-job"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to cancel job");
      }

      await loadDownloads();
    } catch (err: unknown) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "Failed to cancel job";
      alert(`Couldn't cancel job: ${message}`);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6 tracking-tight text-foreground">
        Active downloads
      </h1>

      {loading ? (
        <div className="text-muted-foreground">Loading downloads…</div>
      ) : downloads.length === 0 ? (
        <div className="text-muted-foreground p-8 text-center border rounded-lg bg-card shadow-sm">
          No active downloads. Start an ingest from Search to see jobs here.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {downloads.map((video) => (
            <div
              key={video.id}
              className="p-4 border bg-card rounded-xl flex items-start gap-4 shadow-sm hover:border-ring transition-colors"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-card-foreground truncate text-lg pb-2 border-b mb-2">
                  {video.title}
                </h3>
                <div className="flex flex-wrap items-center gap-4 text-sm mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold">
                      Status
                    </span>
                    {renderStatusBadge(video.status, video.error_message)}
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-muted-foreground">
                    <span className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold">
                      Started
                    </span>
                    <span>{formatRelativeDate(video.created_at)}</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-muted-foreground font-mono text-xs truncate">
                    <span className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold mr-1 font-sans">
                      Hash
                    </span>
                    {video.info_hash}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <Progress
                    value={video.progress || 0}
                    className="h-2 flex-1"
                  />
                  <span className="text-xs font-mono text-muted-foreground w-10 text-right">
                    {Math.round(video.progress || 0)}%
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:border-red-500 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-64 p-4 shadow-xl border-destructive/20"
                    align="end"
                  >
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h4 className="font-semibold text-sm leading-none">
                          Cancel download?
                        </h4>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Stops ingestion and permanently deletes local files
                          for this job.
                        </p>
                      </div>
                      <div className="flex justify-end gap-2 pt-2 border-t mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[10px] px-2 h-7"
                        >
                          Keep
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-7 text-[10px] px-2 h-7 font-bold shadow-sm"
                          onClick={() => handleCancelJob(video.id)}
                        >
                          Cancel download
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
