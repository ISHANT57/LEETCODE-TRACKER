import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Search, Bell, ChevronRight } from "lucide-react";
import { useGlobalSearch } from "@/lib/search-context";
import ThemeToggle from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

// Human-readable breadcrumb trail derived from the current route.
function crumbsFor(path: string): string[] {
  if (path === "/") return ["Dashboard", "Students"];
  if (path.startsWith("/student/")) return ["Dashboard", "Students", "Profile"];
  if (path.startsWith("/batch/")) return ["Dashboard", "Batches", path.split("/")[2] ?? ""];
  const map: Record<string, string> = {
    "/compare": "Compare",
    "/university": "University",
    "/leaderboard": "Leaderboard",
    "/tracker": "Real-Time Tracker",
    "/badges": "Badges",
    "/analytics": "Analytics",
    "/weekly-progress": "Weekly Progress",
    "/admin": "Admin",
  };
  return ["Dashboard", map[path] ?? "Overview"];
}

export default function TopBar() {
  const [location, navigate] = useLocation();
  const { query, setQuery } = useGlobalSearch();
  const inputRef = useRef<HTMLInputElement>(null);
  const crumbs = crumbsFor(location);

  // Cmd/Ctrl+K focuses global search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (location !== "/") navigate("/");
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [location, navigate]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
      {/* Breadcrumb */}
      <nav className="hidden items-center gap-1.5 text-sm md:flex">
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />}
            <span
              className={cn(
                i === crumbs.length - 1
                  ? "font-medium text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {c}
            </span>
          </span>
        ))}
      </nav>

      {/* Search */}
      <div className="relative ml-auto w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (location !== "/") navigate("/");
          }}
          placeholder="Search students by name or username…"
          className="h-9 w-full rounded-lg border border-border bg-muted/50 pl-9 pr-14 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/40 focus:bg-card focus:ring-2 focus:ring-primary/10"
        />
        <kbd className="absolute right-2.5 top-1/2 hidden -translate-y-1/2 items-center rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:flex">
          Ctrl K
        </kbd>
      </div>

      {/* Theme toggle */}
      <ThemeToggle />

      {/* Notifications (decorative — no live feed yet) */}
      <button
        type="button"
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Bell className="h-4.5 w-4.5" size={18} />
      </button>

      {/* Account */}
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-sm font-semibold text-white">
        A
      </div>
    </header>
  );
}
