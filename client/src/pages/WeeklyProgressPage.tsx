import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Upload, TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from "recharts";

interface WeeklyProgressStudent {
  student: {
    name: string;
    leetcodeUsername: string;
    leetcodeProfileLink: string;
  } | null;
  weeklyData: {
    week1: number;
    week2: number;
    week3: number;
    week4: number;
  };
  progressIncrements: {
    week2Progress: number;
    week3Progress: number;
    week4Progress: number;
  };
  realTimeData: {
    currentSolved: number;
    newIncrement: number;
    lastUpdated: string;
  };
  summary: {
    totalScore: number;
    averageWeeklyGrowth: number;
  };
}

export default function WeeklyProgressPage() {
  const { toast } = useToast();
  const [sortBy, setSortBy] = useState<'currentSolved' | 'newIncrement' | 'name'>('currentSolved');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch weekly progress data
  const { data: weeklyProgressData, isLoading } = useQuery<WeeklyProgressStudent[]>({
    queryKey: ['/api/weekly-progress'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Import weekly progress data mutation
  const importMutation = useMutation({
    mutationFn: () => apiRequest('/api/import/weekly-progress', 'POST'),
    onSuccess: (data: any) => {
      toast({
        title: "Import Successful",
        description: data.message || "Weekly progress data imported successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/weekly-progress'] });
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: `Failed to import weekly progress data: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleImport = () => {
    importMutation.mutate();
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return "text-green-600 bg-green-50";
    if (value < 0) return "text-red-600 bg-red-50";
    return "text-muted-foreground bg-muted/40";
  };

  // Helper function to safely display numeric values
  const safeDisplayValue = (value: number | undefined | null): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return "0";
    }
    return value.toString();
  };

  // Sort data
  const sortedData = weeklyProgressData ? [...weeklyProgressData].sort((a, b) => {
    if (!a.student || !b.student) return 0;
    
    let aValue: number | string;
    let bValue: number | string;
    
    switch (sortBy) {
      case 'currentSolved':
        aValue = a.realTimeData?.currentSolved || 0;
        bValue = b.realTimeData?.currentSolved || 0;
        break;
      case 'newIncrement':
        aValue = a.realTimeData?.newIncrement || 0;
        bValue = b.realTimeData?.newIncrement || 0;
        break;
      case 'name':
        aValue = a.student.name;
        bValue = b.student.name;
        break;
      default:
        return 0;
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }
    
    const numA = aValue as number;
    const numB = bValue as number;
    return sortOrder === 'asc' ? numA - numB : numB - numA;
  }) : [];

  // Prepare chart data for top 10 students
  const chartData = sortedData.slice(0, 10).map(student => ({
    name: student.student?.name.split(' ')[0] || 'Unknown',
    Week1: student.weeklyData.week1,
    Week2: student.weeklyData.week2,
    Week3: student.weeklyData.week3,
    Week4: student.weeklyData.week4,
  }));

  // Calculate summary statistics
  const summaryStats = weeklyProgressData ? {
    totalStudents: weeklyProgressData.length,
    averageCurrentSolved: Math.round(weeklyProgressData.reduce((sum, s) => sum + (s.realTimeData?.currentSolved || 0), 0) / weeklyProgressData.length),
    averageNewIncrement: Math.round(weeklyProgressData.reduce((sum, s) => sum + (s.realTimeData?.newIncrement || 0), 0) / weeklyProgressData.length),
    positiveGrowthStudents: weeklyProgressData.filter(s => (s.realTimeData?.newIncrement || 0) > 0).length,
  } : null;

  if (isLoading) {
    return (
      <div className="page-container py-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading weekly progress data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Weekly Progress Analysis</h1>
          <p className="text-muted-foreground">Track weekly LeetCode progress from Week 1 to Week 4</p>
        </div>
        <Button onClick={handleImport} disabled={importMutation.isPending}>
          {importMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          Import Weekly Data
        </Button>
      </div>

      {/* Summary Statistics */}
      {summaryStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{safeDisplayValue(summaryStats.totalStudents)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Current Solved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{safeDisplayValue(summaryStats.averageCurrentSolved)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average New Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{safeDisplayValue(summaryStats.averageNewIncrement)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Students with New Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {safeDisplayValue(summaryStats.positiveGrowthStudents)}
                <span className="text-sm font-normal text-muted-foreground">
                  /{safeDisplayValue(summaryStats.totalStudents)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Progress Chart */}
      {chartData.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Top 10 Students - Weekly Progress Trend
            </CardTitle>
            <CardDescription>Weekly progress visualization for top performing students</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Week1" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="Week2" stroke="#82ca9d" strokeWidth={2} />
                <Line type="monotone" dataKey="Week3" stroke="#ffc658" strokeWidth={2} />
                <Line type="monotone" dataKey="Week4" stroke="#ff7300" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Weekly Progress Data</CardTitle>
              <CardDescription>Detailed weekly progress with incremental analysis</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="currentSolved">Current Solved</option>
                <option value="newIncrement">New Progress</option>
                <option value="name">Name</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-center">Week 1</TableHead>
                  <TableHead className="text-center">Week 2</TableHead>
                  <TableHead className="text-center">Week 3</TableHead>
                  <TableHead className="text-center">Week 4</TableHead>
                  <TableHead className="text-center">W2-W1</TableHead>
                  <TableHead className="text-center">W3-W2</TableHead>
                  <TableHead className="text-center">W4-W3</TableHead>
                  <TableHead className="text-center">Current</TableHead>
                  <TableHead className="text-center">New Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((studentData, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{studentData.student?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          @{studentData.student?.leetcodeUsername}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {safeDisplayValue(studentData.weeklyData.week1)}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {safeDisplayValue(studentData.weeklyData.week2)}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {safeDisplayValue(studentData.weeklyData.week3)}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {safeDisplayValue(studentData.weeklyData.week4)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className={getTrendColor(studentData.progressIncrements.week2Progress)}>
                        {getTrendIcon(studentData.progressIncrements.week2Progress)}
                        <span className="ml-1">{safeDisplayValue(studentData.progressIncrements.week2Progress)}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className={getTrendColor(studentData.progressIncrements.week3Progress)}>
                        {getTrendIcon(studentData.progressIncrements.week3Progress)}
                        <span className="ml-1">{safeDisplayValue(studentData.progressIncrements.week3Progress)}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className={getTrendColor(studentData.progressIncrements.week4Progress)}>
                        {getTrendIcon(studentData.progressIncrements.week4Progress)}
                        <span className="ml-1">{safeDisplayValue(studentData.progressIncrements.week4Progress)}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-bold text-primary">
                        {safeDisplayValue(studentData.realTimeData?.currentSolved)}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {studentData.realTimeData?.lastUpdated && studentData.realTimeData.lastUpdated !== 'No data' 
                          ? new Date(studentData.realTimeData.lastUpdated).toLocaleDateString()
                          : 'No data'}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant="outline" 
                        className={(studentData.realTimeData?.newIncrement || 0) > 0 ? "text-green-600 bg-green-50" : 
                                 (studentData.realTimeData?.newIncrement || 0) < 0 ? "text-red-600 bg-red-50" : "text-muted-foreground"}
                      >
                        {getTrendIcon(studentData.realTimeData?.newIncrement || 0)}
                        <span className="ml-1">{safeDisplayValue(studentData.realTimeData?.newIncrement)}</span>
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {weeklyProgressData?.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">No weekly progress data found.</p>
            <Button onClick={handleImport} disabled={importMutation.isPending}>
              {importMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Import Weekly Data
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}