'use client';

import { colors, typography } from '../../design';
import {
  EmailInput,
  AuthCodeInput,
  IdInput,
  NameInput,
  PasswordInput,
  Success,
} from '../components';
import { useSignupFlow, useTime, useTokenCheck } from '../../hooks';
import { SignupHeader, SignupGuideText, SignupNavigation } from '../components';
import { useSignupStore, useTimeStore } from '@org/shop-data';
import { useLoadingStore } from '@org/shop-data';
import { useEffect } from 'react';

export function SignUpPage() {
  const { step } = useSignupStore();
  const { remainingTime } = useTimeStore();
  const { formattedTime } = useTime();
  const { setLoading } = useLoadingStore();

  useTokenCheck();

  useEffect(() => {
    setLoading(false);
  }, []);

  const {
    handleNext,
    handleBack,
    handleGoToLogin,
    handleKeyDown,
    handleResendCode,
  } = useSignupFlow();

  return (
    <div
      className="flex h-screen w-full items-center justify-center bg-black text-white overflow-hidden"
      style={{
        backgroundColor: colors.black[100],
      }}
    >
      <div className="w-full max-w-[500px] px-6 flex flex-col items-center">
        {/* 헤더 섹션: 타이틀 및 단계 표시 */}
        <SignupHeader />

        {/* 안내 문구 */}
        <SignupGuideText />

        {/* 입력 폼 */}
        <form
          className="w-full space-y-10"
          onKeyDown={handleKeyDown}
          onSubmit={(e) => {
            e.preventDefault();
            handleNext();
          }}
        >
          {step === 1 && <EmailInput />}
          {remainingTime === 0 && step === 2 ? (
            <div className="w-full flex flex-col items-center gap-2 -mb-7">
              <span
                style={{
                  color: colors.system.error[300],
                  ...typography.title.TitleB,
                }}
              >
                인증코드 유효시간이 초과되었습니다.
              </span>
            </div>
          ) : (
            <>{step === 2 && <AuthCodeInput />}</>
          )}
          {step === 3 && <IdInput />}
          {step === 4 && <NameInput />}
          {step === 5 && <PasswordInput />}
          {step === 6 && <Success />}

          {/* 하단 버튼 및 로그인 링크 */}
          <SignupNavigation
            formattedTime={formattedTime}
            handleGoToLogin={handleGoToLogin}
            handleResendCode={handleResendCode}
            handleBack={handleBack}
            remainingTime={remainingTime}
          />
        </form>
      </div>
    </div>
  );
}
