import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StudentDashboardData } from "@shared/schema";

interface DifficultyTrendProps {
  data: StudentDashboardData;
}

/**
 * "Progress over time" chart: stacked cumulative solved counts split by
 * difficulty, drawn from the daily-progress history. Falls back gracefully
 * when a student has little or no history.
 */
export default function DifficultyTrend({ data }: DifficultyTrendProps) {
  const history = data.difficultyHistory || [];

  const chartData = history.map((h) => ({
    // Show as M/D for a compact axis.
    date: h.date.slice(5),
    Easy: h.easy,
    Medium: h.medium,
    Hard: h.hard,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Difficulty Progress Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length < 2 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            Not enough history yet — check back after a few daily syncs.
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 8, right: 8, bottom: 8, left: 0 }}
              >
                <defs>
                  <linearGradient id="gEasy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="gMedium" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="gHard" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={20} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="Easy"
                  stackId="1"
                  stroke="#16a34a"
                  fill="url(#gEasy)"
                />
                <Area
                  type="monotone"
                  dataKey="Medium"
                  stackId="1"
                  stroke="#d97706"
                  fill="url(#gMedium)"
                />
                <Area
                  type="monotone"
                  dataKey="Hard"
                  stackId="1"
                  stroke="#dc2626"
                  fill="url(#gHard)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
