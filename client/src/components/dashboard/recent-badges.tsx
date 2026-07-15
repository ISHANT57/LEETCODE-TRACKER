import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import type { StudentDashboardData } from "@shared/schema";

interface RecentBadgesProps {
  data: StudentDashboardData;
}

export default function RecentBadges({ data }: RecentBadgesProps) {
  const badges = data.badges || [];

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <CardTitle>LeetCode Badges</CardTitle>
          <Link href="/badges">
            <a className="text-sm text-leetcode-primary hover:text-blue-700 font-medium">
              View All
            </a>
          </Link>
        </div>
        {badges.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No LeetCode badges earned yet. Badges sync in automatically from the student's LeetCode profile.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className="flex flex-col items-center p-4 rounded-lg border bg-slate-50 border-slate-200"
              >
                <img
                  src={badge.icon}
                  alt={badge.name}
                  className="w-14 h-14 object-contain mb-2"
                  loading="lazy"
                />
                <span className="text-sm font-semibold text-slate-900 text-center">
                  {badge.name}
                </span>
                {badge.earnedAt && (
                  <span className="text-xs text-slate-500 text-center">
                    {new Date(badge.earnedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
