interface RingChartProps {
  value: number;
  max: number;
  color: string;
  size?: number;
  label: string;
  sublabel?: string;
}

export default function RingChart({
  value,
  max,
  color,
  size = 80,
  label,
  sublabel,
}: RingChartProps) {
  const sw = size <= 68 ? 5 : 7;
  const r = (size - sw) / 2 - 2;
  const circumference = 2 * Math.PI * r;
  const filled = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = circumference * (1 - filled);
  const c = size / 2;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="#1f2937" strokeWidth={sw} />
        {filled > 0 && (
          <circle
            cx={c} cy={c} r={r}
            fill="none"
            stroke={color}
            strokeWidth={sw}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${c} ${c})`}
            style={{ transition: "stroke-dashoffset 0.4s ease" }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none gap-0.5">
        <span className="text-white font-bold" style={{ fontSize: size <= 68 ? 11 : 15 }}>
          {label}
        </span>
        {sublabel && (
          <span className="text-gray-500" style={{ fontSize: size <= 68 ? 8 : 10 }}>
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
