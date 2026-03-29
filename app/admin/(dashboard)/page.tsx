"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Activity, CloudRain, HardDrive, Cpu, CheckCircle2,
  PlayCircle, Library, Zap, RefreshCw, AlertCircle,
  Clock, Crown, XCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  rdUser: {
    username: string;
    type: string;
    expiration: string;
    points: number;
  } | null;
  queue: {
    active: number;
    waiting: number;
    completed: number;
    failed: number;
  };
  library: {
    total: number;
  };
  feed: Array<{
    id: string | number | undefined;
    name: string;
    status: string;
    progress: number;
    quality: string | null;
  }>;
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'active')
    return <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-transparent">Downloading</Badge>;
  if (status === 'completed')
    return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-transparent">Completed</Badge>;
  if (status === 'failed')
    return <Badge className="bg-red-500 hover:bg-red-600 text-white border-transparent">Failed</Badge>;
  if (status === 'waiting')
    return <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-transparent">Queued</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'active')
    return <PlayCircle className="w-4 h-4 text-blue-500 animate-pulse shrink-0" />;
  if (status === 'completed')
    return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
  if (status === 'failed')
    return <XCircle className="w-4 h-4 text-red-500 shrink-0" />;
  if (status === 'waiting')
    return <Clock className="w-4 h-4 text-amber-500 shrink-0" />;
  return <Activity className="w-4 h-4 text-muted-foreground shrink-0" />;
}

export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch('/api/backend/dashboard/stats');
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const json = await res.json();
      if (json.success) setStats(json.data);
      else throw new Error(json.error || 'Unknown error');
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const daysLeft = stats?.rdUser?.expiration
    ? Math.ceil((new Date(stats.rdUser.expiration).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-10 space-y-10">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm">Queue activity, library count, and Real-Debrid connection status.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchStats(true)}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center space-x-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Couldn&apos;t load dashboard stats ({error}). Check that the backend is running, then try Refresh.</span>
        </div>
      )}

      {/* Layer 1: Vitals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Active Queue */}
        <Card className="border-border/60 shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Download queue</CardTitle>
            <CloudRain className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-24 mb-1" /> : (
              <div className="text-2xl font-bold">{stats?.queue.active ?? 0} Active</div>
            )}
            <span className="text-xs text-muted-foreground mt-1 block">
              {loading ? <Skeleton className="h-3 w-32" /> : (
                <span className="flex items-center gap-1">
                  <span className="text-amber-500">{stats?.queue.waiting ?? 0} waiting</span>
                  <span className="text-muted-foreground/50 mx-1">·</span>
                  <span className="text-red-400">{stats?.queue.failed ?? 0} failed</span>
                </span>
              )}
            </span>
          </CardContent>
        </Card>

        {/* Library */}
        <Card className="border-border/60 shadow-sm border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Library</CardTitle>
            <HardDrive className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-24 mb-1" /> : (
              <div className="text-2xl font-bold">{stats?.library.total ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Library className="w-3 h-3" />
              Torrents in Real-Debrid
            </p>
          </CardContent>
        </Card>

        {/* RD Health */}
        <Card className="border-border/60 shadow-sm border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Real-Debrid</CardTitle>
            <Zap className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-24 mb-1" /> : (
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{stats?.rdUser ? 'Online' : 'Offline'}</div>
                {stats?.rdUser?.type === 'premium' && (
                  <Crown className="w-4 h-4 text-amber-500" />
                )}
              </div>
            )}
            <span className="text-xs text-muted-foreground mt-1 block">
              {loading ? <Skeleton className="h-3 w-32" /> : (
                stats?.rdUser
                  ? `${stats.rdUser.points.toLocaleString()} pts · ${daysLeft}d remaining`
                  : 'API key not configured'
              )}
            </span>
          </CardContent>
        </Card>

        {/* Completed */}
        <Card className="border-border/60 shadow-sm border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed jobs</CardTitle>
            <Cpu className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-24 mb-1" /> : (
              <div className="text-2xl font-bold">{stats?.queue.completed ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Total finished jobs recorded
            </p>
          </CardContent>
        </Card>

      </div>

      {/* Layer 2: Live Transmission Feed */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold tracking-tight">Active downloads</h3>
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-none gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Live
          </Badge>
        </div>

        <Card className="border-border/60 shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[50%]">Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Quality</TableHead>
                <TableHead className="text-right">Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-72" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-10 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : !stats?.feed.length ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
                    <div className="flex flex-col items-center gap-2">
                      <CloudRain className="w-8 h-8 text-muted-foreground/40" />
                      <span className="text-sm">Nothing in the queue. Start an ingest from Search to see jobs here.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                stats.feed.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <StatusIcon status={job.status} />
                        <span className="font-medium text-sm truncate max-w-[380px]" title={job.name}>
                          {job.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell><StatusBadge status={job.status} /></TableCell>
                    <TableCell>
                      {job.quality
                        ? <Badge variant="outline">{job.quality}</Badge>
                        : <span className="text-muted-foreground text-xs">—</span>
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-semibold text-sm ${
                        job.status === 'completed' ? 'text-emerald-500'
                        : job.status === 'failed'  ? 'text-red-500'
                        : 'text-muted-foreground'
                      }`}>
                        {job.progress}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

    </div>
  );
}
