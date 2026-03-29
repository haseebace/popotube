"use client";

import { useEffect, useState } from "react";
import { Trash2, Play, RefreshCw, Filter, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ExternalPlayerDialog } from "@/components/public/ExternalPlayerDialog";

interface RealDebridTorrent {
  id: string;
  filename: string;
  bytes: number;
  progress: number;
  status: string;
  added: string;
  hash: string;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "Unknown";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

export default function LibraryPage() {
  const [torrents, setTorrents] = useState<RealDebridTorrent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showOnlyDuplicates, setShowOnlyDuplicates] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  const RESULTS_PER_PAGE = 50;
  const totalPages = Math.ceil(totalResults / RESULTS_PER_PAGE);

  useEffect(() => {
    async function fetchLibrary() {
      setLoading(true);
      try {
        const res = await fetch(`/api/backend/library?page=${currentPage}&limit=${RESULTS_PER_PAGE}`);
        if (!res.ok) {
          throw new Error('Failed to fetch from Real-Debrid');
        }
        const data = await res.json();
        setTorrents(data.torrents || []);
        setTotalResults(data.total || 0);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchLibrary();
  }, [currentPage, refreshKey]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey(prev => prev + 1);
    // Simulate a slight delay for visually acknowledging the button click before the fetch finishes
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Build page number list for UI logic
  function getPageNumbers(): (number | "ellipsis")[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "ellipsis")[] = [];
    const addPage = (n: number) => { if (!pages.includes(n)) pages.push(n); };
    addPage(1);
    if (currentPage > 3) pages.push("ellipsis");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) addPage(i);
    if (currentPage < totalPages - 2) pages.push("ellipsis");
    addPage(totalPages);
    return pages;
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-gray-400">
        Loading library…
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-red-400 font-semibold">
        Couldn&apos;t load library: {error}
      </div>
    );
  }

  const handleCleanup = async (id: string, filename: string, quiet = false) => {
    try {
      const res = await fetch(`/api/backend/library/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to delete from Real-Debrid");
      
      setTorrents(prev => prev.filter(t => t.id !== id));
      if (!quiet) {
        toast.success("Torrent removed", {
            description: filename
        });
      }
    } catch (err: any) {
      if (!quiet) {
        toast.error(`Couldn't remove torrent: ${err.message}`);
      }
      throw err;
    }
  };

  const handleCleanupDuplicates = async () => {
    const duplicates = torrents.filter(t => hashMap[t.hash] > 1);
    if (duplicates.length === 0) return;

    setIsCleaning(true);
    toast.info(`Removing duplicate torrents…`);

    const toDelete: {id: string, name: string}[] = [];
    const seen = new Set<string>();

    // Sort by date (descending) so we keep the newest one
    const sorted = [...torrents].sort((a, b) => new Date(b.added).getTime() - new Date(a.added).getTime());

    sorted.forEach(t => {
      const h = t.hash;
      if (seen.has(h)) {
        toDelete.push({id: t.id, name: t.filename});
      } else {
        seen.add(h);
      }
    });

    if (toDelete.length === 0) {
        toast.success("No duplicates to remove");
        setIsCleaning(false);
        return;
    }

    try {
        let count = 0;
        for (const item of toDelete) {
            await handleCleanup(item.id, item.name, true);
            count++;
        }
        toast.success(`Removed ${count} duplicate torrent${count === 1 ? "" : "s"}`);
    } catch (err) {
        toast.error("Some duplicates couldn't be removed. Refresh and try again.");
    } finally {
        setIsCleaning(false);
    }
  };

  // Hashing logic
  const hashMap = torrents.reduce((acc, t) => {
    acc[t.hash] = (acc[t.hash] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const displayedTorrents = showOnlyDuplicates 
    ? torrents.filter(t => hashMap[t.hash] > 1)
    : torrents;

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 py-10">
      <div className="flex justify-between items-center mb-8">
         <h1 className="text-3xl font-bold tracking-tight text-foreground">Real-Debrid library</h1>
         <div className="flex items-center gap-3">
            <Button
              variant={showOnlyDuplicates ? "default" : "outline"}
              size="sm"
              onClick={() => setShowOnlyDuplicates(!showOnlyDuplicates)}
              className={showOnlyDuplicates ? "bg-orange-600 hover:bg-orange-700 text-white" : ""}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showOnlyDuplicates ? "Showing duplicates" : "Show duplicates only"}
            </Button>

            {showOnlyDuplicates && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCleanupDuplicates}
                disabled={isCleaning}
                className="bg-primary/10 text-primary hover:bg-primary/20"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Remove duplicates on page
              </Button>
            )}

           <Button 
             variant="outline" 
             size="sm" 
             onClick={handleRefresh}
             disabled={isRefreshing || loading}
           >
             <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing || loading ? 'animate-spin' : ''}`} />
             Sync
           </Button>
         </div>
      </div>
      
      {torrents.length === 0 ? (
        <div className="text-muted-foreground p-8 text-center border mr-8 rounded-lg bg-card shadow-sm">
          No torrents in this account yet. Add one from Search or ingestion.
        </div>
      ) : (
        <div className="border rounded-md bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[35%] py-4">Title</TableHead>
                <TableHead className="w-[15%]">Status</TableHead>
                <TableHead className="w-[15%]">Size</TableHead>
                <TableHead className="w-[15%]">Added</TableHead>
                <TableHead className="w-[10%] text-center">Stream</TableHead>
                <TableHead className="w-[10%] text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedTorrents.map((t) => {
                 const isDuplicate = hashMap[t.hash] > 1;
                 return (
                <TableRow 
                    key={t.id} 
                    className={`hover:bg-muted/30 transition-colors ${isDuplicate ? 'bg-orange-500/5 hover:bg-orange-500/10' : ''}`}
                >
                  <TableCell className="font-medium align-middle max-w-[200px] sm:max-w-[300px] lg:max-w-[400px]">
                    <div className="flex flex-col gap-1">
                      <span className="line-clamp-2 break-words block" title={t.filename}>
                        {t.filename}
                      </span>
                      {isDuplicate && (
                        <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider flex items-center">
                          <span className="h-1.5 w-1.5 rounded-full bg-orange-600 mr-1.5 animate-pulse" />
                          Duplicate hash
                        </span>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell className="align-middle">
                    <Badge variant={t.status === 'downloaded' ? 'seeder-green' : t.status.includes('error') ? 'destructive' : 'secondary'}>
                      {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                    </Badge>
                  </TableCell>
                  
                  <TableCell className="align-middle text-sm text-muted-foreground font-medium tabular-nums">
                    {formatBytes(t.bytes)}
                  </TableCell>
                  
                  <TableCell className="align-middle text-sm text-muted-foreground font-medium">
                    {new Date(t.added).toLocaleDateString()}
                  </TableCell>
                  
                  <TableCell className="align-middle text-center">
                    {t.status === 'downloaded' && (
                      <ExternalPlayerDialog
                        playerName="IINA"
                        url="" // Dynamically handled below
                        filename={t.filename}
                        onLaunch={async () => {
                          try {
                            toast.info("Preparing stream link…");
                            const res = await fetch(`/api/backend/library/${t.id}/stream`);
                            if (!res.ok) throw new Error("Failed to pull playable link");
                            const data = await res.json();
                            if (data.stream_url) {
                              window.location.assign(`iina://weblink?url=${encodeURIComponent(data.stream_url)}`);
                            }
                          } catch(err: any){
                            toast.error(err.message);
                          }
                        }}
                      >
                        <Button 
                          variant="secondary" 
                          size="icon" 
                          className="h-8 w-8 rounded-full shadow-sm hover:scale-105 transition-transform"
                          title="Stream Media (IINA)"
                        >
                          <Play className="h-4 w-4 ml-0.5" />
                        </Button>
                      </ExternalPlayerDialog>
                    )}
                  </TableCell>
                  
                  <TableCell className="text-right align-middle pr-6">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="icon"
                          title="Delete Torrent"
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete torrent?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Permanently deletes <span className="font-semibold text-foreground">{t.filename}</span> from Real-Debrid. This can&apos;t be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            variant="destructive"
                            onClick={() => handleCleanup(t.id, t.filename)}
                          >
                            Delete torrent
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination Container */}
      {!loading && totalPages > 1 && (
        <div style={{ marginTop: "24px" }}>
          <Pagination>
            <PaginationContent>
              {/* Previous Jump */}
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => { e.preventDefault(); if (currentPage > 1) setCurrentPage(p => p - 1); }}
                  aria-disabled={currentPage === 1}
                />
              </PaginationItem>

              {/* Exact Page Indexes */}
              {getPageNumbers().map((page, idx) =>
                page === "ellipsis" ? (
                  <PaginationItem key={`ellipsis-${idx}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={`page-${page}`}>
                    <Button
                      variant={currentPage === page ? "default" : "outline"}
                      className="w-9 h-9 p-0"
                      onClick={() => setCurrentPage(page as number)}
                    >
                      {page}
                    </Button>
                  </PaginationItem>
                )
              )}

              {/* Next Jump */}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) setCurrentPage(p => p + 1); }}
                  aria-disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
