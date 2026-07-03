import { Card } from "@/components/ui/card";
import {
  Users,
  TrendingUp,
  Calculator,
  AlertTriangle,
  Flame,
  Target,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminDashboardData } from "@shared/schema";

interface BatchStatsProps {
  data: AdminDashboardData;
}

interface StatDef {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent: string;
}

export default function BatchStats({ data }: BatchStatsProps) {
  const stats: StatDef[] = [
    {
      label: "Total Students",
      value: data.totalStudents,
      icon: Users,
      accent: "text-blue-600 dark:text-blue-400 bg-blue-500/10",
    },
    {
      label: "Active This Week",
      value: data.activeStudents,
      icon: TrendingUp,
      accent: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
    },
    {
      label: "Avg Problems/Week",
      value: Math.round(data.avgProblems),
      icon: Calculator,
      accent: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
    },
    {
      label: "Underperforming",
      value: data.underperforming,
      icon: AlertTriangle,
      accent: "text-red-600 dark:text-red-400 bg-red-500/10",
    },
    {
      label: "Max Streak Overall",
      value: `${data.maxStreakOverall} days`,
      icon: Flame,
      accent: "text-orange-600 dark:text-orange-400 bg-orange-500/10",
    },
    {
      label: "Avg Max Streak",
      value: `${Math.round(data.avgMaxStreak)} days`,
      icon: Target,
      accent: "text-violet-600 dark:text-violet-400 bg-violet-500/10",
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="p-4 shadow-soft border-border/70">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                  {stat.value}
                </p>
              </div>
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  stat.accent,
                )}
              >
                <Icon size={18} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
