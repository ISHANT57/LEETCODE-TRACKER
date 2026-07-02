import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Sidebar from "@/components/sidebar";
import StudentDashboard from "@/pages/student-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import Leaderboard from "@/pages/leaderboard";
import StudentDirectory from "@/pages/student-directory";
import RealTimeTracker from "@/pages/real-time-tracker";
import BadgesPage from "@/pages/badges";
import AnalyticsDashboard from "@/pages/analytics-dashboard";
import WeeklyProgressPage from "@/pages/WeeklyProgressPage";
import BatchDashboard from "@/pages/batch-dashboard";
import UniversityDashboard from "@/pages/university-dashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={StudentDirectory} />
      <Route path="/student/:username" component={StudentDashboard} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/university" component={UniversityDashboard} />
      <Route path="/batch/:batch" component={BatchDashboard} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/tracker" component={RealTimeTracker} />
      <Route path="/badges" component={BadgesPage} />
      <Route path="/analytics" component={AnalyticsDashboard} />
      <Route path="/weekly-progress" component={WeeklyProgressPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="flex h-screen overflow-hidden bg-background text-foreground">
          <Sidebar />
          <main className="flex flex-1 flex-col overflow-y-auto">
            <Router />
          </main>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
