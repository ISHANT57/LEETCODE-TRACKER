import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Flame } from "lucide-react";
import { STATUS_COLORS } from "@/lib/constants";
import type { AdminDashboardData } from "@shared/schema";

interface StudentTableProps {
  data: AdminDashboardData;
}

export default function StudentTable({ data }: StudentTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>LeetCode Profile</TableHead>
            <TableHead>Total Solved</TableHead>
            <TableHead>LeetCode Ranking</TableHead>
            <TableHead>This Week</TableHead>
            <TableHead>Streak</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.students.slice(0, 10).map((student) => (
            <TableRow key={student.id}>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <img 
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=32&h=32"
                    alt="Student avatar" 
                    className="w-8 h-8 rounded-full object-cover" 
                  />
                  <span className="font-medium text-slate-900">{student.name}</span>
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
              <TableCell className="font-semibold">{student.stats.totalSolved}</TableCell>
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
                <Badge 
                  className={STATUS_COLORS[student.status as keyof typeof STATUS_COLORS]}
                  variant="outline"
                >
                  {student.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="sm">
                  View Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
