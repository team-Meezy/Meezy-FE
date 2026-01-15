export const ParticipationChart = ({ percentage = 87.5 }) => {
  // SVG 원주 계산 (2 * PI * r)
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-48 h-48">
      {/* 배경 원 (어두운 회색 부분) */}
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="96"
          cy="96"
          r={radius}
          stroke="#333"
          strokeWidth="24"
          fill="transparent"
        />
        {/* 실제 진행률 원 (오렌지색 부분) */}
        <circle
          cx="96"
          cy="96"
          r={radius}
          stroke="#ff5c00"
          strokeWidth="24"
          fill="transparent"
          strokeDasharray={circumference}
          style={{
            strokeDashoffset,
            transition: 'stroke-dashoffset 0.5s ease',
          }}
          strokeLinecap="round"
        />
      </svg>
      {/* 중앙 텍스트 */}
      <span className="absolute text-3xl font-bold text-[#ff5c00]">
        {percentage}%
      </span>
    </div>
  );
};
