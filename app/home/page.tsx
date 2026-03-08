"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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

function SkeletonCard() {
  return (
    <div className="result-card" style={{ pointerEvents: "none" }}>
      {/* Row 1: title + action placeholders */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
          <Skeleton style={{ height: "16px", width: "85%", borderRadius: "4px" }} />
          <Skeleton style={{ height: "16px", width: "52%", borderRadius: "4px" }} />
        </div>
        <div style={{ display: "flex", gap: "10px", paddingTop: "2px" }}>
          <Skeleton style={{ height: "20px", width: "20px", borderRadius: "4px" }} />
          <Skeleton style={{ height: "20px", width: "20px", borderRadius: "4px" }} />
        </div>
      </div>
      {/* Row 2: meta pill placeholders */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Skeleton style={{ height: "20px", width: "72px", borderRadius: "9999px" }} />
        <Skeleton style={{ height: "20px", width: "60px", borderRadius: "9999px" }} />
        <Skeleton style={{ height: "20px", width: "55px", borderRadius: "9999px" }} />
        <Skeleton style={{ height: "20px", width: "70px", borderRadius: "9999px" }} />
        <Skeleton style={{ height: "20px", width: "48px", borderRadius: "9999px", marginLeft: "auto" }} />
      </div>
    </div>
  );
}

function ResultCard({ result }: { result: TorrentResult }) {
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);

  const seederVariant =
    result.seeders >= 20 ? "seeder-green" :
    result.seeders >= 5  ? "seeder-yellow" :
                           "seeder-red";

  async function handleDownloadBunny() {
    if (!result.magnetUri) {
      alert("No magnet link available for this torrent.");
      return;
    }

    setIsDownloading(true);
    try {
      const res = await fetch('/api/backend/bunny-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          magnet: result.magnetUri,
          size: result.size || 0,
          title: result.title,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to start download');
      }

      router.push('/downloads');
    } catch (err: any) {
      console.error(err);
      alert(`Error starting download: ${err.message}`);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="result-card">
      {/* Row 1: Title + action buttons */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <a
            href={result.detailsLink ?? result.magnetUri ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="result-card-title-link"
          >
            <p className="result-card-title" title={result.title}>
              {result.title}
            </p>
          </a>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", flexShrink: 0, paddingTop: "2px" }}>
          {/* Magnet + download icons */}
          <div style={{ display: "flex", gap: "10px" }}>
            {result.magnetUri && (
              <a href={result.magnetUri} title="Open magnet link" className="result-card-action">🧲</a>
            )}
            {result.downloadLink && (
              <a href={result.downloadLink} title="Download .torrent" className="result-card-action">⬇️</a>
            )}
          </div>

          {/* Stacked outline buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadBunny}
              disabled={isDownloading || !result.magnetUri}
            >
              {isDownloading ? "Starting..." : "Download Bunny"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => result.magnetUri && navigator.clipboard.writeText(result.magnetUri)}
            >
              Copy Magnet Link
            </Button>
          </div>
        </div>
      </div>

      {/* Row 2: Meta fields */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "14px" }}>

        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <Label>Tracker</Label>
          <Badge>{result.tracker}</Badge>
        </div>

        {result.category && (
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <Label>Category</Label>
            <Badge variant="secondary">{result.category}</Badge>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <Label>Size</Label>
          <span className="result-card-meta">{formatBytes(result.size)}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <Label>Date</Label>
          <span className="result-card-meta">{formatDate(result.publishDate)}</span>
        </div>

        {/* Seeders / Leechers — custom Badge variants */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "auto" }}>
          <Badge variant={seederVariant as any}>▲ {result.seeders} S</Badge>
          <Badge variant="leecher" asChild={false}>▼ {result.leechers} L</Badge>
        </div>

      </div>
    </div>
  );
}

const RESULTS_PER_PAGE = 25;

export default function HomePage() {
  const [query, setQuery] = useState("");
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
  }, []);

  async function handleSearch() {
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setResults([]);
    setSearched(true);
    setCurrentPage(1);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "An unexpected error occurred.");
        return;
      }

      setResults(data.results || []);
      setTotalResults(data.totalResults || 0);
    } catch {
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
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "60px 16px" }}>

      {/* Search bar + button */}
      <div style={{ display: "flex", gap: "8px" }}>
        <Input
          ref={inputRef}
          type="search"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? "Searching…" : "Search"}
        </Button>
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

        {/* Loading skeletons */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Result cards */}
        {!loading && pageResults.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {pageResults.map((result, i) => (
              <ResultCard key={`${result.infoHash ?? result.title}-${i}`} result={result} />
            ))}
          </div>
        )}

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
