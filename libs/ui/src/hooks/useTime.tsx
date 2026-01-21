import { useEffect, useState } from 'react';
import { colors } from '../design';

export function useTime() {
  const [remainingTime, setRemainingTime] = useState(180);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return (
      <span style={{ fontWeight: 'bold', color: colors.primary[500] }}>
        {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
      </span>
    );
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return {
    remainingTime,
    formattedTime: formatTime(remainingTime),
  };
}
