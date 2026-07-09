import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/page-header';
import StudentAvatar from '@/components/student-avatar';
import { Search, GitCompare, X, Plus } from 'lucide-react';

interface StudentWithStats {
  id: string;
  name: string;
  leetcodeUsername: string;
  profilePhoto?: string;
  githubUsername?: string | null;
  batch?: string;
  stats: {
    totalSolved: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    ranking: number;
  };
  weeklyProgress: number;
  status: string;
  streak: number;
}

const MAX_SELECTION = 4;

// Distinct, color-blind-friendly series colors for up to 4 students.
const SERIES_COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#db2777'];

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

export default function Compare() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: students, isLoading } = useQuery<StudentWithStats[]>({
    queryKey: ['/api/students/all'],
  });

  const byId = useMemo(() => {
    const m = new Map<string, StudentWithStats>();
    (students || []).forEach((s) => m.set(s.id, s));
    return m;
  }, [students]);

  const selected = selectedIds
    .map((id) => byId.get(id))
    .filter((s): s is StudentWithStats => Boolean(s));

  const searchResults = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return [];
    return (students || [])
      .filter(
        (s) =>
          s.name.toLowerCase().includes(term) ||
          s.leetcodeUsername.toLowerCase().includes(term),
      )
      .filter((s) => !selectedIds.includes(s.id))
      .slice(0, 6);
  }, [students, searchTerm, selectedIds]);

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_SELECTION) return prev;
      return [...prev, id];
    });
    setSearchTerm('');
  };

  // Grouped-bar dataset: one row per metric, one bar per selected student.
  const chartData = useMemo(() => {
    if (selected.length === 0) return [];
    const metrics: { key: string; get: (s: StudentWithStats) => number }[] = [
      { key: 'Total', get: (s) => s.stats.totalSolved },
      { key: 'Easy', get: (s) => s.stats.easySolved },
      { key: 'Medium', get: (s) => s.stats.mediumSolved },
      { key: 'Hard', get: (s) => s.stats.hardSolved },
      { key: 'Weekly', get: (s) => s.weeklyProgress || 0 },
      { key: 'Streak', get: (s) => s.streak || 0 },
    ];
    return metrics.map((m) => {
      const row: Record<string, string | number> = { metric: m.key };
      selected.forEach((s) => {
        row[s.name] = m.get(s);
      });
      return row;
    });
  }, [selected]);

  const tableRows: { label: string; get: (s: StudentWithStats) => number }[] = [
    { label: 'Total Solved', get: (s) => s.stats.totalSolved },
    { label: 'Easy', get: (s) => s.stats.easySolved },
    { label: 'Medium', get: (s) => s.stats.mediumSolved },
    { label: 'Hard', get: (s) => s.stats.hardSolved },
    { label: 'This Week', get: (s) => s.weeklyProgress || 0 },
    { label: 'Current Streak', get: (s) => s.streak || 0 },
    { label: 'LeetCode Rank', get: (s) => s.stats.ranking || 0 },
  ];

  // Highlight the best value in each metric row.
  const bestIn = (get: (s: StudentWithStats) => number) => {
    let best = -Infinity;
    selected.forEach((s) => {
      best = Math.max(best, get(s));
    });
    return best;
  };

  return (
    <div>
      <PageHeader
        icon={<GitCompare size={20} />}
        title="Compare Students"
        description={`Select up to ${MAX_SELECTION} students to compare side by side`}
      />

      <div className="page-container py-6 space-y-6">
        {/* Selection area */}
        <Card className="shadow-soft border-border/70">
          <CardContent className="p-5 space-y-4">
            {/* Selected chips */}
            <div className="flex flex-wrap items-center gap-2">
              {selected.map((s, i) => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium"
                  style={{
                    borderColor: SERIES_COLORS[i],
                    color: SERIES_COLORS[i],
                  }}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: SERIES_COLORS[i] }}
                  />
                  {s.name}
                  <button
                    onClick={() => toggle(s.id)}
                    className="hover:opacity-70"
                    aria-label={`Remove ${s.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
              {selected.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No students selected yet.
                </p>
              )}
            </div>

            {/* Search to add */}
            {selected.length < MAX_SELECTION && (
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search a student to add…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 bg-card"
                  disabled={isLoading}
                />
                {searchResults.length > 0 && (
                  <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
                    {searchResults.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => toggle(s.id)}
                        className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted"
                      >
                        <StudentAvatar
                          name={s.name}
                          githubUsername={s.githubUsername}
                          profilePhoto={s.profilePhoto}
                          size={32}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{s.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            @{s.leetcodeUsername}
                          </p>
                        </div>
                        <Plus className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {selected.length === 0 ? (
          <div className="py-16 text-center">
            <GitCompare className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold">Nothing to compare yet</h3>
            <p className="text-muted-foreground">
              Search and add students above to see a side-by-side comparison.
            </p>
          </div>
        ) : (
          <>
            {/* Comparison chart */}
            <Card className="shadow-soft border-border/70">
              <CardHeader>
                <CardTitle>Metric Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="metric" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      {selected.map((s, i) => (
                        <Bar
                          key={s.id}
                          dataKey={s.name}
                          fill={SERIES_COLORS[i]}
                          radius={[3, 3, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Comparison table */}
            <Card className="shadow-soft border-border/70">
              <CardHeader>
                <CardTitle>Head-to-Head</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-3 pr-4 text-left font-medium text-muted-foreground">
                        Metric
                      </th>
                      {selected.map((s, i) => (
                        <th key={s.id} className="px-3 py-3 text-center">
                          <div className="flex flex-col items-center gap-1.5">
                            <StudentAvatar
                              name={s.name}
                              githubUsername={s.githubUsername}
                              profilePhoto={s.profilePhoto}
                              size={36}
                              className="ring-2"
                            />
                            <span
                              className="max-w-[110px] truncate text-xs font-semibold"
                              style={{ color: SERIES_COLORS[i] }}
                            >
                              {s.name}
                            </span>
                            {s.batch && (
                              <span className="text-[10px] text-muted-foreground">
                                Batch {s.batch}
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/60">
                      <td className="py-3 pr-4 font-medium text-muted-foreground">
                        Status
                      </td>
                      {selected.map((s) => (
                        <td key={s.id} className="px-3 py-3 text-center">
                          <Badge
                            variant="outline"
                            className={statusStyle(s.status)}
                          >
                            {s.status}
                          </Badge>
                        </td>
                      ))}
                    </tr>
                    {tableRows.map((row) => {
                      const best = bestIn(row.get);
                      const isRank = row.label === 'LeetCode Rank';
                      return (
                        <tr
                          key={row.label}
                          className="border-b border-border/60 last:border-0"
                        >
                          <td className="py-3 pr-4 font-medium text-muted-foreground">
                            {row.label}
                          </td>
                          {selected.map((s) => {
                            const value = row.get(s);
                            // "Best" = highest, except rank where nonzero lowest is better.
                            const highlight =
                              !isRank && value === best && best > 0;
                            return (
                              <td
                                key={s.id}
                                className={`px-3 py-3 text-center tabular-nums ${
                                  highlight
                                    ? 'font-bold text-foreground'
                                    : 'text-foreground/80'
                                }`}
                              >
                                {isRank && value
                                  ? `#${value.toLocaleString()}`
                                  : value.toLocaleString()}
                                {highlight && (
                                  <span className="ml-1 text-emerald-500">▲</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
