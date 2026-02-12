'use client';

import { useState } from 'react';
import { useLoginFlow } from '../../hooks';
import { colors, typography } from '../../design';
import Image from 'next/image';
import LoginLogo from '../../assets/LoginLogo.png';
import { useAuth } from '../../context';
import { useTokenCheck } from '../../hooks';
import {
  SocialLoginSection,
  LoginInput,
  LoginFooter,
  LoginOptions,
} from '../components';

export function LoginPage() {
  const [accountId, setAccountId] = useState('');
  const [password, setPassword] = useState('');
  const [generalError, setGeneralError] = useState('');
  const { rememberMe, setRememberMe } = useAuth();

  useTokenCheck();

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
      <div className="flex w-full items-center justify-center xl:justify-between gap-10 md:gap-20">
        {/* 왼쪽: 브랜드 섹션 */}
        <div className="hidden lg:block max-w-xl">
          <Image
            src={LoginLogo}
            alt="Meezy Logo"
            priority
            className="object-contain"
          />
        </div>

        {/* 오른쪽: 로그인 폼 섹션 */}
        <div className="w-full max-w-3xl flex flex-col justify-center">
          <div className="max-w-2xl">
            <div className="mb-8">
              <h2
                style={{
                  color: colors.white[100],
                  ...typography.headline.LHeadlineB,
                }}
              >
                더 높은 수준의 경험.
              </h2>
              <p
                className="mt-2"
                style={{ color: colors.gray[400], ...typography.body.BodyM }}
              >
                로그인 하여 Meezy에 참가하세요.
              </p>
            </div>

            <form
              className="space-y-5"
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
                error={isIdEmptyError || isServerError ? true : false}
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
                error={isPasswordEmptyError || isServerError ? true : false}
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
