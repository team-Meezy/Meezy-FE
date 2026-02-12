'use client';

import { useEffect, SetStateAction, Dispatch } from 'react';
import { colors } from '../design';

interface TimeParams {
  remainingTime: number;
  setRemainingTime: Dispatch<SetStateAction<number>>;
}

const initialTime = 180;

export function useTime({ remainingTime, setRemainingTime }: TimeParams) {
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
  }, [remainingTime === initialTime, setRemainingTime]);

  return {
    remainingTime,
    formattedTime: formatTime(remainingTime),
  };
}
