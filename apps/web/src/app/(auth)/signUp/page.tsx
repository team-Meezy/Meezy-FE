'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SignUpPage } from '@meezy/ui/client';

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // OAuth 콜백으로 /signUp 에 왔을 때 토큰이 쿼리에 있으면
  // 이메일/인증코드 화면을 보여주지 않고 바로 처리
  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const isProfileCompleted = searchParams.get('isProfileCompleted');

    if (accessToken && refreshToken) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      if (isProfileCompleted === 'false') {
        router.replace('/profile-setup');
      } else {
        router.replace('/main');
      }
    }
  }, [searchParams, router]);

  const hasTokens =
    !!searchParams.get('accessToken') && !!searchParams.get('refreshToken');

  // OAuth 토큰 처리 중에는 회원가입 폼을 렌더링하지 않음
  if (hasTokens) {
    return null;
  }

  return <SignUpPage />;
}
