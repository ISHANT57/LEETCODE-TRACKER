import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import StudentAvatar from '@/components/student-avatar';
import PageHeader from '@/components/page-header';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { UniversityDashboardData } from '@shared/schema';
import { Search, ExternalLink, Flame, Activity, Trophy, Users, Building2, Target } from 'lucide-react';
import { Link } from 'wouter';

export default function UniversityDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<UniversityDashboardData>({
    queryKey: ['/api/dashboard/university'],
  });

  const syncMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/sync/all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/university'] });
      toast({
        title: "Sync completed",
        description: "All university data has been updated.",
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
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/university'] });
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

  if (error) {
    return (
      <div className="flex-1 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error loading university dashboard</h3>
          <p className="text-red-600 text-sm mt-1">
            Failed to load university data. Please try refreshing.
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-200 rounded"></div>
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
          <h3 className="text-yellow-800 font-medium">No university data found</h3>
          <p className="text-yellow-600 text-sm mt-1">
            Please ensure both batches are initialized.
          </p>
          <Button 
            onClick={() => initBatch2027Mutation.mutate()} 
            className="mt-3" 
            variant="outline"
            disabled={initBatch2027Mutation.isPending}
          >
            {initBatch2027Mutation.isPending ? 'Initializing...' : 'Initialize Batch 2027'}
          </Button>
        </div>
      </div>
    );
  }

  const filteredUniversityLeaderboard = data.combined.universityLeaderboard?.filter(entry =>
    entry.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.student.leetcodeUsername.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div>
      <PageHeader
        icon={<Building2 size={20} />}
        title="University Dashboard"
        description="Combined overview and performance tracking for all batches"
        actions={
          <>
            <Button
              onClick={() => initBatch2027Mutation.mutate()}
              disabled={initBatch2027Mutation.isPending}
              variant="outline"
              size="sm"
            >
              {initBatch2027Mutation.isPending ? 'Initializing…' : 'Init Batch 2027'}
            </Button>
            <Button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              size="sm"
            >
              {syncMutation.isPending ? 'Syncing…' : 'Sync All Data'}
            </Button>
          </>
        }
      />

      <div className="page-container py-6 space-y-6">
      {/* University Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.combined.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Active: {data.combined.activeStudents}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Problems</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(data.combined.avgProblems)}</div>
            <p className="text-xs text-muted-foreground">
              University-wide average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Max Streak</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.combined.maxStreakOverall}</div>
            <p className="text-xs text-muted-foreground">
              Avg: {Math.round(data.combined.avgMaxStreak)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Underperforming</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.combined.underperforming}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Batch Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Batch 2027 Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold">{data.batch2027.totalStudents}</div>
                <div className="text-sm text-gray-500">Total Students</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{Math.round(data.batch2027.avgProblems)}</div>
                <div className="text-sm text-gray-500">Avg Problems</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{data.batch2027.maxStreakOverall}</div>
                <div className="text-sm text-gray-500">Max Streak</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{data.batch2027.activeStudents}</div>
                <div className="text-sm text-gray-500">Active Students</div>
              </div>
            </div>
            <Link href="/batch/2027">
              <Button variant="outline" className="w-full">
                View Batch 2027 Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Batch 2028 Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold">{data.batch2028.totalStudents}</div>
                <div className="text-sm text-gray-500">Total Students</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{Math.round(data.batch2028.avgProblems)}</div>
                <div className="text-sm text-gray-500">Avg Problems</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{data.batch2028.maxStreakOverall}</div>
                <div className="text-sm text-gray-500">Max Streak</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{data.batch2028.activeStudents}</div>
                <div className="text-sm text-gray-500">Active Students</div>
              </div>
            </div>
            <Link href="/batch/2028">
              <Button variant="outline" className="w-full">
                View Batch 2028 Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search university-wide students by name or LeetCode username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* University-wide Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>University-wide Leaderboard (Top 20)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>LeetCode Profile</TableHead>
                  <TableHead>Total Solved</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUniversityLeaderboard.slice(0, 20).map((entry) => (
                  <TableRow key={entry.student.id}>
                    <TableCell>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        entry.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                        entry.rank === 2 ? 'bg-gray-100 text-gray-800' :
                        entry.rank === 3 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {entry.rank}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <StudentAvatar
                          name={entry.student.name}
                          githubUsername={entry.student.githubUsername}
                          profilePhoto={entry.student.profilePhoto}
                          size={36}
                          fallbackClassName="text-xs"
                        />
                        <div>
                          <Link href={`/student/${entry.student.leetcodeUsername}`}>
                            <span className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
                              {entry.student.name}
                            </span>
                          </Link>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={entry.batch === '2027' ? 'secondary' : 'default'}>
                        Batch {entry.batch}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <a 
                        href={entry.student.leetcodeProfileLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                      >
                        @{entry.student.leetcodeUsername}
                        <ExternalLink size={12} />
                      </a>
                    </TableCell>
                    <TableCell className="font-semibold text-lg">{entry.totalSolved}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Batch Leaderboards */}
      <Tabs defaultValue="batch-2028" className="space-y-4">
        <TabsList>
          <TabsTrigger value="batch-2028">Batch 2028 Leaders</TabsTrigger>
          <TabsTrigger value="batch-2027">Batch 2027 Leaders</TabsTrigger>
        </TabsList>

        <TabsContent value="batch-2028">
          <Card>
            <CardHeader>
              <CardTitle>Batch 2028 Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.batch2028.leaderboard.slice(0, 10).map((entry) => (
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
        </TabsContent>

        <TabsContent value="batch-2027">
          <Card>
            <CardHeader>
              <CardTitle>Batch 2027 Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              {data.batch2027.leaderboard.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No Batch 2027 students found.</p>
                  <Button 
                    onClick={() => initBatch2027Mutation.mutate()} 
                    className="mt-3" 
                    variant="outline"
                    disabled={initBatch2027Mutation.isPending}
                  >
                    {initBatch2027Mutation.isPending ? 'Initializing...' : 'Initialize Batch 2027'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.batch2027.leaderboard.slice(0, 10).map((entry) => (
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
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}