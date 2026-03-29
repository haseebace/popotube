"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Trash2, Pause, Play } from "lucide-react";
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

export default function DownloadsPage() {
  const [downloads, setDownloads] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial fetch
  useEffect(() => {
    async function fetchDownloads() {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .neq('status', 'completed')
        .neq('status', 'failed')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching downloads", error);
      } else {
        setDownloads(data || []);
      }
      setLoading(false);
    }
    fetchDownloads();

    // Subscribe to realtime updates
    const channel = supabase.channel('videos_changes_dev')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'videos',
        },
        (payload) => {
          console.log("Realtime payload received", payload);
          // If INSERT, add to array (if active state)
          // If UPDATE, update existing
          // If DELETE, remove
          if (payload.eventType === 'INSERT') {
            const newDoc = payload.new as Video;
            if (newDoc.status !== 'completed' && newDoc.status !== 'failed') {
               setDownloads((prev) => [newDoc, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Video;
            setDownloads((prev) => {
              if (updated.status === 'completed' || updated.status === 'failed') {
                 return prev.filter(v => v.id !== updated.id);
              }
              const exists = prev.find(v => v.id === updated.id);
              if (exists) {
                // Return a fresh object to guarantee React triggers a re-render
                return prev.map(v => v.id === updated.id ? { ...updated } : v);
              } else {
                return [{ ...updated }, ...prev];
              }
            });
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as { id: string };
            setDownloads((prev) => prev.filter(v => v.id !== deleted.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function renderStatusBadge(status: string, errorMsg?: string | null) {
    if (status === 'failed') {
       return <Badge variant="destructive" title={errorMsg || 'Failed'}>Failed</Badge>;
    }
    if (status === 'completed') {
       return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>;
    }
    return <Badge variant="secondary" className="animate-pulse capitalize">{status.replace('_', ' ')}</Badge>;
  }

  function formatRelativeDate(dateStr: string) {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? 'Unknown' : d.toLocaleString();
  }

  async function handleCancelJob(videoId: string) {
    try {
      const res = await fetch('/api/backend/cancel-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to cancel job');
      }
      
      // Realtime subscription will automatically immediately remove it from the array
    } catch (err: any) {
      console.error(err);
      alert(`Couldn't cancel job: ${err.message}`);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6 tracking-tight text-foreground">Active downloads</h1>
      
      {loading ? (
        <div className="text-muted-foreground">Loading downloads…</div>
      ) : downloads.length === 0 ? (
        <div className="text-muted-foreground p-8 text-center border rounded-lg bg-card shadow-sm">
          No active downloads. Start an ingest from Search to see jobs here.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {downloads.map((video) => (
            <div key={video.id} className="p-4 border bg-card rounded-xl flex items-start gap-4 shadow-sm hover:border-ring transition-colors">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-card-foreground truncate text-lg pb-2 border-b mb-2">
                  {video.title}
                </h3>
                <div className="flex flex-wrap items-center gap-4 text-sm mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold">Status</span>
                    {renderStatusBadge(video.status, video.error_message)}
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-muted-foreground">
                    <span className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold">Started</span>
                    <span>{formatRelativeDate(video.created_at)}</span>
                  </div>
                   <div className="hidden sm:flex items-center gap-2 text-muted-foreground font-mono text-xs truncate">
                    <span className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold mr-1 font-sans">Hash</span>
                    {video.info_hash}
                  </div>
                </div>
                
                <div className="mt-4 flex items-center gap-3">
                  <Progress value={video.progress || 0} className="h-2 flex-1" />
                  <span className="text-xs font-mono text-muted-foreground w-10 text-right">
                    {Math.round(video.progress || 0)}%
                  </span>
                </div>
              </div>

               {/* Action Buttons */}
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
                    <PopoverContent className="w-64 p-4 shadow-xl border-destructive/20" align="end">
                       <div className="space-y-4">
                          <div className="space-y-1">
                             <h4 className="font-semibold text-sm leading-none">Cancel download?</h4>
                             <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Stops ingestion and permanently deletes local files for this job.
                             </p>
                          </div>
                          <div className="flex justify-end gap-2 pt-2 border-t mt-2">
                             <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2 h-7">
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
