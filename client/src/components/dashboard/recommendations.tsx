import { Lightbulb, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { RecommendedProblem, StudentDashboardData } from "@shared/schema";

interface RecommendationsProps {
  data: StudentDashboardData;
}

const DIFFICULTY_STYLES: Record<string, string> = {
  EASY: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  HARD: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

function ProblemRow({ problem }: { problem: RecommendedProblem }) {
  return (
    <a
      href={`https://leetcode.com/problems/${problem.titleSlug}/`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between gap-3 rounded-md px-3 py-2 hover:bg-muted/60 transition-colors"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{problem.title}</p>
        <p className="text-xs text-muted-foreground">
          {problem.categoryLabel}
          {problem.daysSinceSolved !== undefined
            ? ` · solved ${problem.daysSinceSolved}d ago`
            : ` · ${(problem.acRate / 100).toFixed(0)}% acceptance`}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge className={DIFFICULTY_STYLES[problem.difficulty] || ""} variant="outline">
          {problem.difficulty}
        </Badge>
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
    </a>
  );
}

function ProblemList({ problems, emptyText }: { problems: RecommendedProblem[]; emptyText: string }) {
  if (problems.length === 0) {
    return <p className="text-sm text-muted-foreground px-3 py-2">{emptyText}</p>;
  }
  return <div className="flex flex-col">{problems.map((p) => <ProblemRow key={p.titleSlug} problem={p} />)}</div>;
}

/** Fundamental / Refresh / New problem recommendations, driven by category scores. */
export default function Recommendations({ data }: RecommendationsProps) {
  const recs = data.recommendations || { fundamental: [], refresh: [], new: [] };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          Recommended Problems
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="fundamental">
          <TabsList>
            <TabsTrigger value="fundamental">Fundamental</TabsTrigger>
            <TabsTrigger value="refresh">Refresh</TabsTrigger>
            <TabsTrigger value="new">New</TabsTrigger>
          </TabsList>
          <TabsContent value="fundamental">
            <ProblemList
              problems={recs.fundamental}
              emptyText="No fundamentals suggestions yet — solve a few more problems to build up category data."
            />
          </TabsContent>
          <TabsContent value="refresh">
            <ProblemList
              problems={recs.refresh}
              emptyText="Nothing to refresh yet — this fills in once you have past solves in a weaker category."
            />
          </TabsContent>
          <TabsContent value="new">
            <ProblemList problems={recs.new} emptyText="No new-problem suggestions available right now." />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
