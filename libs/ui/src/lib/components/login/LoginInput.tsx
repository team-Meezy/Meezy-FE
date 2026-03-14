import { useState } from 'react';
import { colors, typography } from '../../../design';

interface LoginInputProps {
  label: string;
  name: string;
  id: string;
  type?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  error?: boolean;
  errorMessage?: string;
}

export const LoginInput = ({
  label,
  name,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  errorMessage,
}: LoginInputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        style={{ color: colors.gray[400], ...typography.body.BodyM }}
      >
        {label}
      </label>
      <div className="relative w-full">
        <input
          id={id}
          name={name}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            color: colors.gray[500],
            backgroundColor: colors.gray[900],
            ...typography.body.BodyM,
          }}
          className={`w-full rounded-lg p-4 pr-12 outline-none ring-1 focus:ring-orange-500 ${
            error ? 'ring-red-500' : 'ring-gray-700'
          }`}
        />
        {isPassword && value && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center"
            aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
          >
            {showPassword ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 5C7 5 2.73 8.11 1 12.5C2.73 16.89 7 20 12 20C17 20 21.27 16.89 23 12.5C21.27 8.11 17 5 12 5ZM12 17.5C9.24 17.5 7 15.26 7 12.5C7 9.74 9.24 7.5 12 7.5C14.76 7.5 17 9.74 17 12.5C17 15.26 14.76 17.5 12 17.5ZM12 9.5C10.34 9.5 9 10.84 9 12.5C9 14.16 10.34 15.5 12 15.5C13.66 15.5 15 14.16 15 12.5C15 10.84 13.66 9.5 12 9.5Z"
                  fill={colors.gray[600]}
                />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 7.5C14.76 7.5 17 9.74 17 12.5C17 13.28 16.83 14.02 16.53 14.68L19.43 17.58C21.07 16.13 22.42 14.31 23 12.5C21.27 8.11 17 5 12 5C10.73 5 9.51 5.2 8.36 5.57L10.53 7.74C11.19 7.44 11.93 7.5 12 7.5ZM2 4.77L4.28 7.05C2.61 8.5 1.27 10.33 1 12.5C2.73 16.89 7 20 12 20C13.55 20 15.03 19.7 16.38 19.18L19.73 22.53L21.5 20.76L3.77 3.03L2 4.77ZM7.53 10.3L9.06 11.83C9.03 12.05 9 12.27 9 12.5C9 14.16 10.34 15.5 12 15.5C12.23 15.5 12.45 15.47 12.67 15.44L14.2 16.97C13.53 17.3 12.79 17.5 12 17.5C9.24 17.5 7 15.26 7 12.5C7 11.71 7.2 10.97 7.53 10.3Z"
                  fill={colors.gray[600]}
                />
              </svg>
            )}
          </button>
        )}
      </div>
      {error && (
        <div className="flex items-center gap-1 mt-1">
          <span className="text-red-500">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </span>
          <p
            className="text-red-500 text-sm"
            style={{ ...typography.body.BodyM }}
          >
            {errorMessage}
          </p>
        </div>
      )}
    </div>
  );
};
