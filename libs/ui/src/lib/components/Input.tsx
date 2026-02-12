'use client';

import { useState, InputHTMLAttributes, forwardRef } from 'react';
import { colors, typography } from '../../design';

/**
 * Input 컴포넌트의 타입
 */
export type InputType = 'email' | 'password' | 'text';

/**
 * Input 컴포넌트의 Props
 */
export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Input 필드 타입 */
  type?: InputType;
  /** 라벨 텍스트 */
  label?: string;
  /** 에러 메시지 */
  error?: string;
  /** 비밀번호 표시/숨김 기능 활성화 (type="password"일 때만) */
  showPasswordToggle?: boolean;
}

/**
 * 모행 디자인 시스템 - Input 컴포넌트
 *
 * @example
 * ```tsx
 * // 기본 이메일 입력
 * <Input
 *   type="email"
 *   label="이메일"
 *   placeholder="example@email.com"
 * />
 *
 * // 에러 상태
 * <Input
 *   type="email"
 *   label="이메일"
 *   value="ddd@email.com"
 *   error="이메일 형식이 올바르지 않습니다."
 * />
 *
 * // 비밀번호 입력 (토글 기능)
 * <Input
 *   type="password"
 *   label="비밀번호"
 *   placeholder="비밀번호를 입력해주세요."
 *   showPasswordToggle
 * />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type = 'text',
      label,
      error,
      showPasswordToggle = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    return (
      <div className={`flex flex-col gap-3 ${className}`}>
        {/* Label */}
        {label && (
          <label
            htmlFor={props.id}
            style={{
              ...typography.body.BodyM,
              color: colors.gray[400],
            }}
          >
            {label}
          </label>
        )}

        {/* Input Field */}
        <div className="relative" style={{ position: 'relative' }}>
          <input
            ref={ref}
            type={inputType}
            {...props}
            className="w-full px-4 py-4 pr-12 rounded-lg border outline-none"
            style={{
              ...typography.body.BodyM,
              backgroundColor: colors.gray[900],
              borderColor: error ? colors.system.error[500] : colors.gray[800],
              color: props.value ? colors.gray[100] : colors.gray[500],
            }}
          />

          {/* Password Toggle Icon */}
          {isPassword && showPasswordToggle && props.value && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center"
              style={{
                position: 'absolute',
                top: '50%',
                right: '12px',
                transform: 'translateY(-50%)',
              }}
              aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
            >
              {showPassword ? (
                // Eye Icon (Show)
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 5C7 5 2.73 8.11 1 12.5C2.73 16.89 7 20 12 20C17 20 21.27 16.89 23 12.5C21.27 8.11 17 5 12 5ZM12 17.5C9.24 17.5 7 15.26 7 12.5C7 9.74 9.24 7.5 12 7.5C14.76 7.5 17 9.74 17 12.5C17 15.26 14.76 17.5 12 17.5ZM12 9.5C10.34 9.5 9 10.84 9 12.5C9 14.16 10.34 15.5 12 15.5C13.66 15.5 15 14.16 15 12.5C15 10.84 13.66 9.5 12 9.5Z"
                    fill={colors.gray[800]}
                  />
                </svg>
              ) : (
                // Eye Slash Icon (Hide)
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 7.5C14.76 7.5 17 9.74 17 12.5C17 13.28 16.83 14.02 16.53 14.68L19.43 17.58C21.07 16.13 22.42 14.31 23 12.5C21.27 8.11 17 5 12 5C10.73 5 9.51 5.2 8.36 5.57L10.53 7.74C11.19 7.44 11.93 7.5 12 7.5ZM2 4.77L4.28 7.05C2.61 8.5 1.27 10.33 1 12.5C2.73 16.89 7 20 12 20C13.55 20 15.03 19.7 16.38 19.18L19.73 22.53L21.5 20.76L3.77 3.03L2 4.77ZM7.53 10.3L9.06 11.83C9.03 12.05 9 12.27 9 12.5C9 14.16 10.34 15.5 12 15.5C12.23 15.5 12.45 15.47 12.67 15.44L14.2 16.97C13.53 17.3 12.79 17.5 12 17.5C9.24 17.5 7 15.26 7 12.5C7 11.71 7.2 10.97 7.53 10.3Z"
                    fill={colors.gray[800]}
                  />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-1 mt-1">
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
              {error}
            </span>
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
