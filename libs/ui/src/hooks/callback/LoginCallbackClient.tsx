'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { colors } from '../../design';
import {
  exchangeOAuthCode,
  useErrorStore,
  useLoginStore,
} from '@org/shop-data';
import { useProfile } from '../../context';

function isProfileCompleted(value: unknown) {
  return value === true || value === 'true';
}

export function LoginCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { generalError, setGeneralError } = useErrorStore();
  const { isProcessing, setIsProcessing } = useLoginStore();
  const { refetchProfile } = useProfile();

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const failAndRedirect = (message: string) => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }

      setGeneralError(message);
      setIsProcessing(false);
      timeoutId = setTimeout(() => router.replace('/login'), 3000);
    };

    const processOAuthCallback = async () => {
      setIsProcessing(true);
      setGeneralError('');

      try {
        const errorParam = searchParams.get('error');
        if (errorParam) {
          failAndRedirect('OAuth 인증이 취소되었거나 실패했습니다.');
          return;
        }

        const hasUnsafeTokenResponse =
          searchParams.has('accessToken') || searchParams.has('refreshToken');
        if (hasUnsafeTokenResponse) {
          failAndRedirect(
            '안전하지 않은 OAuth 응답입니다. 다시 로그인해주세요.'
          );
          return;
        }

        const code = searchParams.get('code');
        if (!code) {
          failAndRedirect('인증 정보를 가져올 수 없습니다.');
          return;
        }

        const response = await exchangeOAuthCode(code, searchParams.get('state'));
        if (cancelled) return;

        if (response.accessToken && typeof window !== 'undefined') {
          localStorage.setItem('accessToken', response.accessToken);
          localStorage.removeItem('refreshToken');
        }

        await refetchProfile();

        const completed =
          isProfileCompleted(response.isProfileCompleted) ||
          isProfileCompleted(response.profileCompleted);

        router.replace(completed ? '/main' : '/profile-setup');
      } catch (err) {
        if (cancelled) return;

        const message =
          err instanceof Error
            ? err.message
            : 'OAuth 인증에 실패했습니다.';
        failAndRedirect(message || 'OAuth 인증에 실패했습니다.');
      }
    };

    void processOAuthCallback();

    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [refetchProfile, router, searchParams, setGeneralError, setIsProcessing]);

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {isProcessing ? (
          <>
            <div className="mb-6 flex justify-center">
              <div
                className="animate-spin rounded-full border-4 border-t-transparent"
                style={{
                  width: '48px',
                  height: '48px',
                  borderTopColor: colors.gray[300],
                }}
              />
            </div>
            <h1 className="mb-2 font-headlineB text-gray-800">
              로그인 처리 중...
            </h1>
            <p className="mb-4 font-bodyM text-gray-600">
              잠시만 기다려주세요.
            </p>
          </>
        ) : generalError ? (
          <>
            <div className="mb-6 flex justify-center">
              <div
                className="rounded-full flex items-center justify-center"
                style={{
                  width: '64px',
                  height: '64px',
                  backgroundColor: '#FEE',
                }}
              >
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <circle
                    cx="16"
                    cy="16"
                    r="12"
                    stroke="#F50D0D"
                    strokeWidth="2"
                  />
                  <path
                    d="M16 10V18M16 22H16.01"
                    stroke="#F50D0D"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
            <h1 className="mb-2 font-headlineB text-gray-800">로그인 실패</h1>
            <p className="mb-4 font-bodyM text-gray-600">{generalError}</p>
            <p className="font-labelM text-gray-500">
              3초 후 로그인 페이지로 이동합니다.
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default LoginCallbackClient;
