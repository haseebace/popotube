"use client";

import { useEffect, useState } from "react";
import {
  Trash2,
  Play,
  RefreshCw,
  ExternalLink,
  Filter,
  Sparkles,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface RealDebridDownload {
  id: string;
  filename: string;
  mimeType: string;
  filesize: number;
  link: string;
  host: string;
  chunks: number;
  download: string;
  generated: string;
}

type ErrorWithMessage = {
  message: string;
};

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "Unknown";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

export default function DownloadedUnrestrictedPage() {
  const [downloads, setDownloads] = useState<RealDebridDownload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showOnlyDuplicates, setShowOnlyDuplicates] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const RESULTS_PER_PAGE = 50;
  const totalPages = Math.ceil(totalResults / RESULTS_PER_PAGE);

  useEffect(() => {
    async function fetchDownloads() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/backend/downloads?page=${currentPage}&limit=${RESULTS_PER_PAGE}`,
        );
        if (!res.ok) {
          throw new Error("Failed to fetch downloads from Real-Debrid");
        }
        const data = await res.json();
        setDownloads(data.downloads || []);
        setTotalResults(data.total || 0);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : (err as ErrorWithMessage).message || "Failed to fetch downloads";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    fetchDownloads();
  }, [currentPage, refreshKey]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey((prev) => prev + 1);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleDelete = async (id: string, filename: string, quiet = false) => {
    try {
      const res = await fetch(`/api/backend/downloads/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete from downloads list");

      setDownloads((prev) => prev.filter((d) => d.id !== id));
      if (!quiet) {
        toast.success("Removed from list", {
          description: filename,
        });
      }
    } catch (err) {
      if (!quiet) {
        const message =
          err instanceof Error
            ? err.message
            : (err as ErrorWithMessage).message || "Failed to remove download";
        toast.error(`Couldn't remove download: ${message}`);
      }
      throw err;
    }
  };

  const handleCleanupDuplicates = async () => {
    const duplicates = downloads.filter(
      (d) => fingerprintMap[`${d.filename}-${d.filesize}`] > 1,
    );
    if (duplicates.length === 0) return;

    setIsCleaning(true);
    toast.info(`Removing ${duplicates.length} duplicate links…`);

    const toDelete: { id: string; name: string }[] = [];
    const seen = new Set<string>();

    // Sort by date (descending) so we keep the newest one
    const sorted = [...downloads].sort(
      (a, b) =>
        new Date(b.generated).getTime() - new Date(a.generated).getTime(),
    );

    sorted.forEach((d) => {
      const fp = `${d.filename}-${d.filesize}`;
      if (seen.has(fp)) {
        toDelete.push({ id: d.id, name: d.filename });
      } else {
        seen.add(fp);
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
        await handleDelete(item.id, item.name, true);
        count++;
      }
      toast.success(`Removed ${count} duplicate link${count === 1 ? "" : "s"}`);
    } catch {
      toast.error(
        "Some duplicates couldn't be removed. Refresh and try again.",
      );
    } finally {
      setIsCleaning(false);
    }
  };

  // Fingerprint logic
  const fingerprintMap = downloads.reduce(
    (acc, d) => {
      const fp = `${d.filename}-${d.filesize}`;
      acc[fp] = (acc[fp] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const displayedDownloads = downloads.filter((d) => {
    const matchesSearch = d.filename
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const isDupe = fingerprintMap[`${d.filename}-${d.filesize}`] > 1;

    if (showOnlyDuplicates) {
      return matchesSearch && isDupe;
    }
    return matchesSearch;
  });

  function getPageNumbers(): (number | "ellipsis")[] {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "ellipsis")[] = [];
    const addPage = (n: number) => {
      if (!pages.includes(n)) pages.push(n);
    };
    addPage(1);
    if (currentPage > 3) pages.push("ellipsis");
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    )
      addPage(i);
    if (currentPage < totalPages - 2) pages.push("ellipsis");
    addPage(totalPages);
    return pages;
  }

  if (loading && !isRefreshing) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-gray-400">
        Loading download history…
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-red-400 font-semibold">
        Couldn&apos;t load downloads: {error}
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground whitespace-nowrap">
          Unrestricted downloads
        </h1>

        <div className="flex flex-col sm:flex-row items-center w-full md:w-auto gap-3">
          <div className="relative w-full sm:w-64 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter by filename…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card shadow-sm border-muted-foreground/20"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant={showOnlyDuplicates ? "default" : "outline"}
              size="sm"
              onClick={() => setShowOnlyDuplicates(!showOnlyDuplicates)}
              className={
                showOnlyDuplicates
                  ? "bg-orange-600 hover:bg-orange-700 text-white"
                  : ""
              }
            >
              <Filter className="h-4 w-4 mr-2" />
              {showOnlyDuplicates
                ? "Showing duplicates"
                : "Show duplicates only"}
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
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRefreshing || loading ? "animate-spin" : ""}`}
              />
              Sync
            </Button>
          </div>
        </div>
      </div>

      {downloads.length === 0 ? (
        <div className="text-muted-foreground p-8 text-center border mr-8 rounded-lg bg-card shadow-sm">
          No links yet. Generated Real-Debrid downloads show up here after you
          stream or download.
        </div>
      ) : (
        <div className="border rounded-md bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[40%] py-4">Filename</TableHead>
                <TableHead className="w-[15%]">Size</TableHead>
                <TableHead className="w-[15%]">Generated</TableHead>
                <TableHead className="w-[10%]">Hoster</TableHead>
                <TableHead className="w-[10%] text-center">Stream</TableHead>
                <TableHead className="w-[10%] text-right pr-6">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedDownloads.map((d) => {
                const isDuplicate =
                  fingerprintMap[`${d.filename}-${d.filesize}`] > 1;
                return (
                  <TableRow
                    key={d.id}
                    className={`hover:bg-muted/30 transition-colors ${isDuplicate ? "bg-orange-500/5 hover:bg-orange-500/10" : ""}`}
                  >
                    <TableCell className="font-medium align-middle max-w-[300px]">
                      <div className="flex flex-col gap-1">
                        <span
                          className="line-clamp-1 break-words block"
                          title={d.filename}
                        >
                          {d.filename}
                        </span>
                        {isDuplicate && (
                          <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider flex items-center">
                            <span className="h-1.5 w-1.5 rounded-full bg-orange-600 mr-1.5 animate-pulse" />
                            Duplicate
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="align-middle text-sm text-muted-foreground font-medium tabular-nums">
                      {formatBytes(d.filesize)}
                    </TableCell>

                    <TableCell className="align-middle text-sm text-muted-foreground font-medium">
                      {new Date(d.generated).toLocaleDateString()}
                    </TableCell>

                    <TableCell className="align-middle">
                      <Badge variant="secondary" className="capitalize">
                        {d.host.split(".")[0]}
                      </Badge>
                    </TableCell>

                    <TableCell className="align-middle text-center">
                      <div className="flex items-center justify-center gap-2">
                        <ExternalPlayerDialog
                          playerName="IINA"
                          url={d.download}
                          filename={d.filename}
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full shadow-sm hover:scale-105 transition-transform"
                          title="Download Link"
                          asChild
                        >
                          <a
                            href={d.download}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </TableCell>

                    <TableCell className="text-right align-middle pr-6">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="icon"
                            title="Remove from history"
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Remove from history?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Removes{" "}
                              <span className="font-semibold text-foreground">
                                {d.filename}
                              </span>{" "}
                              from this list. It doesn&apos;t delete the file on
                              Real-Debrid, only the generated link.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              onClick={() => handleDelete(d.id, d.filename)}
                            >
                              Remove from list
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

      {!loading && totalPages > 1 && (
        <div style={{ marginTop: "24px" }}>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) setCurrentPage((p) => p - 1);
                  }}
                  aria-disabled={currentPage === 1}
                />
              </PaginationItem>

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
                ),
              )}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) setCurrentPage((p) => p + 1);
                  }}
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
