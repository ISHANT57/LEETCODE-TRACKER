import { useState } from "react";
import { Target, Check, Pencil, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { StudentDashboardData } from "@shared/schema";

interface WeeklyGoalProps {
  data: StudentDashboardData;
  username?: string;
}

/** Shows this week's progress against the student's weekly goal, with an
 *  inline editor to adjust the target. */
export default function WeeklyGoal({ data, username }: WeeklyGoalProps) {
  const { toast } = useToast();
  const goal = data.student.weeklyGoal || 25;
  const solved = data.currentWeeklyProgress || 0;
  const pct = goal > 0 ? Math.min(100, Math.round((solved / goal) * 100)) : 0;
  const reached = solved >= goal;

  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(goal));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const next = Number(value);
    if (!Number.isFinite(next) || next < 1 || next > 1000) {
      toast({
        title: "Invalid goal",
        description: "Enter a number between 1 and 1000.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      await apiRequest("PATCH", `/api/students/${data.student.id}/goal`, {
        weeklyGoal: Math.round(next),
      });
      await queryClient.invalidateQueries({
        queryKey: ["/api/dashboard/student", username],
      });
      setEditing(false);
      toast({ title: "Goal updated", description: `Weekly target set to ${Math.round(next)}.` });
    } catch {
      toast({
        title: "Update failed",
        description: "Could not save the goal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Weekly Goal
        </CardTitle>
        {!editing ? (
          <Button variant="ghost" size="sm" onClick={() => { setValue(String(goal)); setEditing(true); }}>
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={1000}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="h-8 w-20"
              disabled={saving}
            />
            <Button size="sm" onClick={save} disabled={saving}>
              <Check className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)} disabled={saving}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-3xl font-bold text-foreground">{solved}</span>
            <span className="text-lg text-muted-foreground"> / {goal}</span>
            <p className="text-sm text-muted-foreground">problems this week</p>
          </div>
          <span
            className={`text-sm font-semibold ${
              reached ? "text-emerald-600" : "text-muted-foreground"
            }`}
          >
            {pct}%
          </span>
        </div>
        <Progress value={pct} className="h-3" />
        <p className={`text-sm ${reached ? "text-emerald-600 font-medium" : "text-muted-foreground"}`}>
          {reached
            ? "🎉 Goal reached — great work this week!"
            : `${goal - solved} more to hit this week's goal.`}
        </p>
      </CardContent>
    </Card>
  );
}
