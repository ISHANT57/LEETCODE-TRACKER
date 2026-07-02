import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  /** Right-aligned actions (buttons, filters). */
  actions?: ReactNode;
  className?: string;
}

/**
 * Consistent page header used across dashboards: sticky, translucent bar with
 * an optional icon, title/description block, and right-aligned actions.
 */
export default function PageHeader({
  title,
  description,
  icon,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-muted-foreground truncate">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </header>
  );
}
