import { colors, typography } from '../design';

export function CalendarMockup() {
  const days = [
    { label: 'S', value: 0 },
    { label: 'M', value: 1 },
    { label: 'T', value: 2 },
    { label: 'W', value: 3 },
    { label: 'T', value: 4 },
    { label: 'F', value: 5 },
    { label: 'S', value: 6 },
  ];

  const year = 2024;
  const month = 9; // 10월

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarDays: { day: number; type: 'prev' | 'current' | 'next' }[] = [];

  // 저번 달
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarDays.push({ day: daysInPrevMonth - i, type: 'prev' });
  }

  // 이번 달
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ day: i, type: 'current' });
  }

  // 다음 달
  while (calendarDays.length % 7 !== 0) {
    calendarDays.push({
      day: calendarDays.length - (firstDayOfMonth + daysInMonth) + 1,
      type: 'next',
    });
  }

  return (
    <div
      className="p-5 rounded-lg"
      style={{ backgroundColor: colors.gray[900] }}
    >
      <div className="mb-4" style={{ ...typography.body.BodyB }}>
        10월
      </div>

      <div className="grid grid-cols-7 gap-y-3 text-center text-sm">
        {days.map((day) => (
          <div key={day.value} className="text-gray-500 font-medium mb-2">
            {day.label}
          </div>
        ))}

        {calendarDays.map((date, i) => (
          <div
            key={i}
            className={`py-1 rounded-md cursor-pointer transition-colors mb-2
              ${date.type === 'current' ? 'hover:bg-gray-700' : 'text-gray-500'}
            `}
          >
            {date.day}
          </div>
        ))}
      </div>
    </div>
  );
}
