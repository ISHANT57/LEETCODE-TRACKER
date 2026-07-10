import { Suspense, lazy } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SearchProvider } from "@/lib/search-context";
import { ThemeProvider } from "@/components/theme-provider";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/top-bar";
import { InstallPrompt } from "@/components/InstallPrompt";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import Login from "@/pages/login";

// Route-level code splitting — each page becomes its own chunk, cutting the
// initial JS bundle and improving first paint. UI is unchanged.
const StudentDashboard = lazy(() => import("@/pages/student-dashboard"));
const AdminDashboard = lazy(() => import("@/pages/admin-dashboard"));
const Leaderboard = lazy(() => import("@/pages/leaderboard"));
const StudentDirectory = lazy(() => import("@/pages/student-directory"));
const Compare = lazy(() => import("@/pages/compare"));
const RealTimeTracker = lazy(() => import("@/pages/real-time-tracker"));
const BadgesPage = lazy(() => import("@/pages/badges"));
const AnalyticsDashboard = lazy(() => import("@/pages/analytics-dashboard"));
const WeeklyProgressPage = lazy(() => import("@/pages/WeeklyProgressPage"));
const BatchDashboard = lazy(() => import("@/pages/batch-dashboard"));
const UniversityDashboard = lazy(() => import("@/pages/university-dashboard"));
const NotFound = lazy(() => import("@/pages/not-found"));

function PageFallback() {
  return (
    <div className="flex flex-1 items-center justify-center p-8" role="status" aria-label="Loading">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Switch>
        <Route path="/" component={StudentDirectory} />
        <Route path="/compare" component={Compare} />
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
    </Suspense>
  );
}

// The authenticated app shell. Only rendered once a session exists.
function AppShell() {
  return (
    <SearchProvider>
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar />
          <main className="flex flex-1 flex-col overflow-y-auto">
            <Router />
          </main>
        </div>
      </div>
    </SearchProvider>
  );
}

// Gate: whole app is behind login. While the session loads we show a spinner;
// with no session we show the Login page; otherwise the full dashboard.
function AuthGate() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background" role="status" aria-label="Loading">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  return session ? <AppShell /> : <Login />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <AuthGate />
          </AuthProvider>
          <Toaster />
          <InstallPrompt />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
