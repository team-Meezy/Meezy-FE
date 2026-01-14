export function CalendarMockup() {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  // 10월 예시 데이터
  return (
    <div>
      <div className="text-lg font-bold mb-4">10월</div>
      <div className="grid grid-cols-7 gap-y-3 text-center text-sm">
        {days.map((d, item) => (
          <div key={item} className="text-gray-500 font-medium">
            {d}
          </div>
        ))}
        {/* 날짜 데이터 루프... */}
        {Array.from({ length: 31 }).map((_, i) => (
          <div
            key={i}
            className="py-1 hover:bg-gray-700 rounded-md cursor-pointer transition-colors"
          >
            {i + 1}
          </div>
        ))}
      </div>
    </div>
  );
}
