import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import StudentAvatar from '@/components/student-avatar';
import PageHeader from '@/components/page-header';
import StatCard from '@/components/stat-card';
import { useState } from 'react';
import { Search, Trophy, TrendingUp, Users, Flame, ChevronRight } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  leetcodeUsername: string;
  leetcodeProfileLink: string;
  profilePhoto?: string;
  githubUsername?: string | null;
  createdAt: string;
}

interface StudentWithStats extends Student {
  stats: {
    totalSolved: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    ranking: number;
  };
  weeklyProgress: number;
  status: string;
  streak: number;
}

function statusStyle(status: string) {
  switch (status) {
    case 'Excellent':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Active':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Underperforming':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

export default function StudentDirectory() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: students, isLoading } = useQuery<StudentWithStats[]>({
    queryKey: ['/api/students/all'],
  });

  const filteredStudents =
    students?.filter(
      (student) =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.leetcodeUsername.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || [];

  const totalStudents = students?.length ?? 0;
  const totalSolved =
    students?.reduce((sum, s) => sum + (s.stats?.totalSolved || 0), 0) ?? 0;
  const activeThisWeek =
    students?.filter((s) => (s.weeklyProgress || 0) > 0).length ?? 0;
  const topSolver = students
    ?.slice()
    .sort((a, b) => (b.stats?.totalSolved || 0) - (a.stats?.totalSolved || 0))[0];

  return (
    <div>
      <PageHeader
        icon={<Users size={20} />}
        title="Student Directory"
        description={`Browse all ${totalStudents} students and their progress`}
      />

      <div className="page-container py-6 space-y-6">
        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Students"
            value={isLoading ? '—' : totalStudents}
            icon={<Users size={18} />}
          />
          <StatCard
            label="Problems Solved"
            value={isLoading ? '—' : totalSolved.toLocaleString()}
            icon={<Trophy size={18} />}
            accent="text-amber-600 bg-amber-50"
          />
          <StatCard
            label="Active This Week"
            value={isLoading ? '—' : activeThisWeek}
            icon={<TrendingUp size={18} />}
            accent="text-emerald-600 bg-emerald-50"
          />
          <StatCard
            label="Top Solver"
            value={isLoading ? '—' : topSolver?.stats?.totalSolved ?? 0}
            hint={topSolver?.name}
            icon={<Flame size={18} />}
            accent="text-orange-600 bg-orange-50"
          />
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or LeetCode username…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 bg-card"
          />
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <Card key={i} className="h-44 animate-pulse bg-muted/40" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredStudents.map((student, i) => (
              <Link key={student.id} href={`/student/${student.leetcodeUsername}`}>
                <Card
                  className="group h-full cursor-pointer border-border/70 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-soft-lg animate-fade-in"
                  style={{ animationDelay: `${Math.min(i, 12) * 20}ms` }}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <StudentAvatar
                          name={student.name}
                          githubUsername={student.githubUsername}
                          profilePhoto={student.profilePhoto}
                          size={48}
                          className="ring-2 ring-primary/10"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">
                            {student.name}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            @{student.leetcodeUsername}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`shrink-0 ${statusStyle(student.status)}`}
                      >
                        {student.status}
                      </Badge>
                    </div>

                    <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Trophy className="h-4 w-4 text-amber-500" />
                        Total Solved
                      </div>
                      <span className="text-lg font-bold text-foreground">
                        {student.stats.totalSolved}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-lg bg-emerald-50 py-2">
                        <div className="font-bold text-emerald-700">
                          {student.stats.easySolved}
                        </div>
                        <div className="text-emerald-600">Easy</div>
                      </div>
                      <div className="rounded-lg bg-amber-50 py-2">
                        <div className="font-bold text-amber-700">
                          {student.stats.mediumSolved}
                        </div>
                        <div className="text-amber-600">Medium</div>
                      </div>
                      <div className="rounded-lg bg-red-50 py-2">
                        <div className="font-bold text-red-700">
                          {student.stats.hardSolved}
                        </div>
                        <div className="text-red-600">Hard</div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-sm">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                        +{student.weeklyProgress} this week
                      </span>
                      <span className="flex items-center gap-0.5 font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                        View <ChevronRight className="h-4 w-4" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {filteredStudents.length === 0 && !isLoading && (
          <div className="py-16 text-center">
            <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold">No students found</h3>
            <p className="text-muted-foreground">Try adjusting your search term.</p>
          </div>
        )}
      </div>
    </div>
  );
}
