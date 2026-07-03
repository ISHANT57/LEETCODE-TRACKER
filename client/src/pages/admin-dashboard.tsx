import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, apiUrl } from "@/lib/queryClient";
import BatchStats from "@/components/admin/batch-stats";
import StudentTable from "@/components/admin/student-table";
import GithubHandleManager from "@/components/admin/github-handle-manager";
import StudentAvatar from "@/components/student-avatar";
import PageHeader from "@/components/page-header";
import type { AdminDashboardData } from "@shared/schema";

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<AdminDashboardData>({
    queryKey: ['/api/dashboard/admin'],
  });

  const syncMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/sync/all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/admin'] });
      toast({
        title: "Sync completed",
        description: "All student data has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Sync failed",
        description: "Failed to sync student data. Please try again.",
        variant: "destructive",
      });
    },
  });

  const syncProfilePhotosMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/sync/profile-photos'),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/admin'] });
      toast({
        title: "Profile photos synced",
        description: `Updated ${data.success} profile photos successfully.`,
      });
    },
    onError: () => {
      toast({
        title: "Sync failed",
        description: "Failed to sync profile photos. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleExportCSV = () => {
    // Use apiUrl so the export hits the API origin (Render) when the frontend
    // is deployed separately; falls back to a relative path in the monolith.
    window.open(apiUrl('/api/export/csv'), '_blank');
  };

  const handleInitStudents = async () => {
    try {
      await apiRequest('POST', '/api/init-students');
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/admin'] });
      toast({
        title: "Students initialized",
        description: "Student data has been imported successfully.",
      });
    } catch (error) {
      toast({
        title: "Import failed",
        description: "Failed to import student data.",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <div className="page-container py-6">
        <Card className="border-destructive/30 bg-destructive/5 p-6">
          <h3 className="font-semibold text-destructive">Error loading dashboard</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Failed to load admin data. Please try refreshing or initialize students first.
          </p>
          <Button onClick={handleInitStudents} className="mt-3" variant="outline">
            Initialize Students
          </Button>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="page-container py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-1/3 rounded bg-muted"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-muted"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.totalStudents === 0) {
    return (
      <div className="page-container py-6">
        <Card className="border-amber-500/30 bg-amber-500/5 p-6">
          <h3 className="font-semibold text-amber-600 dark:text-amber-400">No students found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Please initialize the student database first.
          </p>
          <Button onClick={handleInitStudents} className="mt-3">
            Initialize Students
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        icon={<ShieldCheck size={20} />}
        title="Admin Dashboard"
        description="Monitor batch performance and manage students"
        actions={
          <>
            <Button
              onClick={handleExportCSV}
              variant="outline"
              size="sm"
              className="text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
            >
              <Download className="mr-2" size={16} />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
            <Button
              onClick={() => syncProfilePhotosMutation.mutate()}
              disabled={syncProfilePhotosMutation.isPending}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`mr-2 ${syncProfilePhotosMutation.isPending ? 'animate-spin' : ''}`} size={16} />
              <span className="hidden sm:inline">{syncProfilePhotosMutation.isPending ? 'Syncing…' : 'Sync Photos'}</span>
            </Button>
            <Button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              size="sm"
            >
              <RefreshCw className={`mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} size={16} />
              {syncMutation.isPending ? 'Syncing…' : 'Sync All'}
            </Button>
          </>
        }
      />

      {/* Dashboard Content */}
      <div className="page-container py-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Batch Overview</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <BatchStats data={data} />
            <StudentTable data={data} />
          </CardContent>
        </Card>

        {/* GitHub handle management → drives profile photos */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Photos (GitHub Handles)</CardTitle>
          </CardHeader>
          <CardContent>
            <GithubHandleManager data={data} />
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.leaderboard.slice(0, 5).map((entry, index) => (
                <div
                  key={entry.student.id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                    index === 0
                      ? 'border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-transparent'
                      : 'border-border/70 bg-muted/40 hover:bg-muted/60'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-slate-400' : 'bg-amber-600'
                    }`}>
                      {entry.rank}
                    </div>
                    <StudentAvatar
                      name={entry.student.name}
                      githubUsername={entry.student.githubUsername}
                      profilePhoto={entry.student.profilePhoto}
                      size={32}
                    />
                    <div>
                      <p className="font-medium text-foreground">{entry.student.name}</p>
                      <p className="text-xs text-muted-foreground">@{entry.student.leetcodeUsername}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">+{entry.weeklyScore}</p>
                    <p className="text-xs text-muted-foreground">this week</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
