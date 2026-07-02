import { useQuery } from "@tanstack/react-query";
import { Trophy, Medal, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import StudentAvatar from "@/components/student-avatar";
import PageHeader from "@/components/page-header";
import type { AdminDashboardData } from "@shared/schema";

export default function Leaderboard() {
  const { data, isLoading, error } = useQuery<AdminDashboardData['leaderboard']>({
    queryKey: ['/api/leaderboard'],
  });

  const rankBadge = (rank: number) => {
    if (rank === 1)
      return { icon: <Trophy size={18} />, cls: "bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-md shadow-amber-500/30" };
    if (rank === 2)
      return { icon: <Medal size={18} />, cls: "bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-md shadow-slate-400/30" };
    if (rank === 3)
      return { icon: <Award size={18} />, cls: "bg-gradient-to-br from-orange-400 to-amber-600 text-white shadow-md shadow-orange-500/30" };
    return { icon: <span className="text-sm font-bold">{rank}</span>, cls: "bg-muted text-muted-foreground" };
  };

  const rowStyle = (rank: number) => {
    if (rank === 1) return "border-amber-200 bg-gradient-to-r from-amber-50 to-transparent";
    if (rank === 2) return "border-slate-200 bg-gradient-to-r from-slate-50 to-transparent";
    if (rank === 3) return "border-orange-200 bg-gradient-to-r from-orange-50 to-transparent";
    return "border-border bg-card";
  };

  return (
    <div>
      <PageHeader
        icon={<Trophy size={20} />}
        title="Leaderboard"
        description="Weekly performance rankings across all batches"
      />

      <div className="page-container py-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <h3 className="font-medium text-red-800">Error loading leaderboard</h3>
            <p className="mt-1 text-sm text-red-600">Failed to load leaderboard data.</p>
          </div>
        )}

        {isLoading && (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-muted/40" />
            ))}
          </div>
        )}

        {!isLoading && !error && (!data || data.length === 0) && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <h3 className="font-medium text-amber-800">No leaderboard data</h3>
            <p className="mt-1 text-sm text-amber-600">No student progress data available yet.</p>
          </div>
        )}

        {!isLoading && data && data.length > 0 && (
          <Card className="shadow-soft border-border/70">
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-2.5">
                {data.map((entry, i) => {
                  const badge = rankBadge(entry.rank);
                  return (
                    <div
                      key={entry.student.id}
                      className={`flex items-center justify-between rounded-xl border p-3 sm:p-4 transition-all hover:shadow-soft animate-fade-in ${rowStyle(entry.rank)}`}
                      style={{ animationDelay: `${Math.min(i, 12) * 25}ms` }}
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${badge.cls}`}>
                          {badge.icon}
                        </div>
                        <StudentAvatar
                          name={entry.student.name}
                          githubUsername={entry.student.githubUsername}
                          profilePhoto={entry.student.profilePhoto}
                          size={44}
                          className="ring-2 ring-white shadow-sm"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold text-foreground">
                            {entry.student.name}
                          </p>
                          <p className="truncate text-sm text-muted-foreground">
                            @{entry.student.leetcodeUsername}
                          </p>
                        </div>
                      </div>
                      <div className="pl-3 text-right">
                        <p className="text-2xl font-bold tracking-tight text-foreground">
                          +{entry.weeklyScore}
                        </p>
                        <p className="text-xs text-muted-foreground">this week</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
