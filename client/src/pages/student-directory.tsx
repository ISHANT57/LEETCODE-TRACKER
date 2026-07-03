import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import DirectoryCharts from '@/components/directory-charts';
import { useGlobalSearch } from '@/lib/search-context';
import { apiUrl } from '@/lib/queryClient';
import { useMemo, useState } from 'react';
import {
  Search,
  Trophy,
  Medal,
  Award,
  TrendingUp,
  Users,
  Flame,
  ChevronRight,
  ChevronLeft,
  GitCompare,
  BarChart3,
  Download,
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  leetcodeUsername: string;
  leetcodeProfileLink: string;
  profilePhoto?: string;
  githubUsername?: string | null;
  batch?: string;
  createdAt: string;
}

interface StudentWithStats extends Student {
  stats: {
    totalSolved: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    ranking: number;
    acceptanceRate?: number;
  };
  weeklyProgress: number;
  status: string;
  streak: number;
}

type SortKey = 'totalSolved' | 'weeklyProgress' | 'streak' | 'name';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'totalSolved', label: 'Problems Solved' },
  { value: 'weeklyProgress', label: 'Weekly Progress' },
  { value: 'streak', label: 'Longest Streak' },
  { value: 'name', label: 'Name (A–Z)' },
];

const PAGE_SIZE = 10;

function statusStyle(status: string) {
  switch (status) {
    case 'Excellent':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Active':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Underperforming':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

function RankCell({ rank }: { rank: number }) {
  if (rank === 1)
    return <Trophy className="h-5 w-5 text-amber-500" aria-label="1st" />;
  if (rank === 2)
    return <Medal className="h-5 w-5 text-slate-400" aria-label="2nd" />;
  if (rank === 3)
    return <Award className="h-5 w-5 text-orange-500" aria-label="3rd" />;
  return <span className="text-sm font-semibold text-muted-foreground">{rank}</span>;
}

function AccuracyRing({ value }: { value: number }) {
  const r = 11;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  const off = c - (v / 100) * c;
  const color =
    v >= 80 ? 'hsl(160,84%,39%)' : v >= 60 ? 'hsl(38,92%,50%)' : 'hsl(0,72%,51%)';
  return (
    <div className="flex items-center gap-2">
      <svg width="26" height="26" viewBox="0 0 26 26">
        <circle cx="13" cy="13" r={r} fill="none" stroke="hsl(214,32%,91%)" strokeWidth="3" />
        <circle
          cx="13"
          cy="13"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          transform="rotate(-90 13 13)"
        />
      </svg>
      <span className="text-sm font-medium text-foreground">{Math.round(v)}%</span>
    </div>
  );
}

function pageNumbers(current: number, total: number): (number | '…')[] {
  const out: (number | '…')[] = [];
  const push = (n: number | '…') => out.push(n);
  const window = 1;
  for (let i = 0; i < total; i++) {
    if (i === 0 || i === total - 1 || (i >= current - window && i <= current + window)) {
      push(i);
    } else if (out[out.length - 1] !== '…') {
      push('…');
    }
  }
  return out;
}

export default function StudentDirectory() {
  const { query: globalQuery, setQuery: setGlobalQuery } = useGlobalSearch();
  const [batch, setBatch] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortKey>('totalSolved');
  const [page, setPage] = useState(0);

  const searchTerm = globalQuery;

  const { data: students, isLoading } = useQuery<StudentWithStats[]>({
    queryKey: ['/api/students/all'],
  });

  const filteredStudents = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const list = (students || []).filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(term) ||
        student.leetcodeUsername.toLowerCase().includes(term);
      const matchesBatch = batch === 'all' || student.batch === batch;
      const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
      return matchesSearch && matchesBatch && matchesStatus;
    });

    list.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'weeklyProgress':
          return (b.weeklyProgress || 0) - (a.weeklyProgress || 0);
        case 'streak':
          return (b.streak || 0) - (a.streak || 0);
        case 'totalSolved':
        default:
          return (b.stats?.totalSolved || 0) - (a.stats?.totalSolved || 0);
      }
    });
    return list;
  }, [students, searchTerm, batch, statusFilter, sortBy]);

  const pageCount = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageStudents = filteredStudents.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE,
  );
  const resetPage = () => setPage(0);

  const totalStudents = students?.length ?? 0;
  const totalSolved =
    students?.reduce((sum, s) => sum + (s.stats?.totalSolved || 0), 0) ?? 0;
  const activeThisWeek =
    students?.filter((s) => (s.weeklyProgress || 0) > 0).length ?? 0;
  const activePct = totalStudents ? Math.round((activeThisWeek / totalStudents) * 100) : 0;
  const topSolver = students
    ?.slice()
    .sort((a, b) => (b.stats?.totalSolved || 0) - (a.stats?.totalSolved || 0))[0];
  const maxSolved = Math.max(1, ...(students?.map((s) => s.stats?.totalSolved || 0) ?? [1]));

  const accuracyOf = (s: StudentWithStats) => {
    const raw = s.stats?.acceptanceRate ?? 0;
    return raw > 100 ? raw / 100 : raw;
  };

  return (
    <div>
      <PageHeader
        icon={<Users size={20} />}
        title="Student Directory"
        description="Browse, track and analyze student progress in real-time"
        actions={
          <Link href="/compare">
            <Button variant="outline" size="sm">
              <GitCompare className="h-4 w-4 mr-1.5" />
              Compare
            </Button>
          </Link>
        }
      />

      <div className="page-container py-6 space-y-6">
        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Total Students"
            value={isLoading ? '—' : totalStudents}
            hint="Registered"
            icon={<Users size={18} />}
          />
          <StatCard
            label="Problems Solved"
            value={isLoading ? '—' : totalSolved.toLocaleString()}
            hint="Total"
            icon={<Trophy size={18} />}
            accent="text-amber-600 bg-amber-50"
          />
          <StatCard
            label="Active This Week"
            value={isLoading ? '—' : activeThisWeek}
            hint={`${activePct}% of students`}
            icon={<TrendingUp size={18} />}
            accent="text-emerald-600 bg-emerald-50"
          />
          <StatCard
            label="Top Solver"
            value={isLoading ? '—' : topSolver?.stats?.totalSolved ?? 0}
            hint={topSolver?.name}
            icon={<Flame size={18} />}
            accent="text-orange-600 bg-orange-50"
          />
        </div>

        {/* Charts */}
        <DirectoryCharts students={students ?? []} isLoading={isLoading} />

        {/* Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students…"
              value={searchTerm}
              onChange={(e) => {
                setGlobalQuery(e.target.value);
                resetPage();
              }}
              className="pl-10 h-10 bg-card"
            />
          </div>

          <Select value={batch} onValueChange={(v) => { setBatch(v); resetPage(); }}>
            <SelectTrigger className="h-10 w-full sm:w-36 bg-card">
              <SelectValue placeholder="Batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              <SelectItem value="2027">Batch 2027</SelectItem>
              <SelectItem value="2028">Batch 2028</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); resetPage(); }}>
            <SelectTrigger className="h-10 w-full sm:w-36 bg-card">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Excellent">Excellent</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Underperforming">Underperforming</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => { setSortBy(v as SortKey); resetPage(); }}>
            <SelectTrigger className="h-10 w-full sm:w-48 bg-card">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  Sort by: {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="default"
            size="sm"
            className="sm:ml-auto"
            onClick={() => window.open(apiUrl('/api/export/csv'), '_blank')}
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export
          </Button>
        </div>

        {/* Table */}
        <Card className="overflow-hidden shadow-soft border-border/70">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-16 text-center">Rank</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead className="min-w-[160px]">Problems Solved</TableHead>
                  <TableHead className="text-center">Easy</TableHead>
                  <TableHead className="text-center">Medium</TableHead>
                  <TableHead className="text-center">Hard</TableHead>
                  <TableHead>Accuracy</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading &&
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={10}>
                        <div className="h-9 animate-pulse rounded bg-muted/40" />
                      </TableCell>
                    </TableRow>
                  ))}

                {!isLoading &&
                  pageStudents.map((student, i) => {
                    const rank = safePage * PAGE_SIZE + i + 1;
                    const solved = student.stats?.totalSolved || 0;
                    return (
                      <TableRow key={student.id} className="group">
                        <TableCell className="text-center">
                          <RankCell rank={rank} />
                        </TableCell>
                        <TableCell>
                          <Link href={`/student/${student.leetcodeUsername}`}>
                            <div className="flex items-center gap-3 cursor-pointer">
                              <StudentAvatar
                                name={student.name}
                                githubUsername={student.githubUsername}
                                profilePhoto={student.profilePhoto}
                                size={36}
                                className="ring-2 ring-primary/5"
                              />
                              <div className="min-w-0">
                                <p className="font-semibold text-foreground truncate group-hover:text-primary">
                                  {student.name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  @{student.leetcodeUsername}
                                </p>
                              </div>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1.5">
                            <span className="text-sm font-bold text-foreground">{solved}</span>
                            <div className="h-1.5 w-full max-w-[120px] overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                                style={{ width: `${(solved / maxSolved) * 100}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium text-emerald-600">
                          {student.stats?.easySolved ?? 0}
                        </TableCell>
                        <TableCell className="text-center font-medium text-amber-600">
                          {student.stats?.mediumSolved ?? 0}
                        </TableCell>
                        <TableCell className="text-center font-medium text-red-600">
                          {student.stats?.hardSolved ?? 0}
                        </TableCell>
                        <TableCell>
                          <AccuracyRing value={accuracyOf(student)} />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusStyle(student.status)}>
                            {student.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/student/${student.leetcodeUsername}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                              <BarChart3 className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>

          {/* Footer / pagination */}
          {!isLoading && (
            <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                Showing{' '}
                <span className="font-medium text-foreground">
                  {filteredStudents.length === 0 ? 0 : safePage * PAGE_SIZE + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium text-foreground">
                  {safePage * PAGE_SIZE + pageStudents.length}
                </span>{' '}
                of <span className="font-medium text-foreground">{filteredStudents.length}</span> students
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={safePage === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {pageNumbers(safePage, pageCount).map((n, idx) =>
                  n === '…' ? (
                    <span key={`e${idx}`} className="px-2 text-sm text-muted-foreground">…</span>
                  ) : (
                    <Button
                      key={n}
                      variant={n === safePage ? 'default' : 'outline'}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPage(n)}
                    >
                      {n + 1}
                    </Button>
                  ),
                )}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={safePage >= pageCount - 1}
                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {filteredStudents.length === 0 && !isLoading && (
            <div className="py-16 text-center">
              <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold">No students found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
