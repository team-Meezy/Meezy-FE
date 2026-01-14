import { useEffect, useState } from 'react';
import { colors } from '@meezy/ui';

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
    setRemainingTime(180);

    const timer = setInterval(() => {
      setRemainingTime((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (remainingTime <= 0) {
      setRemainingTime(0);
    }
  }, [remainingTime]);

  return {
    remainingTime,
    formattedTime: formatTime(remainingTime),
  };
}
