'use client';

import { useEffect, useState } from 'react';
import { useLoginFlow } from '../../hooks';
import { colors, typography } from '../../design';
import Image from 'next/image';
import LoginLogo from '../../assets/LoginLogo.png';
import { useTokenCheck } from '../../hooks';
import {
  SocialLoginSection,
  LoginInput,
  LoginFooter,
  LoginOptions,
} from '../components';
import { useLoginStore } from '@org/shop-data';
import { useLoadingStore } from '@org/shop-data';

export function LoginPage() {
  const [accountId, setAccountId] = useState('');
  const [password, setPassword] = useState('');
  const [generalError, setGeneralError] = useState('');
  const { rememberMe, setRememberMe } = useLoginStore();
  const { setLoading } = useLoadingStore();

  useTokenCheck();

  useEffect(() => {
    setLoading(false);
  }, []);

  const { handleLogin, handleSignUpClick } = useLoginFlow({
    accountId,
    password,
    setGeneralError,
  });

  const isIdEmptyError = generalError === '아이디를 입력해주세요.';

  const isPasswordEmptyError =
    generalError === '비밀번호를 입력해주세요.' ||
    generalError ===
      '비밀번호는 8~30자의 영문, 숫자, 특수문자(@$!%*#?&)를 모두 포함해야 합니다';

  const isServerError =
    generalError && !isIdEmptyError && !isPasswordEmptyError;

  return (
    <div
      className="flex h-screen w-full items-center justify-start bg-black text-white overflow-hidden"
      style={{
        backgroundColor: colors.black[100],
      }}
    >
      <div className="flex w-full h-screen items-stretch overflow-hidden py-10">
        {/* 왼쪽: 브랜드 섹션 */}
        <div className="hidden lg:flex flex-1 items-center justify-start bg-[#111111] relative overflow-hidden rounded-tr-[40px] rounded-br-[40px]">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-5xl bg-[#FF5C00] blur-[150px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-5xl bg-[#FF5C00] blur-[120px]" />
          </div>
          <div className="relative z-10 w-full h-full">
            <Image
              src={LoginLogo}
              alt="Meezy Logo"
              priority
              className="w-full h-full object-cover object-left"
            />
          </div>
        </div>

        {/* 오른쪽: 로그인 폼 섹션 */}
        <div className="relative flex flex-1 flex-col items-center justify-center rounded-[40px] p-12 md:p-24 lg:p-32">
          <div className="w-full max-w-xl flex flex-col justify-center">
            <div className="mb-12">
              <h2
                style={{
                  color: colors.white[100],
                  ...typography.headline.LHeadlineB,
                  fontSize: '3rem',
                  lineHeight: '1.2',
                }}
              >
                더 높은 수준의 <span className="text-[#FF5C00]">경험.</span>
              </h2>
              <p
                className="mt-4"
                style={{
                  color: colors.gray[400],
                  ...typography.body.BodyM,
                  fontSize: '1.25rem',
                }}
              >
                로그인 하여 Meezy에 참가하세요.
              </p>
            </div>

            <form
              className="space-y-8"
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
            >
              {/* 이메일 입력 */}
              <LoginInput
                label="아이디"
                id="accountId"
                name="accountId"
                type="text"
                value={accountId}
                onChange={(value) => setAccountId(value)}
                placeholder="아이디를 입력해주세요."
                error={!!(isIdEmptyError || isServerError)}
                errorMessage={
                  isIdEmptyError || isServerError ? generalError : ''
                }
              />

              {/* 비밀번호 입력 */}
              <LoginInput
                label="비밀번호"
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(value) => setPassword(value)}
                placeholder="비밀번호를 입력해주세요."
                error={!!(isPasswordEmptyError || isServerError)}
                errorMessage={
                  isPasswordEmptyError || isServerError ? generalError : ''
                }
              />

              {/* 옵션 링크 */}
              <LoginOptions
                rememberMe={rememberMe}
                setRememberMe={setRememberMe}
              />

              {/* SNS 로그인 영역 */}
              <SocialLoginSection />

              {/* 하단 버튼 및 가입 링크 */}
              <LoginFooter handleSignUpClick={handleSignUpClick} />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
