import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import StudentAvatar from '@/components/student-avatar';
import PageHeader from '@/components/page-header';
import StatCard from '@/components/stat-card';
import ScoreGauge from '@/components/score-gauge';
import DirectoryCharts from '@/components/directory-charts';
import { useGlobalSearch } from '@/lib/search-context';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, apiUrl } from '@/lib/queryClient';
import { UniversityDashboardData } from '@shared/schema';
import {
  ExternalLink,
  Flame,
  Activity,
  Trophy,
  Users,
  Building2,
  Target,
  ChevronRight,
  ChevronLeft,
  Download,
  Search,
  Sparkles,
  AlertTriangle,
  GraduationCap,
} from 'lucide-react';
import { Link } from 'wouter';

const LB_PAGE_SIZE = 20;

function statusStyle(status: string) {
  switch (status) {
    case 'Excellent':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Good':
    case 'Active':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Underperforming':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

function rankCircle(rank: number) {
  if (rank === 1) return 'bg-amber-100 text-amber-700';
  if (rank === 2) return 'bg-slate-200 text-slate-700';
  if (rank === 3) return 'bg-orange-100 text-orange-700';
  return 'bg-blue-50 text-blue-700';
}

export default function UniversityDashboard() {
  const { query: search, setQuery: setSearch } = useGlobalSearch();
  const [batchFilter, setBatchFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<UniversityDashboardData>({
    queryKey: ['/api/dashboard/university'],
  });

  const syncMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/sync/all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/university'] });
      toast({ title: 'Sync completed', description: 'All university data has been updated.' });
    },
    onError: () =>
      toast({ title: 'Sync failed', description: 'Failed to sync student data.', variant: 'destructive' }),
  });

  const initBatch2027Mutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/init-batch-2027'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/university'] });
      toast({ title: 'Batch 2027 initialized', description: 'Batch 2027 students imported.' });
    },
    onError: () =>
      toast({ title: 'Import failed', description: 'Failed to import Batch 2027.', variant: 'destructive' }),
  });

  // Merge both batches' students (they carry stats/maxStreak/status).
  const allStudents = useMemo(
    () => [...(data?.batch2027.students ?? []), ...(data?.batch2028.students ?? [])],
    [data],
  );

  // id -> extra fields the university leaderboard doesn't include.
  const metaById = useMemo(() => {
    const m = new Map<string, { maxStreak: number; status: string; batch?: string }>();
    for (const s of allStudents) m.set(s.id, { maxStreak: s.maxStreak, status: s.status, batch: s.batch });
    return m;
  }, [allStudents]);

  const health = useMemo(() => {
    if (!data) return 0;
    const { totalStudents, activeStudents, underperforming } = data.combined;
    if (!totalStudents) return 0;
    const activePct = (activeStudents / totalStudents) * 100;
    const underPct = (underperforming / totalStudents) * 100;
    return Math.round(activePct * 0.5 + (100 - underPct) * 0.5);
  }, [data]);

  const leaderboard = useMemo(() => {
    const term = search.toLowerCase();
    return (data?.combined.universityLeaderboard ?? []).filter((e) => {
      const meta = metaById.get(e.student.id);
      const matchesSearch =
        e.student.name.toLowerCase().includes(term) ||
        e.student.leetcodeUsername.toLowerCase().includes(term);
      const matchesBatch = batchFilter === 'all' || e.batch === batchFilter;
      const matchesStatus = statusFilter === 'all' || meta?.status === statusFilter;
      return matchesSearch && matchesBatch && matchesStatus;
    });
  }, [data, search, batchFilter, statusFilter, metaById]);

  const pageCount = Math.max(1, Math.ceil(leaderboard.length / LB_PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = leaderboard.slice(safePage * LB_PAGE_SIZE, safePage * LB_PAGE_SIZE + LB_PAGE_SIZE);

  const batchOverview = (b: UniversityDashboardData['batch2027']) => {
    const maxProblems = Math.max(0, ...b.students.map((s) => s.stats?.totalSolved || 0));
    const activeThisWeek = b.students.filter((s) => (s.weeklyProgress || 0) > 0).length;
    const activePct = b.totalStudents ? Math.round((b.activeStudents / b.totalStudents) * 100) : 0;
    return { maxProblems, activeThisWeek, activePct };
  };

  const compareData = useMemo(() => {
    if (!data) return [];
    const b27 = batchOverview(data.batch2027);
    const b28 = batchOverview(data.batch2028);
    return [
      { metric: 'Avg Problems', '2027': Math.round(data.batch2027.avgProblems), '2028': Math.round(data.batch2028.avgProblems) },
      { metric: 'Max Streak', '2027': data.batch2027.maxStreakOverall, '2028': data.batch2028.maxStreakOverall },
      { metric: 'Active Students', '2027': data.batch2027.activeStudents, '2028': data.batch2028.activeStudents },
      { metric: 'Active This Week', '2027': b27.activeThisWeek, '2028': b28.activeThisWeek },
    ];
  }, [data]);

  const topPerformers = useMemo(
    () =>
      [...(data?.batch2028.students ?? [])]
        .sort((a, b) => (b.stats?.totalSolved || 0) - (a.stats?.totalSolved || 0))
        .slice(0, 5),
    [data],
  );

  const atRisk = useMemo(
    () =>
      allStudents
        .filter((s) => s.status === 'Underperforming')
        .sort((a, b) => (a.stats?.totalSolved || 0) - (b.stats?.totalSolved || 0))
        .slice(0, 5),
    [allStudents],
  );

  const insight = useMemo(() => {
    if (!data) return '';
    const a = data.batch2027.avgProblems || 0;
    const b = data.batch2028.avgProblems || 0;
    if (!a || !b) return 'Sync data to compare batch performance.';
    const diff = Math.round(Math.abs((b - a) / a) * 100);
    const better = b >= a ? '2028' : '2027';
    return `Batch ${better} is performing ${diff}% better in average problems solved. Focus on ${data.combined.underperforming} underperforming students.`;
  }, [data]);

  if (error) {
    return (
      <div className="page-container py-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <h3 className="font-medium text-red-800">Error loading university dashboard</h3>
          <p className="mt-1 text-sm text-red-600">Failed to load data. Please refresh.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        icon={<Building2 size={20} />}
        title="University Dashboard"
        description="Combined overview and performance tracking for all batches"
        actions={
          <>
            <Button onClick={() => initBatch2027Mutation.mutate()} disabled={initBatch2027Mutation.isPending} variant="outline" size="sm">
              {initBatch2027Mutation.isPending ? 'Initializing…' : 'Init Batch 2027'}
            </Button>
            <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending} size="sm">
              {syncMutation.isPending ? 'Syncing…' : 'Sync All Data'}
            </Button>
          </>
        }
      />

      <div className="page-container py-6 space-y-6">
        {/* Top stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard label="Total Students" value={isLoading ? '—' : data?.combined.totalStudents ?? 0} hint={`Active: ${data?.combined.activeStudents ?? 0}`} icon={<Users size={18} />} />
          <StatCard label="Average Problems" value={isLoading ? '—' : Math.round(data?.combined.avgProblems ?? 0)} hint="University-wide" icon={<Activity size={18} />} accent="text-blue-600 bg-blue-50" />
          <StatCard label="Max Streak" value={isLoading ? '—' : data?.combined.maxStreakOverall ?? 0} hint={`Avg: ${Math.round(data?.combined.avgMaxStreak ?? 0)}`} icon={<Flame size={18} />} accent="text-orange-600 bg-orange-50" />
          <StatCard label="Underperforming" value={isLoading ? '—' : data?.combined.underperforming ?? 0} hint="Need attention" icon={<Target size={18} />} accent="text-red-600 bg-red-50" />
          <Card className="p-4 shadow-soft border-border/70 flex items-center justify-between gap-2 col-span-2 lg:col-span-1">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Health Score</p>
              <p className="mt-1 text-xs text-emerald-600 font-medium">{health >= 80 ? 'Excellent' : health >= 60 ? 'Good' : 'Needs work'}</p>
            </div>
            <ScoreGauge value={isLoading ? 0 : health} size={84} />
          </Card>
        </div>

        {/* Batch overview panels */}
        {data && (
          <div className="grid gap-4 lg:grid-cols-2">
            {[
              { b: data.batch2027, name: '2027' },
              { b: data.batch2028, name: '2028' },
            ].map(({ b, name }) => {
              const ov = batchOverview(b);
              return (
                <Card key={name} className="p-5 shadow-soft border-border/70">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <GraduationCap size={16} />
                      </div>
                      <h3 className="font-semibold text-foreground">Batch {name} Overview</h3>
                    </div>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Total Students', value: b.totalStudents },
                      { label: 'Avg Problems', value: Math.round(b.avgProblems) },
                      { label: 'Max Streak', value: b.maxStreakOverall },
                      { label: 'Active Students', value: `${b.activeStudents} (${ov.activePct}%)` },
                      { label: 'Max Problems', value: ov.maxProblems },
                      { label: 'Active This Week', value: ov.activeThisWeek },
                    ].map((s) => (
                      <div key={s.label}>
                        <p className="text-xl font-bold text-foreground">{s.value}</p>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <Link href={`/batch/${name}`}>
                    <Button variant="outline" className="mt-4 w-full justify-center">
                      View Batch {name} Dashboard <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </Card>
              );
            })}
          </div>
        )}

        {/* Charts */}
        <DirectoryCharts students={allStudents} isLoading={isLoading} />

        {/* Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search students…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-10 h-10 bg-card" />
          </div>
          <Select value={batchFilter} onValueChange={(v) => { setBatchFilter(v); setPage(0); }}>
            <SelectTrigger className="h-10 w-full sm:w-36 bg-card"><SelectValue placeholder="Batch" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              <SelectItem value="2027">Batch 2027</SelectItem>
              <SelectItem value="2028">Batch 2028</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
            <SelectTrigger className="h-10 w-full sm:w-36 bg-card"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Excellent">Excellent</SelectItem>
              <SelectItem value="Good">Good</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Underperforming">Underperforming</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" className="sm:ml-auto" onClick={() => window.open(apiUrl('/api/export/csv'), '_blank')}>
            <Download className="h-4 w-4 mr-1.5" /> Export
          </Button>
        </div>

        {/* University leaderboard */}
        <Card className="overflow-hidden shadow-soft border-border/70">
          <div className="px-5 pt-5">
            <h3 className="font-semibold text-foreground">University-wide Leaderboard</h3>
          </div>
          <div className="mt-3 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-16 text-center">Rank</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>LeetCode Profile</TableHead>
                  <TableHead>Problems Solved</TableHead>
                  <TableHead>Max Streak</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading &&
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={7}><div className="h-9 animate-pulse rounded bg-muted/40" /></TableCell></TableRow>
                  ))}
                {!isLoading && pageRows.map((entry) => {
                  const meta = metaById.get(entry.student.id);
                  return (
                    <TableRow key={entry.student.id} className="group">
                      <TableCell className="text-center">
                        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${rankCircle(entry.rank)}`}>
                          {entry.rank}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Link href={`/student/${entry.student.leetcodeUsername}`}>
                          <div className="flex items-center gap-3 cursor-pointer">
                            <StudentAvatar name={entry.student.name} githubUsername={entry.student.githubUsername} profilePhoto={entry.student.profilePhoto} size={34} className="ring-2 ring-primary/5" />
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground truncate group-hover:text-primary">{entry.student.name}</p>
                              <p className="text-xs text-muted-foreground truncate">@{entry.student.leetcodeUsername}</p>
                            </div>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={entry.batch === '2028' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-600 border-slate-200'}>
                          Batch {entry.batch}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <a href={entry.student.leetcodeProfileLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
                          @{entry.student.leetcodeUsername}
                          <ExternalLink size={12} />
                        </a>
                      </TableCell>
                      <TableCell className="font-bold text-foreground">{entry.totalSolved}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 font-medium">
                          {meta?.maxStreak ?? 0}
                          {(meta?.maxStreak ?? 0) > 0 && <Flame className="h-3.5 w-3.5 text-orange-500" />}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusStyle(meta?.status ?? '')}>{meta?.status ?? '—'}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {!isLoading && (
            <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{leaderboard.length === 0 ? 0 : safePage * LB_PAGE_SIZE + 1}</span> to{' '}
                <span className="font-medium text-foreground">{safePage * LB_PAGE_SIZE + pageRows.length}</span> of{' '}
                <span className="font-medium text-foreground">{leaderboard.length}</span> students
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={safePage === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-2 text-sm text-muted-foreground">Page {safePage + 1} / {pageCount}</span>
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={safePage >= pageCount - 1} onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Bottom: comparison + top performers + at-risk */}
        {data && (
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Batch comparison */}
            <Card className="p-5 shadow-soft border-border/70">
              <h3 className="mb-4 font-semibold text-foreground">Batch 2027 vs Batch 2028</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={compareData} layout="vertical" margin={{ left: 20, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(215,16%,47%)' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="metric" width={96} tick={{ fontSize: 11, fill: 'hsl(215,16%,47%)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid hsl(214,32%,91%)', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="2027" fill="hsl(221,83%,53%)" radius={[0, 4, 4, 0]} barSize={10} />
                  <Bar dataKey="2028" fill="hsl(160,84%,39%)" radius={[0, 4, 4, 0]} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Top performers */}
            <Card className="p-5 shadow-soft border-border/70">
              <h3 className="mb-4 font-semibold text-foreground">Batch 2028 Top Performers</h3>
              <div className="space-y-3">
                {topPerformers.map((s, i) => (
                  <Link key={s.id} href={`/student/${s.leetcodeUsername}`}>
                    <div className="flex items-center gap-3 cursor-pointer rounded-lg p-1.5 hover:bg-muted/50">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${rankCircle(i + 1)}`}>{i + 1}</span>
                      <StudentAvatar name={s.name} githubUsername={s.githubUsername} profilePhoto={s.profilePhoto} size={32} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                        <p className="text-xs text-muted-foreground truncate">@{s.leetcodeUsername}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">{s.stats?.totalSolved ?? 0}</p>
                        <p className="text-[10px] text-muted-foreground">solved</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <Link href="/batch/2028">
                <Button variant="outline" className="mt-4 w-full justify-center">View Full Batch 2028 Leaderboard <ChevronRight className="ml-1 h-4 w-4" /></Button>
              </Link>
            </Card>

            {/* At-risk */}
            <Card className="p-5 shadow-soft border-border/70">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 font-semibold text-foreground">
                  <AlertTriangle className="h-4 w-4 text-red-500" /> At-Risk Students
                </h3>
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">{data.combined.underperforming} total</Badge>
              </div>
              <div className="space-y-3">
                {atRisk.length === 0 && <p className="text-sm text-muted-foreground">No at-risk students 🎉</p>}
                {atRisk.map((s) => (
                  <Link key={s.id} href={`/student/${s.leetcodeUsername}`}>
                    <div className="flex items-center gap-3 cursor-pointer rounded-lg p-1.5 hover:bg-muted/50">
                      <StudentAvatar name={s.name} githubUsername={s.githubUsername} profilePhoto={s.profilePhoto} size={32} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                        <p className="text-xs text-muted-foreground truncate">@{s.leetcodeUsername}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-red-600">{s.stats?.totalSolved ?? 0}</p>
                        <p className="text-[10px] text-muted-foreground">solved</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <Link href="/batch/2028">
                <Button variant="outline" className="mt-4 w-full justify-center">View All Students <ChevronRight className="ml-1 h-4 w-4" /></Button>
              </Link>
            </Card>
          </div>
        )}

        {/* AI insights */}
        {data && (
          <Card className="border-border/70 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 shadow-soft">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Insights</h3>
                <p className="mt-1 text-sm text-muted-foreground">{insight}</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
