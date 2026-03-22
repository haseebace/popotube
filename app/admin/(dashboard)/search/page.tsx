"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
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
import { Download, Link as LinkIcon, Play } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
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

interface TorrentResult {
  title: string;
  tracker: string;
  trackerId: string;
  category: string;
  size: number;
  seeders: number;
  leechers: number;
  publishDate: string;
  magnetUri: string | null;
  downloadLink: string | null;
  detailsLink: string | null;
  imdb: string | null;
  infoHash: string | null;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "Unknown";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "Unknown";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Unknown";
  }
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
      <TableCell>
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-20 rounded-md" />
          <Skeleton className="h-3 w-16 rounded-md" />
        </div>
      </TableCell>
      <TableCell className="pr-4">
          <div className="flex flex-col gap-2 items-end">
             <Skeleton className="h-8 w-24 rounded-md" />
             <Skeleton className="h-8 w-24 rounded-md" />
          </div>
      </TableCell>
    </TableRow>
  );
}

function ResultRow({ result, selectedTmdbId }: { result: TorrentResult, selectedTmdbId: number | null }) {
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);

  const seederVariant =
    result.seeders >= 20 ? "seeder-green" :
    result.seeders >= 5  ? "seeder-yellow" :
                           "seeder-red";

  async function handleIngest() {
    if (!result.magnetUri) {
      toast.error("No magnet link available for this torrent.");
      return;
    }

    const metadata = parseTorrentMetadata(result.title);

    setIsDownloading(true);
    try {
      const res = await fetch('/api/backend/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          magnet: result.magnetUri,
          size: result.size || 0,
          title: result.title,
          tmdb_id: selectedTmdbId || undefined,
          quality: metadata.quality,
          codec: metadata.codec,
          source: metadata.source
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to start download');
      }

      router.push('/admin/activedownloads');
    } catch (err: any) {
      console.error(err);
      toast.error(`Error starting download: ${err.message}`);
    } finally {
      setIsDownloading(false);
    }
  }

  const metadata = parseTorrentMetadata(result.title);

  return (
    <TableRow>
      <TableCell className="max-w-[300px] xl:max-w-[450px] pl-4">
        <div className="flex flex-col gap-1.5">
          <a
            href={result.detailsLink ?? result.magnetUri ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium hover:underline text-sm leading-snug line-clamp-2"
            title={result.title}
          >
            {result.title}
          </a>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
             {metadata.quality !== 'unknown' && <Badge variant="outline" className="text-[10px] uppercase py-0 px-1.5 font-normal">{metadata.quality}</Badge>}
             {metadata.codec !== 'unknown' && <Badge variant="outline" className="text-[10px] uppercase py-0 px-1.5 font-normal text-muted-foreground">{metadata.codec}</Badge>}
             {metadata.source !== 'unknown' && <Badge variant="outline" className="text-[10px] uppercase py-0 px-1.5 font-normal text-muted-foreground">{metadata.source}</Badge>}
             {result.category && <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-normal">{result.category}</Badge>}
          </div>
        </div>
      </TableCell>

      <TableCell className="w-[120px]">
        <div className="flex flex-col gap-1.5">
           <Badge variant={seederVariant as any} className="w-max text-xs font-semibold tracking-tight">▲ {result.seeders} S</Badge>
           <Badge variant="leecher" asChild={false} className="w-max text-xs font-semibold tracking-tight">▼ {result.leechers} L</Badge>
        </div>
      </TableCell>

      <TableCell className="w-[100px] whitespace-nowrap tabular-nums text-sm text-muted-foreground font-medium">
        {formatBytes(result.size)}
      </TableCell>

      <TableCell className="w-[140px]">
         <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">{result.tracker}</span>
            <span className="text-[11px] text-muted-foreground/80 font-medium">{formatDate(result.publishDate)}</span>
         </div>
      </TableCell>

      <TableCell className="w-[140px] pr-4 text-right">
         <div className="flex flex-col justify-end gap-1.5">
            <Button 
               size="sm" 
               className="h-7 text-xs font-semibold w-full"
               onClick={handleIngest} 
               disabled={!result.magnetUri || isDownloading}
            >
               {isDownloading ? "Starting..." : "Start Ingest"}
            </Button>
            
            {result.magnetUri && (
              <Button 
                 variant="secondary" 
                 size="sm" 
                 className="h-7 text-xs font-semibold w-full bg-secondary/70 hover:bg-secondary flex items-center gap-1.5"
                 onClick={() => navigator.clipboard.writeText(result.magnetUri!)}
              >
                 <LinkIcon className="h-3 w-3" />
                 Copy Magnet
              </Button>
            )}

            {result.downloadLink && (
              <Button 
                 variant="outline" 
                 size="sm" 
                 className="h-7 text-xs font-medium w-full flex items-center gap-1.5 border-dashed"
                 onClick={() => window.open(result.downloadLink!, '_blank')}
              >
                 <Download className="h-3 w-3" />
                 .torrent File
              </Button>
            )}
         </div>
      </TableCell>
    </TableRow>
  );
}

const RESULTS_PER_PAGE = 25;

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [selectedTmdbId, setSelectedTmdbId] = useState<number | null>(null);
  const [results, setResults] = useState<TorrentResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("seeders");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const cached = sessionStorage.getItem("popotube_search_cache");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setQuery(parsed.query || "");
        setResults(parsed.results || []);
        setSearched(parsed.searched || false);
        setTotalResults(parsed.totalResults || 0);
        setCurrentPage(parsed.currentPage || 1);
        setSortBy(parsed.sortBy || "seeders");
        setSelectedTmdbId(parsed.selectedTmdbId || null);
      } catch (err) {
        console.error("Failed to load cached search", err);
      }
    }
  }, []);

  // Save state whenever it changes
  useEffect(() => {
    if (searched) {
      sessionStorage.setItem("popotube_search_cache", JSON.stringify({
        query,
        results,
        searched,
        totalResults,
        currentPage,
        sortBy,
        selectedTmdbId
      }));
    }
  }, [query, results, searched, totalResults, currentPage, sortBy, selectedTmdbId]);

  async function handleSearch(manualQuery?: string) {
    const activeQuery = (manualQuery || query).trim();
    if (!activeQuery) return;

    if (manualQuery && manualQuery !== query) {
      setQuery(manualQuery);
    }

    setLoading(true);
    setError(null);
    setResults([]);
    setSearched(true);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(activeQuery)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "An unexpected error occurred.");
        return;
      }

      setResults(data.results || []);
      setTotalResults(data.totalResults || 0);
      setCurrentPage(1);
    } catch (err: any) {
      console.error(err);
      setError("Could not reach the search server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSearch();
  }

  const sortedResults = [...results].sort((a, b) => {
    switch (sortBy) {
      case "seeders":    return b.seeders - a.seeders;
      case "size":       return b.size - a.size;
      case "date":       return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
      case "title":      return a.title.localeCompare(b.title);
      default:           return 0;
    }
  });

  const totalPages = Math.ceil(sortedResults.length / RESULTS_PER_PAGE);
  const pageResults = sortedResults.slice(
    (currentPage - 1) * RESULTS_PER_PAGE,
    currentPage * RESULTS_PER_PAGE
  );

  // Build page number list: always show first, last, current ±1, with ellipsis
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

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 py-10">

      <div className="mb-8 space-y-4">
        <div>
          <h2 className="text-xl font-bold mb-2">1. Link Movie to TMDb</h2>
          <TMDBSearchAutocomplete onSelect={(m) => {
             setSelectedTmdbId(m.id);
             const searchTitle = `${m.title} ${m.release_date?.substring(0,4) || ''}`.trim();
             handleSearch(searchTitle);
          }} />
        </div>

        <div>
          <h2 className="text-xl font-bold mb-2">2. Search Torrents</h2>
          {/* Search bar + button */}
          <div style={{ display: "flex", gap: "8px" }}>
            <Input
              ref={inputRef}
              type="search"
              placeholder="Search Jackett for magnet..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? "Searching…" : "Search"}
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div style={{ marginTop: "24px" }}>

        {/* Error */}
        {error && (
          <div style={{ marginBottom: "16px", color: "red", fontSize: "14px" }}>
            ⚠️ {error}
          </div>
        )}

        {/* Results count + Sort */}
        {!loading && searched && !error && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <p style={{ fontSize: "13px", margin: 0 }}>
              {totalResults > 0
                ? `${totalResults.toLocaleString()} results for "${query}" — page ${currentPage} of ${totalPages}`
                : `No results found for "${query}"`}
            </p>
            {totalResults > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Label>Sort by:</Label>
                <Select
                  value={sortBy}
                  onValueChange={(val) => { setSortBy(val); setCurrentPage(1); }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seeders">Seeders</SelectItem>
                    <SelectItem value="size">Size</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="title">Title (A–Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {/* Render Table Structure wrapper for both loading and loaded data */}
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="pl-4">Title</TableHead>
                <TableHead className="w-[120px]">Seeds Leeches</TableHead>
                <TableHead className="w-[100px]">Size</TableHead>
                <TableHead className="w-[140px]">Tracker</TableHead>
                <TableHead className="w-[140px] pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Loading skeletons */}
              {loading && (
                <>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))}
                </>
              )}

              {/* Result cards */}
              {!loading && pageResults.length > 0 && (
                <>
                  {pageResults.map((result, i) => (
                    <ResultRow key={`${result.infoHash ?? result.title}-${i}`} result={result} selectedTmdbId={selectedTmdbId} />
                  ))}
                </>
              )}

              {/* Empty state directly in table using colSpan */}
              {!loading && searched && pageResults.length === 0 && !error && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No results found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div style={{ marginTop: "24px" }}>
            <Pagination>
              <PaginationContent>

                {/* Previous */}
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => { e.preventDefault(); if (currentPage > 1) setCurrentPage(p => p - 1); }}
                    aria-disabled={currentPage === 1}
                  />
                </PaginationItem>

                {/* Page numbers */}
                {getPageNumbers().map((page, idx) =>
                  page === "ellipsis" ? (
                    <PaginationItem key={`ellipsis-${idx}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        isActive={page === currentPage}
                        onClick={(e) => { e.preventDefault(); setCurrentPage(page); }}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}

                {/* Next */}
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
    </div>
  );
}
