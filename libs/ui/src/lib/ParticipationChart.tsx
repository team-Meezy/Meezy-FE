interface ParticipationChartProps {
  percentage?: number;
  size?: number; // 차트 전체 크기
}

export const ParticipationChart = ({
  percentage = 87.5,
  size = 192, // 기본값 (w-48 = 192px)
}: ParticipationChartProps) => {
  const strokeWidth = size * 0.12; // 두께 비율
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
        {/* 배경 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#333"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* 진행률 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#ff5c00"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.5s ease',
          }}
        />
      </svg>

      {/* 중앙 텍스트 */}
      <span
        className="absolute font-bold text-[#ff5c00]"
        style={{ fontSize: size * 0.18 }}
      >
        {percentage}%
      </span>
    </div>
  );
};
