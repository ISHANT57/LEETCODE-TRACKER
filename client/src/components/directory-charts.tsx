import { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import { Card } from "@/components/ui/card";

interface StudentLike {
  name: string;
  stats: {
    totalSolved: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
  };
}

const DIFF_COLORS = {
  easy: "hsl(160, 84%, 39%)",
  medium: "hsl(38, 92%, 50%)",
  hard: "hsl(0, 72%, 51%)",
};

function ChartCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`p-5 shadow-soft border-border/70 ${className}`}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold tracking-wide text-foreground uppercase">
          {title}
        </h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </Card>
  );
}

export default function DirectoryCharts({
  students,
  isLoading,
}: {
  students: StudentLike[];
  isLoading: boolean;
}) {
  // Real distribution: students ranked by problems solved (ascending → rising curve).
  const distribution = useMemo(() => {
    const sorted = [...students]
      .map((s) => s.stats?.totalSolved || 0)
      .sort((a, b) => a - b);
    const BUCKETS = 12;
    if (sorted.length === 0) return [];
    const step = Math.max(1, Math.ceil(sorted.length / BUCKETS));
    const points: { label: string; solved: number }[] = [];
    for (let i = 0; i < sorted.length; i += step) {
      const slice = sorted.slice(i, i + step);
      const avg = Math.round(slice.reduce((a, b) => a + b, 0) / slice.length);
      points.push({ label: `${i + 1}`, solved: avg });
    }
    return points;
  }, [students]);

  const difficulty = useMemo(() => {
    const easy = students.reduce((s, x) => s + (x.stats?.easySolved || 0), 0);
    const medium = students.reduce((s, x) => s + (x.stats?.mediumSolved || 0), 0);
    const hard = students.reduce((s, x) => s + (x.stats?.hardSolved || 0), 0);
    const total = easy + medium + hard;
    return { easy, medium, hard, total };
  }, [students]);

  const pieData = [
    { name: "Easy", value: difficulty.easy, color: DIFF_COLORS.easy },
    { name: "Medium", value: difficulty.medium, color: DIFF_COLORS.medium },
    { name: "Hard", value: difficulty.hard, color: DIFF_COLORS.hard },
  ];

  const pct = (v: number) =>
    difficulty.total ? ((v / difficulty.total) * 100).toFixed(1) : "0";

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-72 animate-pulse rounded-xl bg-muted/40 lg:col-span-2" />
        <div className="h-72 animate-pulse rounded-xl bg-muted/40" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <ChartCard
        title="Progress Overview"
        subtitle="Problems solved across students (ranked)"
        className="lg:col-span-2"
      >
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={distribution} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="solvedFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(215,16%,47%)" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(215,16%,47%)" }} tickLine={false} axisLine={false} width={40} />
            <Tooltip
              contentStyle={{
                borderRadius: 10,
                border: "1px solid hsl(214,32%,91%)",
                fontSize: 12,
                boxShadow: "0 4px 24px rgba(15,23,42,0.08)",
              }}
              formatter={(v: number) => [`${v} solved`, "Avg"]}
              labelFormatter={(l) => `Rank bucket ${l}`}
            />
            <Area
              type="monotone"
              dataKey="solved"
              stroke="hsl(221, 83%, 53%)"
              strokeWidth={2.5}
              fill="url(#solvedFill)"
              dot={false}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Problem Difficulty Distribution">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative h-[180px] w-[150px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData.filter((d) => d.value > 0)}
                  dataKey="value"
                  innerRadius={52}
                  outerRadius={72}
                  paddingAngle={2}
                  stroke="none"
                >
                  {pieData.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: "1px solid hsl(214,32%,91%)", fontSize: 12 }}
                  formatter={(v: number, n) => [`${v.toLocaleString()} (${pct(v)}%)`, n]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-foreground">
                {difficulty.total.toLocaleString()}
              </span>
              <span className="text-[10px] text-muted-foreground">Total</span>
            </div>
          </div>
          <div className="flex-1 space-y-3">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                  {d.name}
                </span>
                <span className="font-medium text-foreground">
                  {d.value.toLocaleString()}{" "}
                  <span className="text-xs text-muted-foreground">({pct(d.value)}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </ChartCard>
    </div>
  );
}
