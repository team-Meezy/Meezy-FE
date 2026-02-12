'use client';

import { useRef } from 'react';
import { colors, typography } from '../../../../design';

export function AuthCodeInput({
  authCode,
  setAuthCode,
  generalError,
  setGeneralError,
}: {
  authCode: string;
  setAuthCode: (authCode: string) => void;
  generalError: string;
  setGeneralError: (generalError: string) => void;
}) {
  const LENGTH = 6;
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const handleChange = (index: number, char: string) => {
    if (!/^\d?$/.test(char)) return;

    const nextValue = authCode.padEnd(LENGTH, ' ').split('');
    nextValue[index] = char;
    setAuthCode(nextValue.join('').trimEnd());
    setGeneralError('');

    if (char && index < LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace' && !authCode[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between">
        {Array.from({ length: LENGTH }).map((_, index) => (
          <input
            key={index}
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={authCode[index] ?? ''}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className={`
              w-16 h-16
              rounded-lg
              text-center
              text-lg
              font-semibold
              outline-none
              ${
                generalError
                  ? 'ring-2 ring-red-500'
                  : 'focus:ring-2 focus:ring-orange-500'
              }
            `}
            style={{
              color: colors.white[100],
              backgroundColor: colors.gray[700],
              ...typography.body.LBodyM,
            }}
          />
        ))}
      </div>

      {generalError && (
        <div className="flex items-center gap-1 mt-1 -mb-6">
          {/* Error Icon */}
          <span className="text-red-500">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </span>

          {/* Error Text */}
          <span
            style={{
              ...typography.label.labelM,
              color: colors.system.error[500],
            }}
          >
            {generalError}
          </span>
        </div>
      )}
    </div>
  );
}
