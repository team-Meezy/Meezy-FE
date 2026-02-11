'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useServerLoading } from '../context';

export function useTokenCheck() {
  const router = useRouter();
  const { rememberMe, isHydrated } = useAuth();
  const { setLoading, setLoadingState } = useServerLoading();

  useEffect(() => {
    const checkToken = async () => {
      if (!isHydrated) return;

      if (localStorage.getItem('accessToken')) {
        if (rememberMe) {
          setLoading(true);
          setLoadingState('로그인 기록이 있습니다!');
          await new Promise((resolve) => setTimeout(resolve, 2000));
          router.push('/main');
        } else {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    checkToken();
  }, [isHydrated, rememberMe, router, setLoading, setLoadingState]);
}
