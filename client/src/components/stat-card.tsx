import { type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  /** Small helper text under the value (e.g. "+12 this week"). */
  hint?: ReactNode;
  /** Tailwind color accent for the icon chip, e.g. "text-blue-600 bg-blue-50". */
  accent?: string;
  className?: string;
}

/** Compact KPI tile used at the top of dashboards. */
export default function StatCard({
  label,
  value,
  icon,
  hint,
  accent = "text-primary bg-primary/10",
  className,
}: StatCardProps) {
  return (
    <Card className={cn("p-4 shadow-soft border-border/70", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">{value}</p>
          {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {icon && (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              accent,
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
