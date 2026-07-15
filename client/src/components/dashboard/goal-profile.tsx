import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Flag, Check, Pencil, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PRIMARY_CATEGORIES, categoryLabel } from "@/lib/category-labels";
import type { StudentDashboardData, GoalProfile, GoalProfileTarget } from "@shared/schema";

interface GoalProfileSectionProps {
  data: StudentDashboardData;
  username?: string;
}

type ProfileWithTargets = GoalProfile & { targets: GoalProfileTarget[] };

/** Goal-profile progress (Amazon/Google/Custom) with an inline picker to change or create one. */
export default function GoalProfileSection({ data, username }: GoalProfileSectionProps) {
  const { toast } = useToast();
  const [picking, setPicking] = useState(!data.goalProfile);
  const [customCategories, setCustomCategories] = useState<string[]>(PRIMARY_CATEGORIES.slice(0, 8));
  const [saving, setSaving] = useState(false);

  const { data: profiles } = useQuery<{ builtin: ProfileWithTargets[]; custom: ProfileWithTargets | null }>({
    queryKey: ["/api/goal-profiles", data.student.id],
    queryFn: () => apiRequest("GET", `/api/goal-profiles?studentId=${data.student.id}`).then((r) => r.json()),
    enabled: picking,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard/student", username] });

  const selectBuiltin = async (profileId: string) => {
    setSaving(true);
    try {
      await apiRequest("PATCH", `/api/students/${data.student.id}/goal-profile/select`, {
        goalProfileId: profileId,
      });
      await invalidate();
      setPicking(false);
      toast({ title: "Goal profile selected" });
    } catch {
      toast({ title: "Failed to select goal profile", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const createCustom = async () => {
    if (customCategories.length === 0) {
      toast({ title: "Pick at least one category", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const profile = await apiRequest("POST", `/api/students/${data.student.id}/goal-profile/custom`, {
        name: "Custom",
        targets: customCategories.map((categorySlug) => ({ categorySlug, weight: 1, targetScore: 70 })),
      }).then((r) => r.json());
      await apiRequest("PATCH", `/api/students/${data.student.id}/goal-profile/select`, {
        goalProfileId: profile.id,
      });
      await invalidate();
      setPicking(false);
      toast({ title: "Custom goal profile created" });
    } catch {
      toast({ title: "Failed to create custom goal profile", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (slug: string) => {
    setCustomCategories((prev) => (prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug]));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Flag className="h-5 w-5 text-primary" />
          Goal Profile
        </CardTitle>
        {!picking && data.goalProfile && (
          <Button variant="ghost" size="sm" onClick={() => setPicking(true)}>
            <Pencil className="h-4 w-4 mr-1" />
            Change
          </Button>
        )}
        {picking && data.goalProfile && (
          <Button variant="ghost" size="sm" onClick={() => setPicking(false)} disabled={saving}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {!picking && data.goalProfile ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">{data.goalProfile.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{data.goalProfile.kind} profile</p>
              </div>
              <span className="text-2xl font-bold text-foreground">
                {Math.round(data.goalProfile.overallProgress * 100)}%
              </span>
            </div>
            <Progress value={data.goalProfile.overallProgress * 100} className="h-3" />
            <div className="space-y-2 pt-2">
              {data.goalProfile.targets.map((t) => (
                <div key={t.categorySlug} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t.categoryLabel}</span>
                  <span className="text-foreground font-medium">
                    {Math.round(t.currentScore)} / {Math.round(t.targetScore)}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Track progress against a curated focus area, or build a custom one from your own category picks.
            </p>
            <div className="flex flex-wrap gap-2">
              {profiles?.builtin.map((p) => (
                <Button key={p.id} variant="outline" size="sm" disabled={saving} onClick={() => selectBuiltin(p.id)}>
                  {p.name}
                </Button>
              ))}
              {profiles?.custom && (
                <Button variant="outline" size="sm" disabled={saving} onClick={() => selectBuiltin(profiles.custom!.id)}>
                  My Custom Profile
                </Button>
              )}
            </div>
            <div className="rounded-md border border-border p-3 space-y-3">
              <p className="text-sm font-medium text-foreground">Or build a custom profile</p>
              <div className="flex flex-wrap gap-3">
                {PRIMARY_CATEGORIES.map((slug) => (
                  <label key={slug} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Checkbox
                      checked={customCategories.includes(slug)}
                      onCheckedChange={() => toggleCategory(slug)}
                    />
                    {categoryLabel(slug)}
                  </label>
                ))}
              </div>
              <Button size="sm" onClick={createCustom} disabled={saving}>
                <Check className="h-4 w-4 mr-1" />
                Save Custom Profile
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
