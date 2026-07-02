import { useQuery } from "@tanstack/react-query";
import { Trophy, Medal, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminDashboardData } from "@shared/schema";

export default function Leaderboard() {
  const { data, isLoading, error } = useQuery<AdminDashboardData['leaderboard']>({
    queryKey: ['/api/leaderboard'],
  });

  if (error) {
    return (
      <div className="flex-1 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error loading leaderboard</h3>
          <p className="text-red-600 text-sm mt-1">Failed to load leaderboard data.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex-1 p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-yellow-800 font-medium">No leaderboard data</h3>
          <p className="text-yellow-600 text-sm mt-1">No student progress data available yet.</p>
        </div>
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="text-yellow-500" size={20} />;
    if (rank === 2) return <Medal className="text-slate-400" size={20} />;
    if (rank === 3) return <Award className="text-amber-600" size={20} />;
    return <span className="font-bold text-slate-600">{rank}</span>;
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200';
    if (rank === 2) return 'bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200';
    if (rank === 3) return 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200';
    return 'bg-slate-50 border-slate-200';
  };

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Leaderboard</h2>
          <p className="text-sm text-slate-500">Weekly performance rankings</p>
        </div>
      </header>

      {/* Leaderboard Content */}
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="text-yellow-500" size={24} />
              Weekly Champions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.map((entry) => (
                <div 
                  key={entry.student.id}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-all hover:shadow-md ${getRankStyle(entry.rank)}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 flex items-center justify-center">
                      {getRankIcon(entry.rank)}
                    </div>
                    <img 
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=40&h=40"
                      alt="Student" 
                      className="w-10 h-10 rounded-full object-cover" 
                    />
                    <div>
                      <p className="font-semibold text-slate-900 text-lg">{entry.student.name}</p>
                      <p className="text-sm text-slate-500">@{entry.student.leetcodeUsername}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900">+{entry.weeklyScore}</p>
                    <p className="text-sm text-slate-500">problems this week</p>
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
