'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SignUpPage, useProfile } from '@meezy/ui/client';

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refetchProfile } = useProfile();

  // OAuth 콜백으로 /signUp 에 왔을 때 토큰이 쿼리에 있으면
  // 이메일/인증코드 화면을 보여주지 않고 바로 처리
  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const isProfileCompleted = searchParams.get('isProfileCompleted');

    if (accessToken && refreshToken) {
      console.log('OAuth Login Success (signUp page):', {
        accessToken,
        refreshToken,
        isProfileCompleted,
      });

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
 
      refetchProfile();
      
      if (isProfileCompleted === 'true') {
        router.replace('/main');
      } else {
        router.replace('/profile-setup');
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

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignUpContent />
    </Suspense>
  );
}
