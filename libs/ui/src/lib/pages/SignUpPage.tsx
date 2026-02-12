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
import { useState } from 'react';
import { useSignupFlow, useTime } from '../../hooks';
import { useServerLoading } from '../../context';
import { useTokenCheck } from '../../hooks';
import {
  SignupHeader,
  SignupGuideText,
  SignupNavigation,
} from '../components/signUp';

export function SignUpPage() {
  const [remainingTime, setRemainingTime] = useState(180);
  const { formattedTime } = useTime({ remainingTime, setRemainingTime });
  const { loading } = useServerLoading();
  const [generalError, setGeneralError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [id, setId] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  useTokenCheck();

  const {
    step,
    handleNext,
    handleBack,
    handleGoToLogin,
    handleKeyDown,
    handleResendCode,
  } = useSignupFlow({
    name,
    email,
    password,
    id,
    passwordConfirm,
    authCode,
    loading,
    setGeneralError,
    setRemainingTime,
  });

  return (
    <div
      className="flex h-screen w-full items-center justify-center bg-black text-white overflow-hidden"
      style={{
        backgroundColor: colors.black[100],
      }}
    >
      <div className="w-full max-w-[500px] px-6 flex flex-col items-center">
        {/* 헤더 섹션: 타이틀 및 단계 표시 */}
        <SignupHeader step={step} />

        {/* 안내 문구 */}
        <SignupGuideText step={step} />

        {/* 입력 폼 */}
        <form
          className="w-full space-y-10"
          onKeyDown={handleKeyDown}
          onSubmit={(e) => {
            e.preventDefault();
            handleNext();
          }}
        >
          {step === 1 && (
            <EmailInput
              email={email}
              setEmail={setEmail}
              generalError={generalError}
              setGeneralError={setGeneralError}
            />
          )}
          {remainingTime === 0 && step === 2 ? (
            <div className="w-full flex flex-col items-center gap-2 -mb-7">
              <span
                style={{
                  color: colors.system.error[300],
                  ...typography.title.TitleB,
                }}
              >
                인증 시간이 종료되었습니다.
              </span>
            </div>
          ) : (
            <>
              {step === 2 && (
                <AuthCodeInput
                  authCode={authCode}
                  setAuthCode={setAuthCode}
                  generalError={generalError}
                  setGeneralError={setGeneralError}
                />
              )}
            </>
          )}
          {step === 3 && (
            <IdInput
              id={id}
              setId={setId}
              generalError={generalError}
              setGeneralError={setGeneralError}
            />
          )}
          {step === 4 && (
            <NameInput
              name={name}
              setName={setName}
              generalError={generalError}
              setGeneralError={setGeneralError}
            />
          )}
          {step === 5 && (
            <PasswordInput
              password={password}
              setPassword={setPassword}
              passwordConfirm={passwordConfirm}
              setPasswordConfirm={setPasswordConfirm}
              generalError={generalError}
              setGeneralError={setGeneralError}
            />
          )}
          {step === 6 && <Success />}

          {/* 하단 버튼 및 로그인 링크 */}
          <SignupNavigation
            step={step}
            formattedTime={formattedTime}
            handleGoToLogin={handleGoToLogin}
            handleResendCode={handleResendCode}
            handleBack={handleBack}
            loading={loading}
          />
        </form>
      </div>
    </div>
  );
}
