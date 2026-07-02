import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import StudentAvatar from '@/components/student-avatar';
import PageHeader from '@/components/page-header';

import { RefreshCw, Search, Trophy, TrendingUp, ExternalLink, Users, Clock, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface StudentRanking {
  rank: number;
  student: {
    id: string;
    name: string;
    leetcodeUsername: string;
    leetcodeProfileLink: string;
    profilePhoto?: string;
    githubUsername?: string | null;
  };
  stats: {
    totalSolved: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    ranking: number;
    acceptanceRate: number;
    totalSubmissions: number;
    totalAccepted: number;
  };
  weeklyProgress: number;
  streak: number;
  status: string;
  badges: number;
}

export default function RealTimeTracker() {
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const { toast } = useToast();

  const { data: rankings, isLoading, refetch, isRefetching } = useQuery<StudentRanking[]>({
    queryKey: ['/api/rankings/all'],
    refetchInterval: autoRefresh ? 30000 : false, // Auto-refresh every 30 seconds
  });

  const { data: adminData } = useQuery<{
    totalStudents: number;
    activeStudents: number;
    totalProblems: number;
    underperforming: number;
  }>({
    queryKey: ['/api/dashboard/admin'],
    refetchInterval: autoRefresh ? 30000 : false,
  });

  useEffect(() => {
    if (!isRefetching) {
      setLastSync(new Date());
    }
  }, [isRefetching]);

  const handleManualRefresh = async () => {
    await refetch();
    toast({
      title: "Data refreshed",
      description: "All student rankings have been updated.",
    });
  };

  const handleFullSync = async () => {
    try {
      const result = await apiRequest('POST', '/api/sync/all') as any;
      await refetch();
      toast({
        title: "Full sync completed",
        description: `Successfully synced ${result.success} students. ${result.failed} failed.`,
      });
    } catch (error) {
      toast({
        title: "Sync failed",
        description: "Failed to sync student data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredRankings = rankings?.filter(student =>
    student.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student.leetcodeUsername.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Excellent': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Good': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300';
      case 'Active': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'Underperforming': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-600 bg-yellow-50';
    if (rank === 2) return 'text-gray-600 bg-gray-50';
    if (rank === 3) return 'text-orange-600 bg-orange-50';
    if (rank <= 10) return 'text-blue-600 bg-blue-50';
    return 'text-gray-500 bg-gray-50';
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        icon={<Activity size={20} />}
        title="Real-Time Student Tracker"
        description={`Complete rankings for all ${rankings?.length || 0} students with live data`}
        actions={
          <>
            <span className="mr-1 hidden items-center gap-1.5 text-xs text-muted-foreground lg:flex">
              <Clock className="h-3.5 w-3.5" />
              {lastSync.toLocaleTimeString()}
              {autoRefresh && <span className="text-emerald-600 font-medium">· Auto</span>}
            </span>
            <Button variant="outline" size="sm" onClick={() => setAutoRefresh(!autoRefresh)}>
              {autoRefresh ? 'Disable' : 'Enable'} Auto
            </Button>
            <Button variant="outline" size="sm" onClick={handleManualRefresh} disabled={isRefetching}>
              <RefreshCw className={`h-4 w-4 sm:mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button onClick={handleFullSync} size="sm">
              <RefreshCw className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Full Sync</span>
            </Button>
          </>
        }
      />

      <div className="page-container py-6 space-y-6">
        {/* Overview Stats */}
        {adminData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{adminData.totalStudents}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active This Week</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{adminData.activeStudents}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Problems Solved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{adminData.totalProblems}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Need Attention</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{adminData.underperforming}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search students by name or LeetCode username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Rankings Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
              Complete Student Rankings
            </CardTitle>
            <CardDescription>
              Real-time rankings of all students based on total problems solved
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Problems Solved
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      LeetCode Ranking
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acceptance Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Difficulty Breakdown
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Weekly Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRankings.map((student) => (
                    <tr key={student.student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${getRankColor(student.rank)}`}>
                          {student.rank}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <StudentAvatar
                            name={student.student.name}
                            githubUsername={student.student.githubUsername}
                            profilePhoto={student.student.profilePhoto}
                            size={40}
                          />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {student.student.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              @{student.student.leetcodeUsername}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-lg font-bold text-blue-600">
                          {student.stats.totalSolved}
                        </div>
                        <div className="text-xs text-gray-500">
                          Streak: {student.streak} days
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {student.stats.ranking > 0 ? `#${student.stats.ranking.toLocaleString()}` : 'Not ranked'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Global ranking
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {((student.stats.acceptanceRate || 0) / 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">
                          {student.stats.totalSubmissions || 0} submissions
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-1">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                            Easy: {student.stats.easySolved}
                          </span>
                          <span className="inline-flex px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">
                            Med: {student.stats.mediumSolved}
                          </span>
                          <span className="inline-flex px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">
                            Hard: {student.stats.hardSolved}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                          <span className="text-sm font-medium">{student.weeklyProgress}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getStatusColor(student.status)}>
                          {student.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Link href={`/student/${student.student.leetcodeUsername}`}>
                          <Button variant="outline" size="sm">
                            View Dashboard
                          </Button>
                        </Link>
                        <a
                          href={student.student.leetcodeProfileLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {filteredRankings.length === 0 && searchTerm && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">No students found</h3>
            <p className="text-gray-500">
              Try adjusting your search term or clear the search to see all students
            </p>
          </div>
        )}
      </div>
    </div>
  );
}