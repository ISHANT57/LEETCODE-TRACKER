import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Link } from "wouter";
import { RefreshCw, ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import StudentAvatar from "@/components/student-avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import StatsOverview from "@/components/dashboard/stats-overview";
import DifficultyBreakdown from "@/components/dashboard/difficulty-breakdown";
import DifficultyTrend from "@/components/dashboard/difficulty-trend";
import LanguageBreakdown from "@/components/dashboard/language-breakdown";
import WeeklyGoal from "@/components/dashboard/weekly-goal";
import WeeklyProgress from "@/components/dashboard/weekly-progress";
import RecentBadges from "@/components/dashboard/recent-badges";
import DailyActivity from "@/components/dashboard/daily-activity";
import SubmissionStats from "@/components/dashboard/submission-stats";
import ActivityHeatmap from "@/components/dashboard/activity-heatmap";
import RankingOverview from "@/components/dashboard/ranking-overview";
import type { StudentDashboardData } from "@shared/schema";

export default function StudentDashboard() {
  const { username } = useParams();
  const { toast } = useToast();

  const { data, isLoading, error, refetch } = useQuery<StudentDashboardData>({
    queryKey: ['/api/dashboard/student', username],
    enabled: !!username,
  });

  const handleSync = async () => {
    try {
      if (data?.student) {
        await apiRequest('POST', `/api/sync/student/${data.student.id}`);
        await refetch();
        toast({
          title: "Sync successful",
          description: "Your LeetCode data has been updated.",
        });
      }
    } catch (error) {
      toast({
        title: "Sync failed",
        description: "Failed to sync LeetCode data. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!username) {
    return (
      <div className="flex-1 p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-yellow-800">No student selected</h3>
          <p className="text-yellow-700">Please go back and select a student from the directory.</p>
          <Link href="/">
            <Button className="mt-3">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Student Directory
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error loading dashboard</h3>
          <p className="text-red-600 text-sm mt-1">
            Failed to load student data. Please check if the student exists or try refreshing.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-yellow-800 font-medium">No data available</h3>
          <p className="text-yellow-600 text-sm mt-1">
            No student data found. Please initialize the students first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                All Students
              </Button>
            </Link>
            <StudentAvatar
              name={data?.student?.name || username || ''}
              githubUsername={data?.student?.githubUsername}
              profilePhoto={data?.student?.profilePhoto}
              size={48}
              className="ring-2 ring-primary/10"
            />
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {data?.student?.name || username}
              </h2>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-slate-500">@{username}</p>
                {data?.student?.leetcodeProfileLink && (
                  <a 
                    href={data.student.leetcodeProfileLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-slate-500">
              <RefreshCw className="inline mr-1" size={14} />
              Last sync: 2 min ago
            </div>
            <Button onClick={handleSync} className="bg-leetcode-primary hover:bg-blue-600">
              <RefreshCw className="mr-2" size={16} />
              Sync Now
            </Button>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="p-6 space-y-6">
        <StatsOverview data={data} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WeeklyGoal data={data} username={username} />
          <RankingOverview data={data} />
        </div>
        
        <SubmissionStats data={data} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DifficultyBreakdown data={data} />
          <WeeklyProgress data={data} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <DifficultyTrend data={data} />
          </div>
          <LanguageBreakdown data={data} />
        </div>

        <ActivityHeatmap data={data} />
        <RecentBadges data={data} />
        <DailyActivity data={data} />
      </div>
    </div>
  );
}
