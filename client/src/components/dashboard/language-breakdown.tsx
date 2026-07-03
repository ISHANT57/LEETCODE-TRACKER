import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { StudentDashboardData } from "@shared/schema";

interface LanguageBreakdownProps {
  data: StudentDashboardData;
}

/** Top programming languages the student solves problems in. */
export default function LanguageBreakdown({ data }: LanguageBreakdownProps) {
  const languageStats = data.stats.languageStats || {};
  const entries = Object.entries(languageStats)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const max = entries.length > 0 ? entries[0][1] : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Languages Used</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {entries.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            No language data available yet.
          </div>
        ) : (
          entries.map(([language, count]) => (
            <div key={language}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">
                  {language}
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  {count.toLocaleString()}
                </span>
              </div>
              <Progress value={max > 0 ? (count / max) * 100 : 0} className="h-2" />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
