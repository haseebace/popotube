"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";

interface Video {
  id: string;
  title: string;
  stream_url: string;
  created_at: string;
  size_bytes: number;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "Unknown";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

export default function LibraryPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLibrary() {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching library", error);
      } else {
        setVideos(data || []);
      }
      setLoading(false);
    }
    fetchLibrary();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-gray-400">
        Loading library...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 tracking-tight text-foreground">Your Video Library</h1>
      
      {videos.length === 0 ? (
        <div className="text-muted-foreground p-8 text-center border mr-8 rounded-lg bg-card shadow-sm">
          No completed videos in your library yet. Download something!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map((video) => (
            <div key={video.id} className="group relative rounded-xl border bg-card overflow-hidden hover:border-ring transition-all shadow-md hover:shadow-xl">
              <div className="aspect-video bg-black relative">
                 <iframe 
                    src={video.stream_url + "?autoplay=false"}
                    loading="lazy"
                    className="w-full h-full border-0 absolute inset-0" 
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;" 
                    allowFullScreen={true}>
                 </iframe>
              </div>
              <div className="p-4 border-t">
                <h3 className="font-semibold text-card-foreground text-md truncate mb-2 group-hover:text-primary transition-colors" title={video.title}>
                  {video.title}
                </h3>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>{formatBytes(video.size_bytes)}</span>
                  <span>{new Date(video.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
