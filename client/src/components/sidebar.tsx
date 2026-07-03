import { Link, useLocation } from "wouter";
import {
  Code2,
  Users,
  Trophy,
  Medal,
  Activity,
  BarChart3,
  TrendingUp,
  Building2,
  BookOpen,
  ShieldCheck,
  GitCompare,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    label: "Overview",
    items: [
      { name: "All Students", href: "/", icon: Users },
      { name: "Compare Students", href: "/compare", icon: GitCompare },
      { name: "University Dashboard", href: "/university", icon: Building2 },
    ],
  },
  {
    label: "Batches",
    items: [
      { name: "Batch 2027", href: "/batch/2027", icon: BookOpen },
      { name: "Batch 2028", href: "/batch/2028", icon: BookOpen },
    ],
  },
  {
    label: "Insights",
    items: [
      { name: "Real-Time Tracker", href: "/tracker", icon: Activity },
      { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
      { name: "Badges", href: "/badges", icon: Medal },
      { name: "Analytics", href: "/analytics", icon: BarChart3 },
      { name: "Weekly Progress", href: "/weekly-progress", icon: TrendingUp },
    ],
  },
  {
    label: "Manage",
    items: [{ name: "Admin Dashboard", href: "/admin", icon: Code2 }],
  },
];

function isActivePath(current: string, href: string): boolean {
  if (href === "/") return current === "/";
  return current === href || current.startsWith(href + "/");
}

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-900/30">
          <Code2 className="text-white" size={18} />
        </div>
        <div className="leading-tight">
          <h1 className="text-sm font-bold text-white tracking-tight">LeetCode Tracker</h1>
          <p className="text-[11px] text-slate-400">Batch Monitoring</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActivePath(location, item.href);
                return (
                  <Link key={item.name} href={item.href}>
                    <div
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all cursor-pointer",
                        active
                          ? "bg-primary text-white shadow-sm shadow-blue-900/40"
                          : "text-slate-300 hover:bg-sidebar-accent hover:text-white",
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-5 -translate-y-1/2 w-1 rounded-r-full bg-white/80" />
                      )}
                      <Icon
                        size={17}
                        className={cn(
                          "shrink-0 transition-colors",
                          active ? "text-white" : "text-slate-400 group-hover:text-white",
                        )}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/60 px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-slate-200">
            <ShieldCheck size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white">View Mode</p>
            <p className="text-[11px] text-slate-400 truncate">Read-only access</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
