import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Upload,
  RefreshCw,
  Users,
  Activity,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PageHeader from "@/components/page-header";
import StatCard from "@/components/stat-card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CHART_AXIS, CHART_GRID, CHART_TOOLTIP_STYLE } from "@/lib/constants";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface AnalyticsData {
  summaryStats: {
    totalStudents: number;
    improved: number;
    declined: number;
    same: number;
    averageImprovement: number;
  };
  top10Students: any[];
  top15Improvers: any[];
  progressCategories: { improved: number; declined: number; same: number };
  classAverageProgression: any[];
  allStudentsData: any[];
}

const COLORS = {
  improved: "#10B981",
  declined: "#EF4444",
  same: "#94A3B8",
  primary: "#3B82F6",
  secondary: "#8B5CF6",
};
const PIE_COLORS = [COLORS.improved, COLORS.declined, COLORS.same];

function statusBadge(status: string) {
  switch (status) {
    case "improved":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    case "declined":
      return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
    default:
      return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";
  }
}

function statusIcon(status: string) {
  switch (status) {
    case "improved":
      return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    case "declined":
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    default:
      return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
}

export default function AnalyticsDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [autoRefresh, setAutoRefresh] = useState(false);

  const { data: analyticsData, isLoading, error, refetch } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics"],
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const importMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/import/csv"),
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({ title: "Import successful", description: result.message || "CSV data imported successfully" });
    },
    onError: () => {
      toast({ title: "Import failed", description: "Failed to import CSV data. Please try again.", variant: "destructive" });
    },
  });

  const syncMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/sync/all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({ title: "Sync completed", description: "All student data has been updated with real-time LeetCode data." });
    },
    onError: () => {
      toast({ title: "Sync failed", description: "Failed to sync with LeetCode. Please try again.", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
          <p className="text-lg font-medium text-foreground">Loading analytics data…</p>
        </div>
      </div>
    );
  }

  if (error || !analyticsData) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <div className="text-center">
          <p className="mb-4 text-lg font-medium text-destructive">Failed to load analytics data</p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const total = analyticsData.summaryStats.totalStudents || 0;
  const pct = (n: number) => (total ? ((n / total) * 100).toFixed(1) : "0.0");
  const avgImp = analyticsData.summaryStats.averageImprovement;

  const trendData = analyticsData.top10Students.map((student) => {
    const weeklyData: any = { name: student.student.name };
    student.weeklyTrends.forEach((trend: any, index: number) => {
      weeklyData[`Week ${index + 1}`] = trend?.totalProblems || 0;
    });
    weeklyData["Current"] = student.currentSolved;
    return weeklyData;
  });

  const improvementData = analyticsData.top15Improvers.map((student) => ({
    name: student.student.name.split(" ").slice(0, 2).join(" "),
    improvement: student.improvement,
  }));

  const pieData = [
    { name: "Improved", value: analyticsData.progressCategories.improved, color: COLORS.improved },
    { name: "Declined", value: analyticsData.progressCategories.declined, color: COLORS.declined },
    { name: "Same", value: analyticsData.progressCategories.same, color: COLORS.same },
  ];

  return (
    <div>
      <PageHeader
        icon={<BarChart3 size={20} />}
        title="Analytics Dashboard"
        description="Historical trends and current LeetCode progress analysis"
        actions={
          <>
            <Button onClick={() => setAutoRefresh(!autoRefresh)} variant={autoRefresh ? "default" : "outline"} size="sm">
              <RefreshCw className={`mr-2 h-4 w-4 ${autoRefresh ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{autoRefresh ? "Auto-Refresh ON" : "Auto-Refresh OFF"}</span>
            </Button>
            <Button
              onClick={() => importMutation.mutate()}
              disabled={importMutation.isPending}
              variant="outline"
              size="sm"
              className="text-violet-600 dark:text-violet-400 border-violet-500/30 hover:bg-violet-500/10"
            >
              <Upload className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">{importMutation.isPending ? "Importing…" : "Import CSV"}</span>
            </Button>
            <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending} size="sm">
              <RefreshCw className={`mr-2 h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
              {syncMutation.isPending ? "Syncing…" : "Sync"}
            </Button>
          </>
        }
      />

      <div className="page-container py-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            label="Total Students"
            value={total}
            icon={<Users size={18} />}
          />
          <StatCard
            label="Improved"
            value={<span className="text-emerald-600 dark:text-emerald-400">{analyticsData.summaryStats.improved}</span>}
            hint={`${pct(analyticsData.summaryStats.improved)}%`}
            icon={<TrendingUp size={18} />}
            accent="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
          />
          <StatCard
            label="Declined"
            value={<span className="text-red-600 dark:text-red-400">{analyticsData.summaryStats.declined}</span>}
            hint={`${pct(analyticsData.summaryStats.declined)}%`}
            icon={<TrendingDown size={18} />}
            accent="text-red-600 dark:text-red-400 bg-red-500/10"
          />
          <StatCard
            label="Unchanged"
            value={<span className="text-muted-foreground">{analyticsData.summaryStats.same}</span>}
            hint={`${pct(analyticsData.summaryStats.same)}%`}
            icon={<Minus size={18} />}
            accent="text-slate-600 dark:text-slate-400 bg-slate-500/10"
          />
          <StatCard
            label="Avg Improvement"
            value={
              <span className={avgImp >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                {avgImp >= 0 ? "+" : ""}{avgImp}
              </span>
            }
            hint="problems solved"
            icon={<Activity size={18} />}
            accent="text-blue-600 dark:text-blue-400 bg-blue-500/10"
          />
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card className="shadow-soft border-border/70">
            <CardHeader>
              <CardTitle>Top 10 Students Progress Trend</CardTitle>
              <p className="text-sm text-muted-foreground">Historical progress across all weeks including current data</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" {...CHART_GRID} />
                  <XAxis dataKey="name" tick={CHART_AXIS} tickLine={false} axisLine={false} />
                  <YAxis tick={CHART_AXIS} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Legend />
                  {analyticsData.top10Students.map((_, index) => (
                    <Line
                      key={index}
                      type="monotone"
                      dataKey={`Week ${index + 1}`}
                      stroke={`hsl(${(index * 360) / 10}, 70%, 55%)`}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-soft border-border/70">
            <CardHeader>
              <CardTitle>Top 15 Students with Most Improvement</CardTitle>
              <p className="text-sm text-muted-foreground">Highest problem-count increases since Week 3</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={improvementData}>
                  <CartesianGrid strokeDasharray="3 3" {...CHART_GRID} />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={CHART_AXIS} tickLine={false} axisLine={false} />
                  <YAxis tick={CHART_AXIS} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value: number) => [`${value} problems`, "Improvement"]} />
                  <Bar dataKey="improvement" fill={COLORS.primary} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card className="shadow-soft border-border/70">
            <CardHeader>
              <CardTitle>Progress Categories Distribution</CardTitle>
              <p className="text-sm text-muted-foreground">Breakdown of students by improvement status</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-soft border-border/70">
            <CardHeader>
              <CardTitle>Class Average Progress Over Time</CardTitle>
              <p className="text-sm text-muted-foreground">Overall class performance progression</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData.classAverageProgression}>
                  <defs>
                    <linearGradient id="classAvg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.secondary} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={COLORS.secondary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" {...CHART_GRID} />
                  <XAxis dataKey="week" tick={CHART_AXIS} tickLine={false} axisLine={false} />
                  <YAxis tick={CHART_AXIS} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value: number) => [`${value} problems`, "Class Average"]} />
                  <Area type="monotone" dataKey="average" stroke={COLORS.secondary} strokeWidth={2.5} fill="url(#classAvg)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Detailed table */}
        <Card className="shadow-soft border-border/70">
          <CardHeader>
            <CardTitle>Detailed Student Comparison</CardTitle>
            <p className="text-sm text-muted-foreground">Comprehensive view of all students with historical and current data</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead className="text-right">Week 1</TableHead>
                    <TableHead className="text-right">Week 2</TableHead>
                    <TableHead className="text-right">Week 3</TableHead>
                    <TableHead className="text-right">Current</TableHead>
                    <TableHead className="text-right">Change</TableHead>
                    <TableHead className="text-right">Improvement %</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyticsData.allStudentsData.map((student, index) => {
                    const week1 = student.weeklyTrends[0]?.totalProblems || 0;
                    const week2 = student.weeklyTrends[1]?.totalProblems || 0;
                    const week3 = student.weeklyTrends[2]?.totalProblems || 0;
                    const current = student.currentSolved;
                    const up = student.improvement >= 0;
                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium text-foreground">{student.student.name}</TableCell>
                        <TableCell>
                          <a
                            href={student.student.leetcodeProfileLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            @{student.student.leetcodeUsername}
                          </a>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">{week1}</TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">{week2}</TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">{week3}</TableCell>
                        <TableCell className="text-right font-semibold tabular-nums text-foreground">{current}</TableCell>
                        <TableCell className={`text-right font-medium tabular-nums ${up ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                          {up ? "+" : ""}{student.improvement}
                        </TableCell>
                        <TableCell className={`text-right tabular-nums ${student.improvementPercent >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                          {student.improvementPercent >= 0 ? "+" : ""}{student.improvementPercent}%
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {statusIcon(student.status)}
                            <Badge variant="outline" className={statusBadge(student.status)}>
                              {student.status}
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
