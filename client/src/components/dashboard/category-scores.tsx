import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ScoreGauge from "@/components/score-gauge";
import { categoryLabel } from "@/lib/category-labels";
import type { StudentDashboardData } from "@shared/schema";

interface CategoryScoresProps {
  data: StudentDashboardData;
}

const COLLAPSED_LIMIT = 8;

/** Per-category confidence scores, sorted strongest first. */
export default function CategoryScores({ data }: CategoryScoresProps) {
  const [showAll, setShowAll] = useState(false);
  const scores = data.categoryScores || [];

  if (scores.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Category Confidence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Not enough recent solve data yet to estimate category scores. Scores build up as new
            solves sync in (based on your most recent accepted submissions on LeetCode).
          </p>
        </CardContent>
      </Card>
    );
  }

  const visible = showAll ? scores : scores.slice(0, COLLAPSED_LIMIT);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Category Confidence
        </CardTitle>
        {scores.length > COLLAPSED_LIMIT && (
          <Button variant="ghost" size="sm" onClick={() => setShowAll((v) => !v)}>
            {showAll ? "Show less" : `Show all (${scores.length})`}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4">
          {visible.map((s) => (
            <div key={s.categorySlug} className="flex flex-col items-center gap-1">
              <ScoreGauge value={s.adjustedScore} size={80} label={categoryLabel(s.categorySlug)} />
              {s.confidenceLevel < 0.5 && (
                <Badge variant="secondary" className="text-[10px]">
                  Limited data
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
