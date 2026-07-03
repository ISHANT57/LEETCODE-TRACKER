interface ScoreGaugeProps {
  value: number; // 0–100
  size?: number;
  label?: string;
}

/** Circular gauge (0–100) with a color that reflects the score band. */
export default function ScoreGauge({ value, size = 96, label }: ScoreGaugeProps) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (v / 100) * c;
  const color =
    v >= 80 ? 'hsl(160,84%,39%)' : v >= 60 ? 'hsl(38,92%,50%)' : 'hsl(0,72%,51%)';
  const band = v >= 80 ? 'Excellent' : v >= 60 ? 'Good' : 'Needs work';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(214,32%,91%)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-foreground leading-none">{v}</span>
        <span className="text-[10px] text-muted-foreground">{label ?? '/100'}</span>
      </div>
      <span className="sr-only">{band}</span>
    </div>
  );
}
