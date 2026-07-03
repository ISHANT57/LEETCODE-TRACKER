import { type ReactNode } from "react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Tiny sparkline for stat cards. Theme-agnostic: only uses the passed accent
 * color plus a matching gradient fill, so it reads well in light and dark.
 */
export function MiniSpark({
  id,
  data,
  color,
  height = 44,
}: {
  id: string;
  data: number[];
  color: string;
  height?: number;
}) {
  const chartData = (data.length ? data : [0, 0]).map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={2}
          fill={`url(#spark-${id})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface StatSparkCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: ReactNode;
  /** Tailwind classes for the icon chip, e.g. "text-blue-600 bg-blue-500/10". */
  accent: string;
  /** Hex/hsl color for the sparkline stroke. */
  sparkColor: string;
  sparkId: string;
  sparkData: number[];
  className?: string;
}

/** KPI tile with a colored icon chip and a sparkline footer. */
export function StatSparkCard({
  label,
  value,
  hint,
  icon,
  accent,
  sparkColor,
  sparkId,
  sparkData,
  className,
}: StatSparkCardProps) {
  return (
    <Card className={cn("overflow-hidden p-5 shadow-soft border-border/70", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            accent,
          )}
        >
          {icon}
        </div>
      </div>
      <div className="mt-3 -mx-1">
        <MiniSpark id={sparkId} data={sparkData} color={sparkColor} />
      </div>
    </Card>
  );
}

/**
 * Circular progress gauge (SVG). The track uses a translucent slate so it
 * works in both themes; the progress arc uses the accent color.
 */
export function RadialGauge({
  value,
  color,
  size = 92,
  stroke = 9,
  children,
}: {
  value: number;
  color: string;
  size?: number;
  stroke?: number;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  const offset = c - (v / 100) * c;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgb(148 163 184 / 0.22)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

/** A gauge + label block used in the Performance Overview grid. */
export function GaugeCard({
  title,
  subtitle,
  value,
  display,
  color,
  icon,
  badge,
}: {
  title: string;
  subtitle?: string;
  value: number;
  display: ReactNode;
  color: string;
  icon?: ReactNode;
  badge?: { text: string; className: string };
}) {
  return (
    <Card className="p-5 shadow-soft border-border/70">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {icon}
          {title}
        </div>
        {badge && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-medium",
              badge.className,
            )}
          >
            {badge.text}
          </span>
        )}
      </div>
      <div className="flex items-center gap-4">
        <RadialGauge value={value} color={color}>
          <span className="text-lg font-bold text-foreground">{display}</span>
        </RadialGauge>
        {subtitle && (
          <p className="text-sm text-muted-foreground leading-snug">{subtitle}</p>
        )}
      </div>
    </Card>
  );
}
