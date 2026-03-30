interface ParticipationChartProps {
  percentage?: number;
  size?: number;
  labelClassName?: string;
}

export const ParticipationChart = ({
  percentage = 87.5,
  size = 192,
  labelClassName = '',
}: ParticipationChartProps) => {
  const strokeWidth = size * 0.13;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#323232"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#ff5c00"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="butt"
          style={{
            transition: 'stroke-dashoffset 0.5s ease',
          }}
        />
      </svg>

      <span
        className={`absolute font-bold tracking-[-0.03em] text-[#ff5c00] ${labelClassName}`}
        style={{ fontSize: size * 0.16 }}
      >
        {percentage}%
      </span>
    </div>
  );
};
