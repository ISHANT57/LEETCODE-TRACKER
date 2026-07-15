import { useMemo, useState } from 'react';
import { useParams, Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { StatSparkCard, GaugeCard } from '@/components/dashboard/batch-visuals';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { BatchDashboardData } from '@shared/schema';
import {
  Search,
  ExternalLink,
  Flame,
  Trophy,
  Users,
  BookOpen,
  RefreshCw,
  Download,
  TrendingUp,
  Target,
  Zap,
  HeartPulse,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const PAGE_SIZE = 10;

// Chart accent colors (work on light + dark).
const C = {
  blue: 'hsl(221, 83%, 53%)',
  emerald: 'hsl(160, 84%, 39%)',
  amber: 'hsl(38, 92%, 50%)',
  red: 'hsl(0, 72%, 51%)',
  violet: 'hsl(280, 65%, 60%)',
};

// Downsample a numeric series to at most n points for compact sparklines.
function sampleSeries(values: number[], n = 24): number[] {
  if (values.length <= n) return values;
  const step = values.length / n;
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(values[Math.floor(i * step)]);
  return out;
}

function statusStyle(status: string) {
  switch (status) {
    case 'Excellent':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    case 'Good':
      return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
    case 'Active':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    case 'Underperforming':
      return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
    default:
      return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
  }
}

function gaugeBadge(value: number): { text: string; className: string } {
  if (value >= 75)
    return { text: 'Great', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' };
  if (value >= 50)
    return { text: 'Good', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' };
  if (value >= 30)
    return { text: 'Fair', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' };
  return { text: 'Needs work', className: 'bg-red-500/10 text-red-600 dark:text-red-400' };
}

export default function BatchDashboard() {
  const { batch } = useParams<{ batch: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<BatchDashboardData>({
    queryKey: ['/api/dashboard/batch', batch],
    enabled: !!batch && ['2027', '2028'].includes(batch),
  });

  const syncMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/sync/all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/batch', batch] });
      toast({
        title: 'Sync completed',
        description: `All Batch ${batch} student data has been updated.`,
      });
    },
    onError: () => {
      toast({
        title: 'Sync failed',
        description: 'Failed to sync student data. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const initBatch2027Mutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/init-batch-2027'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/batch', batch] });
      toast({
        title: 'Batch 2027 initialized',
        description: 'Batch 2027 students have been imported successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Import failed',
        description: 'Failed to import Batch 2027 students.',
        variant: 'destructive',
      });
    },
  });

  // ---- Derived data (hooks must run before any early return) ----
  const students = data?.students ?? [];

  const sparks = useMemo(() => {
    const solved = [...students].map((s) => s.stats.totalSolved).sort((a, b) => a - b);
    const streaks = [...students].map((s) => s.maxStreak).sort((a, b) => a - b);
    const weekly = [...students].map((s) => s.weeklyProgress).sort((a, b) => a - b);
    return {
      solved: sampleSeries(solved),
      streaks: sampleSeries(streaks),
      weekly: sampleSeries(weekly),
    };
  }, [students]);

  const metrics = useMemo(() => {
    const total = data?.totalStudents || 0;
    const overall = Math.min(100, Math.round(((data?.avgProblems || 0) / 200) * 100));
    const consistency = Math.min(100, Math.round(((data?.avgMaxStreak || 0) / 30) * 100));
    const engagement = total ? Math.round(((data?.activeStudents || 0) / total) * 100) : 0;
    const atRiskPct = total ? Math.round(((data?.underperforming || 0) / total) * 100) : 0;
    return { overall, consistency, engagement, atRiskPct };
  }, [data]);

  const filteredStudents = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(term) ||
        s.leetcodeUsername.toLowerCase().includes(term);
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [students, searchTerm, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageStudents = filteredStudents.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE,
  );

  const exportCsv = () => {
    const header = [
      'Name', 'Username', 'Total Solved', 'Easy', 'Medium', 'Hard',
      'Ranking', 'This Week', 'Current Streak', 'Max Streak', 'Active Days', 'Status',
    ];
    const rows = filteredStudents.map((s) => [
      s.name, s.leetcodeUsername, s.stats.totalSolved, s.stats.easySolved,
      s.stats.mediumSolved, s.stats.hardSolved, s.stats.ranking, s.weeklyProgress,
      s.streak, s.maxStreak, s.totalActiveDays, s.status,
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch-${batch}-students.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---- Guard / state screens ----
  if (!batch || !['2027', '2028'].includes(batch)) {
    return (
      <div className="page-container py-6">
        <Card className="border-destructive/30 bg-destructive/5 p-6">
          <h3 className="font-semibold text-destructive">Invalid Batch</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Please select a valid batch (2027 or 2028).
          </p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container py-6">
        <Card className="border-destructive/30 bg-destructive/5 p-6">
          <h3 className="font-semibold text-destructive">Error loading batch dashboard</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Failed to load Batch {batch} data. Please try refreshing or initialize students first.
          </p>
          {batch === '2027' && (
            <Button
              onClick={() => initBatch2027Mutation.mutate()}
              className="mt-3"
              variant="outline"
              disabled={initBatch2027Mutation.isPending}
            >
              {initBatch2027Mutation.isPending ? 'Initializing…' : 'Initialize Batch 2027'}
            </Button>
          )}
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="page-container py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-1/3 rounded bg-muted" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-muted" />
            ))}
          </div>
          <div className="h-96 rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  if (!data || data.totalStudents === 0) {
    return (
      <div className="page-container py-6">
        <Card className="border-amber-500/30 bg-amber-500/5 p-6">
          <h3 className="font-semibold text-amber-600 dark:text-amber-400">
            No students found in Batch {batch}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {batch === '2027'
              ? 'Please initialize the Batch 2027 student database first.'
              : 'No students found in this batch.'}
          </p>
          {batch === '2027' && (
            <Button
              onClick={() => initBatch2027Mutation.mutate()}
              className="mt-3"
              variant="outline"
              disabled={initBatch2027Mutation.isPending}
            >
              {initBatch2027Mutation.isPending ? 'Initializing…' : 'Initialize Batch 2027'}
            </Button>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        icon={<BookOpen size={20} />}
        title={`Batch ${batch} Dashboard`}
        description={`Overview and performance tracking for Batch ${batch} students`}
        actions={
          <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending} size="sm">
            <RefreshCw className={`mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} size={16} />
            {syncMutation.isPending ? 'Syncing…' : 'Sync All Data'}
          </Button>
        }
      />

      <div className="page-container py-6 space-y-6">
        {/* Hero stat cards with sparklines */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatSparkCard
            label="Total Students"
            value={data.totalStudents}
            hint={`${data.activeStudents} active`}
            icon={<Users size={20} />}
            accent="text-blue-600 dark:text-blue-400 bg-blue-500/10"
            sparkColor={C.blue}
            sparkId="students"
            sparkData={sparks.solved}
          />
          <StatSparkCard
            label="Average Problems"
            value={Math.round(data.avgProblems)}
            hint="Per student"
            icon={<TrendingUp size={20} />}
            accent="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
            sparkColor={C.emerald}
            sparkId="avg"
            sparkData={sparks.solved}
          />
          <StatSparkCard
            label="Max Streak"
            value={data.maxStreakOverall}
            hint={`Avg: ${Math.round(data.avgMaxStreak)}`}
            icon={<Flame size={20} />}
            accent="text-amber-600 dark:text-amber-400 bg-amber-500/10"
            sparkColor={C.amber}
            sparkId="streak"
            sparkData={sparks.streaks}
          />
          <StatSparkCard
            label="Underperforming"
            value={data.underperforming}
            hint="Need attention"
            icon={<AlertTriangle size={20} />}
            accent="text-red-600 dark:text-red-400 bg-red-500/10"
            sparkColor={C.red}
            sparkId="under"
            sparkData={sparks.weekly}
          />
        </div>

        {/* Performance overview gauges */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Batch {batch} Performance Overview
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <GaugeCard
              title="Overall Progress"
              icon={<Target size={16} className="text-blue-500" />}
              value={metrics.overall}
              display={`${metrics.overall}%`}
              color={C.blue}
              subtitle="Avg solved vs 200-problem goal"
              badge={gaugeBadge(metrics.overall)}
            />
            <GaugeCard
              title="Consistency"
              icon={<Zap size={16} className="text-violet-500" />}
              value={metrics.consistency}
              display={`${metrics.consistency}%`}
              color={C.violet}
              subtitle={`Avg max streak ${Math.round(data.avgMaxStreak)} days`}
              badge={gaugeBadge(metrics.consistency)}
            />
            <GaugeCard
              title="Engagement"
              icon={<HeartPulse size={16} className="text-emerald-500" />}
              value={metrics.engagement}
              display={`${metrics.engagement}%`}
              color={C.emerald}
              subtitle={`${data.activeStudents} of ${data.totalStudents} active`}
              badge={gaugeBadge(metrics.engagement)}
            />
            <GaugeCard
              title="At-Risk Students"
              icon={<AlertTriangle size={16} className="text-red-500" />}
              value={metrics.atRiskPct}
              display={data.underperforming}
              color={C.red}
              subtitle={`${metrics.atRiskPct}% of the batch`}
            />
          </div>
        </div>

        {/* Students table */}
        <Card className="shadow-soft border-border/70">
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2">
                Batch {batch} Students
                <Badge variant="secondary" className="font-normal">
                  {filteredStudents.length}
                </Badge>
              </CardTitle>
              <Button variant="outline" size="sm" onClick={exportCsv}>
                <Download className="mr-1.5 h-4 w-4" />
                Export
              </Button>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`Search Batch ${batch} students…`}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(0);
                  }}
                  className="pl-10"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setPage(0);
                }}
              >
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="Excellent">Excellent</SelectItem>
                  <SelectItem value="Good">Good</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Underperforming">Underperforming</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Student</TableHead>
                    <TableHead>Profile</TableHead>
                    <TableHead className="text-right">Solved</TableHead>
                    <TableHead>Easy / Med / Hard</TableHead>
                    <TableHead>Ranking</TableHead>
                    <TableHead className="text-center">This Week</TableHead>
                    <TableHead className="text-center">Streak</TableHead>
                    <TableHead className="text-center">Max</TableHead>
                    <TableHead className="text-center">Active</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Weakest Area</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageStudents.map((student) => (
                    <TableRow key={student.id} className="animate-fade-in">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <StudentAvatar
                            name={student.name}
                            githubUsername={student.githubUsername}
                            profilePhoto={student.profilePhoto}
                            size={36}
                            fallbackClassName="text-xs"
                          />
                          <div className="min-w-0">
                            <Link href={`/student/${student.leetcodeUsername}`}>
                              <span className="cursor-pointer font-medium text-foreground hover:text-primary">
                                {student.name}
                              </span>
                            </Link>
                            <div className="text-xs text-muted-foreground">Batch {batch}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <a
                          href={student.leetcodeProfileLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                        >
                          @{student.leetcodeUsername}
                          <ExternalLink size={12} />
                        </a>
                      </TableCell>
                      <TableCell className="text-right text-lg font-bold text-foreground tabular-nums">
                        {student.stats.totalSolved}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            {student.stats.easySolved}
                          </span>
                          <span className="rounded-md bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                            {student.stats.mediumSolved}
                          </span>
                          <span className="rounded-md bg-red-500/10 px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400">
                            {student.stats.hardSolved}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground tabular-nums">
                          {student.stats.ranking > 0
                            ? `#${student.stats.ranking.toLocaleString()}`
                            : '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                            student.weeklyProgress >= 25
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : student.weeklyProgress >= 10
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                : 'bg-slate-500/10 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          +{student.weeklyProgress}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center gap-1">
                          <Flame
                            size={14}
                            className={student.streak > 0 ? 'text-orange-500' : 'text-muted-foreground/40'}
                          />
                          <span className="tabular-nums text-foreground">{student.streak}</span>
                        </span>
                      </TableCell>
                      <TableCell className="text-center tabular-nums text-muted-foreground">
                        {student.maxStreak}
                      </TableCell>
                      <TableCell className="text-center tabular-nums text-muted-foreground">
                        {student.totalActiveDays}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusStyle(student.status)}>
                          {student.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {student.weakestCategory ? (
                          <Badge variant="secondary" className="whitespace-nowrap">
                            {student.weakestCategory.categoryLabel}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">No data</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {pageStudents.length === 0 ? 0 : safePage * PAGE_SIZE + 1}–
                {safePage * PAGE_SIZE + pageStudents.length} of {filteredStudents.length}
              </p>
              {pageCount > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safePage === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {safePage + 1} / {pageCount}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safePage >= pageCount - 1}
                    onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top performers */}
        <Card className="shadow-soft border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Batch {batch} Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {data.leaderboard.slice(0, 10).map((entry) => {
                const rankStyle =
                  entry.rank === 1
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-amber-500/30'
                    : entry.rank === 2
                      ? 'bg-slate-400/15 text-slate-600 dark:text-slate-300 ring-slate-400/30'
                      : entry.rank === 3
                        ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 ring-orange-500/30'
                        : 'bg-primary/10 text-primary ring-primary/20';
                return (
                  <div
                    key={entry.student.id}
                    className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/30 p-3 transition-colors hover:bg-muted/60"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ring-1 ${rankStyle}`}
                      >
                        {entry.rank}
                      </div>
                      <StudentAvatar
                        name={entry.student.name}
                        githubUsername={entry.student.githubUsername}
                        profilePhoto={entry.student.profilePhoto}
                        size={36}
                      />
                      <div className="min-w-0">
                        <Link href={`/student/${entry.student.leetcodeUsername}`}>
                          <span className="cursor-pointer truncate font-medium text-foreground hover:text-primary">
                            {entry.student.name}
                          </span>
                        </Link>
                        <div className="truncate text-xs text-muted-foreground">
                          @{entry.student.leetcodeUsername}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-foreground tabular-nums">
                        {entry.weeklyScore}
                      </div>
                      <div className="text-xs text-muted-foreground">solved</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
