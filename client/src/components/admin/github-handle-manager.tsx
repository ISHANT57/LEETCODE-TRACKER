import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Github, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import StudentAvatar from "@/components/student-avatar";
import type { AdminDashboardData } from "@shared/schema";

interface GithubHandleManagerProps {
  data: AdminDashboardData;
}

/**
 * Admin panel to assign each student's GitHub handle. The handle drives the
 * profile photo shown across the app (https://github.com/<handle>.png).
 */
export default function GithubHandleManager({ data }: GithubHandleManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const students = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const list = [...data.students].sort((a, b) => a.name.localeCompare(b.name));
    if (!q) return list;
    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.leetcodeUsername.toLowerCase().includes(q) ||
        (s.githubUsername ?? "").toLowerCase().includes(q),
    );
  }, [data.students, filter]);

  const saveMutation = useMutation({
    mutationFn: ({ id, githubUsername }: { id: string; githubUsername: string }) =>
      apiRequest("PATCH", `/api/students/${id}`, { githubUsername }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/admin"] });
      queryClient.invalidateQueries({ queryKey: ["/api/students/all"] });
      toast({ title: "GitHub handle saved" });
    },
    onError: () =>
      toast({ title: "Save failed", description: "Try again.", variant: "destructive" }),
  });

  const handleSave = async (id: string, current: string | null | undefined) => {
    const next = (drafts[id] ?? current ?? "").trim();
    if (next === (current ?? "")) return;
    setSavingId(id);
    try {
      await saveMutation.mutateAsync({ id, githubUsername: next });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Github size={16} />
        <span>
          Set each student's GitHub username to show their photo. Leave blank to
          fall back to their LeetCode photo or initials.
        </span>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <Input
          placeholder="Search by name or username…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {students.map((student) => {
          const current = student.githubUsername ?? "";
          const draft = drafts[student.id] ?? current;
          const dirty = draft.trim() !== current;
          const isSaving = savingId === student.id;
          return (
            <div
              key={student.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
            >
              <StudentAvatar
                name={student.name}
                githubUsername={draft || student.githubUsername}
                profilePhoto={student.profilePhoto}
                size={40}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{student.name}</p>
                <div className="mt-1 flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">github.com/</span>
                  <Input
                    value={draft}
                    placeholder="handle"
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [student.id]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSave(student.id, student.githubUsername);
                    }}
                    className="h-7 text-xs"
                  />
                </div>
              </div>
              <Button
                size="sm"
                variant={dirty ? "default" : "ghost"}
                disabled={!dirty || isSaving}
                onClick={() => handleSave(student.id, student.githubUsername)}
                className="shrink-0"
              >
                {isSaving ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <Check size={14} />
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
