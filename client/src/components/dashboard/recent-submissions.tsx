import { formatDistanceToNow } from "date-fns";
import { History, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { StudentDashboardData } from "@shared/schema";

interface RecentSubmissionsProps {
  data: StudentDashboardData;
}

const DIFFICULTY_STYLES: Record<string, string> = {
  EASY: "bg-green-100 text-green-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HARD: "bg-red-100 text-red-800",
};

function difficultyLabel(difficulty: string) {
  return difficulty.charAt(0) + difficulty.slice(1).toLowerCase();
}

export default function RecentSubmissions({ data }: RecentSubmissionsProps) {
  const submissions = data.recentSubmissions || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Recent Submissions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {submissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No accepted submissions synced yet. This list fills in after the next sync.
          </p>
        ) : (
          <div className="divide-y">
            {submissions.map((submission) => (
              <div
                key={submission.problemSlug}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <a
                    href={`https://leetcode.com/problems/${submission.problemSlug}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 font-medium text-sm text-foreground hover:text-primary truncate"
                  >
                    <span className="truncate">{submission.problemTitle}</span>
                    <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                  </a>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(submission.solvedAt), { addSuffix: true })}
                  </p>
                </div>
                <Badge
                  className={DIFFICULTY_STYLES[submission.difficulty] || "bg-slate-100 text-slate-800"}
                  variant="secondary"
                >
                  {difficultyLabel(submission.difficulty)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
