"use client";

import { useEffect, useState } from "react";
import { Trash2, Play, RefreshCw } from "lucide-react";
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

interface RealDebridTorrent {
  id: string;
  filename: string;
  bytes: number;
  progress: number;
  status: string;
  added: string;
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
        Loading Real-Debrid Library...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-red-400 font-semibold">
        Error: {error}
      </div>
    );
  }

  const handleCleanup = async (id: string, filename: string) => {
    try {
      const res = await fetch(`/api/backend/library/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to delete from Real-Debrid");
      
      setTorrents(prev => prev.filter(t => t.id !== id));
      toast.success("Torrent deleted successfully", {
        description: filename
      });
    } catch (err: any) {
      toast.error(`Error cleaning up torrent: ${err.message}`);
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 py-10">
      <div className="flex justify-between items-center mb-8">
         <h1 className="text-3xl font-bold tracking-tight text-foreground">Real-Debrid Library</h1>
         <div className="flex items-center gap-4">
           <Button 
             variant="outline" 
             size="sm" 
             onClick={handleRefresh}
             disabled={isRefreshing || loading}
           >
             <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing || loading ? 'animate-spin' : ''}`} />
             Sync
           </Button>
           <div className="text-sm text-muted-foreground hidden md:block">Manual Cleanup Mode</div>
         </div>
      </div>
      
      {torrents.length === 0 ? (
        <div className="text-muted-foreground p-8 text-center border mr-8 rounded-lg bg-card shadow-sm">
          No active or completed torrents found in your Real-Debrid account.
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
              {torrents.map((t) => (
                <TableRow key={t.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium align-middle max-w-[200px] sm:max-w-[300px] lg:max-w-[400px]">
                    <span className="line-clamp-2 break-words block" title={t.filename}>
                      {t.filename}
                    </span>
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
                      <Button 
                        variant="secondary" 
                        size="icon" 
                        className="h-8 w-8 rounded-full shadow-sm hover:scale-105 transition-transform"
                        title="Stream Media (IINA)"
                        onClick={async () => {
                           try {
                             toast.info("Preparing stream link...");
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
                        <Play className="h-4 w-4 ml-0.5" />
                      </Button>
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
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete <span className="font-semibold text-foreground">{t.filename}</span> from your Real-Debrid account. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            variant="destructive"
                            onClick={() => handleCleanup(t.id, t.filename)}
                          >
                            Continue
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
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
