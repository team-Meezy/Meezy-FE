'use client';

import Image from 'next/image';
import { Google, Kakao, Naver, LoginLogo } from '@meezy/ui';
import { SocialButton, useLoginFlow } from '@meezy/ui';
import { colors, typography } from '@meezy/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function page() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [generalError, setGeneralError] = useState('');
  const { handleLogin } = useLoginFlow({
    email,
    password,
    setGeneralError,
  });

  const handleSignUpClick = () => {
    router.push('/signUp');
  };
  return (
    <div
      className="flex h-screen w-full items-center justify-start bg-black text-white overflow-hidden"
      style={{
        backgroundColor: colors.black[100],
      }}
    >
      <div className="flex w-full items-center justify-between gap-10 md:gap-20">
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

            {/* General Error Message */}
            {generalError && (
              <div
                className="w-full p-4 rounded-lg mb-8"
                style={{
                  backgroundColor: colors.system.error[300] || '#FEE2E2',
                  border: `1px solid ${
                    colors.system.error[500] || '#ffa0a0ff'
                  }`,
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

            <form className="space-y-5">
              {/* 이메일 입력 */}
              <div className="flex flex-col gap-1">
                <label
                  style={{
                    color: colors.gray[400],
                    ...typography.body.BodyM,
                  }}
                >
                  이메일
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일을 입력해주세요."
                  style={{
                    color: colors.gray[500],
                    backgroundColor: colors.gray[900],
                    ...typography.body.BodyM,
                  }}
                  className="w-full rounded-lg p-4 outline-none ring-1 ring-gray-700 focus:ring-orange-500"
                />
              </div>
              {/* 비밀번호 입력 */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="password"
                  style={{
                    color: colors.gray[400],
                    ...typography.body.BodyM,
                  }}
                >
                  비밀번호
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력해주세요."
                  style={{
                    color: colors.gray[500],
                    backgroundColor: colors.gray[900],
                    ...typography.body.BodyM,
                  }}
                  className="w-full rounded-lg p-4 outline-none ring-1 ring-gray-700 focus:ring-orange-500"
                />
              </div>
              {/* 옵션 링크 */}
              <div className="flex items-center justify-between">
                <label
                  className="flex items-center gap-2 cursor-pointer"
                  style={{
                    color: colors.gray[500],
                    ...typography.body.BodyB,
                  }}
                >
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      className="peer h-5 w-5 cursor-pointer appearance-none rounded-sm border border-2 border-gray-700 transition-colors checked:border-primary-500 checked:bg-primary-500 hover:border-primary-500"
                      style={{
                        backgroundColor: colors.gray[900],
                      }}
                    />
                    <svg
                      className="pointer-events-none absolute h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                  </div>
                  로그인 상태 유지
                </label>
                <a
                  href="#"
                  className="hover:text-white transition-colors underline"
                  style={{
                    color: colors.gray[500],
                    ...typography.body.BodyB,
                  }}
                >
                  비밀번호를 잊으셨나요?
                </a>
              </div>
              {/* SNS 로그인 영역 */}
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-800"></div>
                </div>
                <div className="relative flex justify-center uppercase">
                  <span
                    className="bg-black px-2"
                    style={{
                      backgroundColor: colors.black[100],
                      color: colors.gray[500],
                      ...typography.body.BodyB,
                    }}
                  >
                    SNS 계정으로 로그인
                  </span>
                </div>
              </div>
              <div className="flex justify-center gap-4">
                <SocialButton icon={Google} color="bg-white text-black" />
                <SocialButton icon={Kakao} color="bg-yellow-400 text-black" />
                <SocialButton icon={Naver} color="bg-green-500 text-white" />
              </div>
              {/* 하단 버튼 및 가입 링크 */}
              <div className="pt-2 text-center">
                <p className="mb-4 text-sm">
                  <span
                    className="cursor-pointer underline underline-offset-4"
                    style={{
                      color: colors.primary[500],
                      ...typography.body.BodyM,
                    }}
                    onClick={handleSignUpClick}
                  >
                    회원가입
                  </span>{' '}
                  <span
                    style={{
                      color: colors.gray[500],
                      ...typography.body.BodyM,
                    }}
                  >
                    하러 가기
                  </span>
                </p>
                <button
                  type="button"
                  className="w-full rounded-lg py-4 transition-colors hover:bg-orange-600"
                  style={{
                    backgroundColor: colors.primary[500],
                    color: colors.white[100],
                    ...typography.body.LBodyB,
                  }}
                  onClick={handleLogin}
                >
                  로그인
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
