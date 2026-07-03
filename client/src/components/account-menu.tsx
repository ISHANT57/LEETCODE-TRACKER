import { useLocation } from "wouter";
import { ShieldCheck, LayoutDashboard, BarChart3, Activity } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AccountMenu() {
  const [, navigate] = useLocation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-sm font-semibold text-white outline-none ring-primary/30 transition-shadow focus-visible:ring-2"
        >
          A
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ShieldCheck size={15} />
          </span>
          <span>
            <span className="block text-sm font-semibold">View Mode</span>
            <span className="block text-xs font-normal text-muted-foreground">
              Read-only access
            </span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/admin")}>
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Admin Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/analytics")}>
          <BarChart3 className="mr-2 h-4 w-4" />
          Analytics
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/tracker")}>
          <Activity className="mr-2 h-4 w-4" />
          Real-Time Tracker
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
