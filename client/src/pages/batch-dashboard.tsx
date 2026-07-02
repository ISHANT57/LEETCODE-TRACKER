import { useState } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import StudentAvatar from '@/components/student-avatar';
import PageHeader from '@/components/page-header';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { BatchDashboardData } from '@shared/schema';
import { Search, ExternalLink, Flame, Activity, Trophy, Users, BookOpen, RefreshCw } from 'lucide-react';
import { Link } from 'wouter';

export default function BatchDashboard() {
  const { batch } = useParams<{ batch: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<BatchDashboardData>({
    queryKey: ['/api/dashboard/batch', batch],
    enabled: !!batch && ['2027', '2028'].includes(batch)
  });

  const syncMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/sync/all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/batch', batch] });
      toast({
        title: "Sync completed",
        description: `All Batch ${batch} student data has been updated.`,
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

  const initBatch2027Mutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/init-batch-2027'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/batch', batch] });
      toast({
        title: "Batch 2027 initialized",
        description: "Batch 2027 students have been imported successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Import failed",
        description: "Failed to import Batch 2027 students.",
        variant: "destructive",
      });
    },
  });

  if (!batch || !['2027', '2028'].includes(batch)) {
    return (
      <div className="flex-1 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Invalid Batch</h3>
          <p className="text-red-600 text-sm mt-1">
            Please select a valid batch (2027 or 2028).
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error loading batch dashboard</h3>
          <p className="text-red-600 text-sm mt-1">
            Failed to load Batch {batch} data. Please try refreshing or initialize students first.
          </p>
          {batch === '2027' && (
            <Button 
              onClick={() => initBatch2027Mutation.mutate()} 
              className="mt-3" 
              variant="outline"
              disabled={initBatch2027Mutation.isPending}
            >
              {initBatch2027Mutation.isPending ? 'Initializing...' : 'Initialize Batch 2027'}
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.totalStudents === 0) {
    return (
      <div className="flex-1 p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-yellow-800 font-medium">No students found in Batch {batch}</h3>
          <p className="text-yellow-600 text-sm mt-1">
            {batch === '2027' 
              ? 'Please initialize the Batch 2027 student database first.'
              : 'No students found in this batch.'
            }
          </p>
          {batch === '2027' && (
            <Button 
              onClick={() => initBatch2027Mutation.mutate()} 
              className="mt-3" 
              variant="outline"
              disabled={initBatch2027Mutation.isPending}
            >
              {initBatch2027Mutation.isPending ? 'Initializing...' : 'Initialize Batch 2027'}
            </Button>
          )}
        </div>
      </div>
    );
  }

  const filteredStudents = data.students?.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.leetcodeUsername.toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <div>
      <PageHeader
        icon={<BookOpen size={20} />}
        title={`Batch ${batch} Dashboard`}
        description={`Overview and performance tracking for Batch ${batch} students`}
        actions={
          <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending} size="sm">
            <RefreshCw className={`mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} size={16} />
            {syncMutation.isPending ? 'Syncing…' : 'Sync All Data'}
          </Button>
        }
      />

      <div className="page-container py-6 space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Active: {data.activeStudents}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Problems</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(data.avgProblems)}</div>
            <p className="text-xs text-muted-foreground">
              Per student
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Max Streak</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.maxStreakOverall}</div>
            <p className="text-xs text-muted-foreground">
              Avg: {Math.round(data.avgMaxStreak)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Underperforming</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.underperforming}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={`Search Batch ${batch} students by name or LeetCode username...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Batch {batch} Students ({filteredStudents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>LeetCode Profile</TableHead>
                  <TableHead>Total Solved</TableHead>
                  <TableHead>Easy/Medium/Hard</TableHead>
                  <TableHead>LeetCode Ranking</TableHead>
                  <TableHead>This Week</TableHead>
                  <TableHead>Current Streak</TableHead>
                  <TableHead>Max Streak</TableHead>
                  <TableHead>Active Days</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.slice(0, 20).map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <StudentAvatar
                          name={student.name}
                          githubUsername={student.githubUsername}
                          profilePhoto={student.profilePhoto}
                          size={36}
                          fallbackClassName="text-xs"
                        />
                        <div>
                          <Link href={`/student/${student.leetcodeUsername}`}>
                            <span className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
                              {student.name}
                            </span>
                          </Link>
                          <div className="text-sm text-gray-500">Batch {batch}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <a 
                        href={student.leetcodeProfileLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                      >
                        @{student.leetcodeUsername}
                        <ExternalLink size={12} />
                      </a>
                    </TableCell>
                    <TableCell className="font-semibold text-lg">{student.stats.totalSolved}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex gap-1">
                          <div className="flex items-center gap-1 px-2 py-1 rounded bg-green-50 border border-green-200">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-xs font-medium text-green-700">{student.stats.easySolved}</span>
                          </div>
                          <div className="flex items-center gap-1 px-2 py-1 rounded bg-amber-50 border border-amber-200">
                            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                            <span className="text-xs font-medium text-amber-700">{student.stats.mediumSolved}</span>
                          </div>
                          <div className="flex items-center gap-1 px-2 py-1 rounded bg-red-50 border border-red-200">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            <span className="text-xs font-medium text-red-700">{student.stats.hardSolved}</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          E • M • H
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-gray-700">
                        {student.stats.ranking > 0 ? `#${student.stats.ranking.toLocaleString()}` : 'Not ranked'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          student.weeklyProgress >= 35 ? "default" : 
                          student.weeklyProgress >= 25 ? "secondary" : 
                          student.weeklyProgress >= 15 ? "outline" : 
                          "destructive"
                        }
                      >
                        +{student.weeklyProgress}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Flame className={student.streak > 0 ? "text-orange-500" : "text-gray-400"} size={16} />
                        <span className={student.streak > 0 ? "font-medium" : "text-slate-500"}>
                          {student.streak}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Flame className="text-red-500" size={16} />
                        <span className="font-medium">{student.maxStreak}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{student.totalActiveDays}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(student.status)}>
                        {student.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Batch Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Batch {batch} Top Performers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.leaderboard.slice(0, 10).map((entry) => (
              <div key={entry.student.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    entry.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                    entry.rank === 2 ? 'bg-gray-100 text-gray-800' :
                    entry.rank === 3 ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {entry.rank}
                  </div>
                  <StudentAvatar
                    name={entry.student.name}
                    githubUsername={entry.student.githubUsername}
                    profilePhoto={entry.student.profilePhoto}
                    size={36}
                  />
                  <div>
                    <div className="font-medium">{entry.student.name}</div>
                    <div className="text-sm text-gray-500">@{entry.student.leetcodeUsername}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{entry.weeklyScore}</div>
                  <div className="text-sm text-gray-500">problems solved</div>
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