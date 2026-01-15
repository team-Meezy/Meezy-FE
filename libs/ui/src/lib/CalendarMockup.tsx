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
  const today = new Date();

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
        {`${year}년 ${month + 1}월`}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map((day) => (
          <div
            key={day.value}
            className="text-gray-500 mb-1 flex items-center justify-center w-6 h-6"
            style={{
              ...typography.body.BodyM,
            }}
          >
            <span
              className={day.label === 'S' ? 'text-gray-500' : 'text-white'}
            >
              {day.label}
            </span>
          </div>
        ))}

        {calendarDays.map((date, i) => (
          <div
            key={i}
            className={`py-1 rounded-full mb-1 flex justify-center items-center cursor-pointer transition-colors flex-col w-6 h-6
              ${
                date.type === 'current'
                  ? 'hover:bg-[#0760EE66]'
                  : 'text-gray-500'
              }
            `}
            style={{
              ...typography.body.BodyM,
            }}
          >
            {date.day === today.getDate() && date.type === 'current' ? (
              <span
                className="flex flex-col justify-center items-center rounded-full py-1 w-6 h-6"
                style={{ backgroundColor: colors.primary[500] }}
              >
                {date.day}
              </span>
            ) : (
              <span className="flex flex-col justify-center items-center w-6 h-6">
                {date.day}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
