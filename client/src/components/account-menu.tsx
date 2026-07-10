import { useLocation } from "wouter";
import { LayoutDashboard, BarChart3, Activity, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
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
  const { user, signOut } = useAuth();

  const email = user?.email ?? "";
  const initial = (email[0] ?? "U").toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="min-touch flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-sm font-semibold text-white outline-none ring-primary/30 transition-shadow focus-visible:ring-2"
        >
          {initial}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {initial}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold">Signed in</span>
            <span className="block truncate text-xs font-normal text-muted-foreground">
              {email || "Authenticated user"}
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
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
