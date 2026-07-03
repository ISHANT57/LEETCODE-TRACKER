import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Bell,
  AlertTriangle,
  Trophy,
  Users,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { AdminDashboardData, AppSettings } from "@shared/schema";

interface Alert {
  id: string;
  title: string;
  detail: string;
  icon: React.ReactNode;
  tone: string;
  href?: string;
}

function timeAgo(value?: string | Date | null): string | null {
  if (!value) return null;
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return null;
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsMenu() {
  const [, navigate] = useLocation();

  const { data: admin } = useQuery<AdminDashboardData>({
    queryKey: ["/api/dashboard/admin"],
  });
  const { data: settings } = useQuery<AppSettings>({
    queryKey: ["/api/settings"],
  });

  const alerts: Alert[] = [];

  if (admin) {
    if (admin.underperforming > 0) {
      alerts.push({
        id: "at-risk",
        title: `${admin.underperforming} students need attention`,
        detail: "Underperforming this cycle — review progress",
        icon: <AlertTriangle size={16} />,
        tone: "text-red-600 bg-red-500/10",
        href: "/university",
      });
    }
    const top = admin.leaderboard?.[0];
    if (top) {
      alerts.push({
        id: "top",
        title: `${top.student.name} is leading`,
        detail: `${top.weeklyScore} problems solved`,
        icon: <Trophy size={16} />,
        tone: "text-amber-600 bg-amber-500/10",
        href: "/leaderboard",
      });
    }
    alerts.push({
      id: "active",
      title: `${admin.activeStudents} of ${admin.totalStudents} students active`,
      detail: "Engagement across all batches",
      icon: <Users size={16} />,
      tone: "text-emerald-600 bg-emerald-500/10",
      href: "/",
    });
  }

  const synced = timeAgo(settings?.lastSyncTime as any);
  if (synced) {
    alerts.push({
      id: "sync",
      title: "Data synced",
      detail: `Last updated ${synced}`,
      icon: <RefreshCw size={16} />,
      tone: "text-blue-600 bg-blue-500/10",
      href: "/admin",
    });
  }

  const count = alerts.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Notifications (${count})`}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Bell size={18} />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          <span className="text-xs text-muted-foreground">{count} active</span>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {count === 0 && (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              <p className="text-sm text-muted-foreground">You're all caught up</p>
            </div>
          )}
          {alerts.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => a.href && navigate(a.href)}
              className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60"
            >
              <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${a.tone}`}>
                {a.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">{a.title}</span>
                <span className="block text-xs text-muted-foreground">{a.detail}</span>
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
