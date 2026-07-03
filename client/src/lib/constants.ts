export const DIFFICULTY_COLORS = {
  easy: 'hsl(142, 76%, 36%)',
  medium: 'hsl(38, 92%, 50%)',
  hard: 'hsl(0, 84%, 60%)',
} as const;

export const BADGE_TYPES = {
  streak_master: {
    title: '🧐 Streak Master',
    description: '7-day streak of 5+ daily problems',
    icon: 'fas fa-fire',
    gradient: 'from-orange-400 to-red-500',
    emoji: '🧐'
  },
  century_coder: {
    title: '💯 Century Coder',
    description: '100+ total problems solved',
    icon: 'fas fa-code',
    gradient: 'from-green-400 to-emerald-500',
    emoji: '💯'
  },
  comeback_coder: {
    title: '🔥 Comeback Coder',
    description: 'Big week-over-week improvement',
    icon: 'fas fa-chart-line',
    gradient: 'from-purple-400 to-pink-500',
    emoji: '🔥'
  },
  weekly_topper: {
    title: '🏆 Weekly Topper',
    description: 'Top performer this week',
    icon: 'fas fa-trophy',
    gradient: 'from-yellow-400 to-orange-500',
    emoji: '🏆'
  },
  consistency_champ: {
    title: '🧱 Consistency Champ',
    description: 'Completed 30-day challenge',
    icon: 'fas fa-calendar-check',
    gradient: 'from-blue-400 to-indigo-500',
    emoji: '🧱'
  }
} as const;

// Status pill styles — translucent accents that read well in light and dark.
export const STATUS_COLORS = {
  'Excellent': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  'Good': 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  'Active': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  'Underperforming': 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  'inactive': 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
} as const;

// Neutral chart chrome that works on both themes without JS. Grid/axis use a
// mid slate that stays legible on light and dark backgrounds; the tooltip
// reads its surface from the theme tokens.
export const CHART_AXIS = { fill: '#94a3b8', fontSize: 12 } as const;
export const CHART_GRID = { stroke: '#94a3b8', strokeOpacity: 0.2 } as const;
export const CHART_TOOLTIP_STYLE = {
  borderRadius: 10,
  border: '1px solid var(--border)',
  background: 'var(--popover)',
  color: 'var(--popover-foreground)',
  fontSize: 12,
  boxShadow: '0 4px 24px rgba(15,23,42,0.12)',
} as const;
