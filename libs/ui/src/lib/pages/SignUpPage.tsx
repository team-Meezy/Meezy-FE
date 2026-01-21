'use client';

import { useRouter } from 'next/navigation';
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

export function SignUpPage() {
  const { remainingTime, formattedTime } = useTime();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [id, setId] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const { step, handleNext, handleBack } = useSignupFlow({
    name,
    email,
    password,
    id,
    passwordConfirm,
    authCode,
    setGeneralError,
    setIsLoading,
  });

  const handleGoToLogin = () => {
    router.push('/login');
  };

  const handleResendCode = async () => {
    // TODO: Implement resend logic - call the auth code API again
    // Reset the timer as well
  };

  return (
    <div
      className="flex h-screen w-full items-center justify-center bg-black text-white overflow-hidden"
      style={{
        backgroundColor: colors.black[100],
      }}
    >
      <div className="w-full max-w-[500px] px-6 flex flex-col items-center">
        {/* 헤더 섹션: 타이틀 및 단계 표시 */}
        <div className="w-full flex justify-between items-end mb-2">
          <h2
            style={{
              color: colors.white[100],
              ...typography.headline.LHeadlineB,
            }}
          >
            {step === 1 && '이메일'}
            {step === 2 && '이메일 인증'}
            {step === 3 && '아이디'}
            {step === 4 && '이름'}
            {step === 5 && '비밀번호'}
          </h2>
          <span
            style={{
              color: colors.primary[500],
              ...typography.body.BodyM,
            }}
          >
            {step != 6 && (
              <>
                <span style={{ color: colors.primary[500] }}>{step}</span>
                <span style={{ color: colors.gray[600] }}>/5</span>
              </>
            )}
          </span>
        </div>

        {/* 안내 문구 */}
        <div
          className="w-full mb-8"
          style={{
            color: colors.gray[400],
            ...typography.body.BodyM,
          }}
        >
          {step === 1 && '회원 가입에 사용 할 이메일을 작성해주세요.'}
          {step === 2 && '회원님이 작성한 이메일로 전송된 코드를 입력해주세요.'}
          {step === 3 &&
            '아이디는 한 번 설정하면 변경이 불가하니 신중하게 작성해주세요.'}
          {step === 4 &&
            '이름은 한 번 설정하면 변경이 불가하니 신중하게 작성해주세요.'}
          {step === 5 && (
            <div className="flex flex-col gap-1">
              <p>타인에게 노출이 되지 않을 비밀번호로 설정해주세요!</p>
              <p>조건이 들어가는 글 자리입니다.</p>
            </div>
          )}
        </div>

        {/* General Error Message */}
        {generalError && (
          <div
            className="w-full p-4 rounded-lg mb-8"
            style={{
              backgroundColor: colors.system.error[300] || '#FEE2E2',
              border: `1px solid ${colors.system.error[500] || '#ffa0a0ff'}`,
            }}
          >
            <p
              style={{
                ...typography.body.BodyM,
                color: colors.system.error[700] || '#DC2626',
              }}
            >
              {generalError}
            </p>
          </div>
        )}

        <form className="w-full space-y-10">
          {step === 1 && <EmailInput email={email} setEmail={setEmail} />}
          {step === 2 && (
            <AuthCodeInput authCode={authCode} setAuthCode={setAuthCode} />
          )}
          {step === 3 && <IdInput id={id} setId={setId} />}
          {step === 4 && <NameInput name={name} setName={setName} />}
          {step === 5 && (
            <PasswordInput
              password={password}
              setPassword={setPassword}
              passwordConfirm={passwordConfirm}
              setPasswordConfirm={setPasswordConfirm}
            />
          )}
          {step === 6 && <Success />}

          {/* 하단 버튼 및 로그인 링크 */}
          <div className="flex flex-col items-center gap-2">
            {step === 2 && formattedTime}
            {step === 1 ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleGoToLogin}
                  className="hover:text-white transition-colors border-b border-orange-500"
                  style={{
                    color: colors.primary[500],
                    ...typography.body.BodyB,
                    borderColor: colors.primary[500],
                  }}
                >
                  로그인
                </button>
                <span
                  style={{
                    color: colors.gray[400],
                    ...typography.body.BodyB,
                  }}
                >
                  하러 가기
                </span>
              </div>
            ) : step === 2 ? (
              <div className="flex gap-2">
                <span
                  style={{
                    color: colors.gray[400],
                    ...typography.body.BodyB,
                  }}
                >
                  코드가 오지 않았다면?
                </span>
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="hover:text-white transition-colors border-b border-orange-500"
                  style={{
                    color: colors.primary[500],
                    ...typography.body.BodyB,
                    borderColor: colors.primary[500],
                  }}
                >
                  재전송
                </button>
              </div>
            ) : (
              ''
            )}

            <div className="w-full flex gap-2">
              {step != 1 && step != 6 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 hover:text-white transition-colors rounded-lg border border-orange-500"
                  style={{
                    color: colors.primary[500],
                    ...typography.body.LBodyB,
                    borderColor: colors.primary[500],
                  }}
                >
                  이전
                </button>
              )}
              <button
                disabled={isLoading}
                type="button"
                onClick={handleNext}
                className="flex-1 rounded-lg py-4 transition-colors hover:opacity-90 active:scale-[0.98]"
                style={{
                  backgroundColor: colors.primary[500],
                  color: colors.white[100],
                  ...typography.body.LBodyB,
                  opacity: isLoading ? 0.6 : 1,
                }}
              >
                {isLoading ? '처리중...' : step === 6 ? '완료' : '다음'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
