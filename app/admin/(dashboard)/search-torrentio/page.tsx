"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Link as LinkIcon, RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TMDBSearchAutocomplete } from "@/components/admin/TMDBSearchAutocomplete";
import { parseTorrentMetadata } from "@/utils/torrent-parser";

interface TorrentioResult {
  title: string;
  sizeStr: string;
  sizeBytes: number;
  seeders: number;
  magnetUri: string | null;
  infoHash: string | null;
  details: string;
  source: string;
}

interface SelectedMovie {
  id: number;
  title: string;
  release_date?: string;
}

function SkeletonRow() {
  return (
    <TableRow>
      <TableCell className="pl-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-3/4 rounded-md" />
          <Skeleton className="h-3 w-1/3 rounded-md" />
        </div>
      </TableCell>
      <TableCell><Skeleton className="h-6 w-16 px-2.5 py-0.5 rounded-full" /></TableCell>
      <TableCell><Skeleton className="h-4 w-12 rounded-md" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20 rounded-md" /></TableCell>
      <TableCell className="pr-4 text-right">
          <Skeleton className="h-8 w-24 rounded-md ml-auto" />
      </TableCell>
    </TableRow>
  );
}

export default function TorrentioSearchPage() {
  const router = useRouter();
  const [selectedMovie, setSelectedMovie] = useState<SelectedMovie | null>(null);
  const [results, setResults] = useState<TorrentioResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isIngesting, setIsIngesting] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("seeders");
  const [sortOrder, setSortOrder] = useState("desc");

  async function fetchStreams(tmdbId: number) {
    setLoading(true);
    setResults([]);
    try {
      const res = await fetch(`/api/torrentio/search?tmdbId=${tmdbId}`);
      if (!res.ok) throw new Error("Failed to fetch streams");
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to fetch streams");
    } finally {
      setLoading(false);
    }
  }

  async function handleIngest(result: TorrentioResult) {
    if (!result.magnetUri) return;
    setIsIngesting(result.infoHash);
    
    const metadata = parseTorrentMetadata(result.title);

    try {
      const res = await fetch('/api/backend/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          magnet: result.magnetUri,
          size: result.sizeBytes,
          title: result.title,
          tmdb_id: selectedMovie?.id,
          quality: metadata.quality,
          codec: metadata.codec,
          source: metadata.source
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to ingest");

      toast.success("Successfully sent to Real-Debrid!");
      router.push('/admin/activedownloads');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to ingest");
    } finally {
      setIsIngesting(null);
    }
  }

  const sortedResults = [...results].sort((a, b) => {
    let comparison = 0;
    if (sortBy === "seeders") comparison = a.seeders - b.seeders;
    else if (sortBy === "size") comparison = a.sizeBytes - b.sizeBytes;
    else if (sortBy === "title") comparison = a.title.localeCompare(b.title);
    
    return sortOrder === "desc" ? comparison * -1 : comparison;
  });

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 py-10">
      <div className="mb-10 text-center">
         <h1 className="text-4xl font-black tracking-tight mb-2">Torrentio Search</h1>
         <p className="text-muted-foreground">High-speed P2P link discovery powered by Stremio Engines</p>
      </div>

      <div className="mb-10 bg-card border rounded-xl p-6 max-w-2xl mx-auto flex flex-col gap-3">
        <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground block">1. Select Movie from TMDb</Label>
        
        <div className="flex gap-2">
          <TMDBSearchAutocomplete 
            className="relative flex-1"
            onSelect={(movie) => {
              setSelectedMovie(movie);
              fetchStreams(movie.id);
            }} 
          />
          {selectedMovie && (
            <Button 
              variant="secondary" 
              className="px-8 h-10 font-bold whitespace-nowrap"
              onClick={() => {
                setSelectedMovie(null);
                setResults([]);
              }}
            >
              Clear Link
            </Button>
          )}
        </div>

        {selectedMovie && (
          <Badge variant="secondary" className="w-fit bg-primary/5 text-primary border-primary/20 py-1.5 px-3 flex items-center gap-2">
            <span className="text-[9px] uppercase font-black px-1.5 py-0.5 bg-primary text-white rounded">Linked</span>
            <span className="font-bold">{selectedMovie.title}</span>
            <span className="text-muted-foreground font-medium">({selectedMovie.release_date?.substring(0,4)})</span>
          </Badge>
        )}
      </div>

      {results.length > 0 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
           <div className="flex items-center gap-2">
              <Badge variant="secondary" className="px-3 py-1 font-bold">{results.length} Streams Found</Badge>
              <Button variant="ghost" size="sm" onClick={() => fetchStreams(selectedMovie?.id)} className="h-8">
                 <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                 Refresh
              </Button>
           </div>

           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[120px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seeders">Seeders</SelectItem>
                    <SelectItem value="size">Size</SelectItem>
                    <SelectItem value="title">Filename</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Order</Label>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="w-[100px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Desc</SelectItem>
                    <SelectItem value="asc">Asc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
           </div>
        </div>
      )}

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="pl-6 py-4">Release Filename</TableHead>
              <TableHead className="w-[150px]">Status</TableHead>
              <TableHead className="w-[120px]">Size</TableHead>
              <TableHead className="w-[150px]">Provider</TableHead>
              <TableHead className="w-[180px] pr-6 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)
            ) : results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center text-muted-foreground">
                  {selectedMovie ? "No streams found for this movie." : "Search for a movie to see results."}
                </TableCell>
              </TableRow>
            ) : (
              sortedResults.map((res, i) => {
                const metadata = parseTorrentMetadata(res.title);
                return (
                  <TableRow key={i} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="pl-6 max-w-[400px]">
                      <div className="flex flex-col gap-1 py-1">
                        <span className="font-bold text-sm leading-tight line-clamp-2" title={res.title}>{res.title}</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                           {metadata.quality !== 'unknown' && <Badge variant="outline" className="text-[10px] uppercase font-bold py-0">{metadata.quality}</Badge>}
                           {metadata.codec !== 'unknown' && <Badge variant="outline" className="text-[10px] uppercase font-bold py-0 text-muted-foreground">{metadata.codec}</Badge>}
                           <Badge variant="secondary" className="text-[10px] py-0 font-medium">{res.details}</Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                       <Badge variant={res.seeders > 50 ? "seeder-green" : res.seeders > 5 ? "seeder-yellow" : "seeder-red"} className="font-bold tabular-nums">
                          ▲ {res.seeders} Seeds
                       </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-sm tabular-nums text-muted-foreground">
                       {res.sizeStr}
                    </TableCell>
                    <TableCell>
                       <span className="text-sm font-semibold">{res.source}</span>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                       <div className="flex flex-col items-end gap-2">
                         <Button 
                           size="sm" 
                           onClick={() => handleIngest(res)}
                           disabled={isIngesting === res.infoHash}
                           className="h-8 font-bold px-4 w-full max-w-[120px]"
                         >
                           {isIngesting === res.infoHash ? "Sending..." : "Ingest RD"}
                         </Button>
                         <Button
                           variant="ghost"
                           size="sm"
                           className="h-7 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                           onClick={() => {
                             if(res.magnetUri) navigator.clipboard.writeText(res.magnetUri);
                             toast.success("Magnet copied!");
                           }}
                         >
                            <LinkIcon className="h-3 w-3 mr-1.5" />
                            Copy Link
                         </Button>
                       </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
