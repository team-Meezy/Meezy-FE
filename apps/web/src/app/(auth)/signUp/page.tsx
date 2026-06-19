'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SignUpPage } from '@meezy/ui/client';

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const isOAuthCallback =
      searchParams.has('code') ||
      searchParams.has('error') ||
      searchParams.has('accessToken') ||
      searchParams.has('refreshToken');

    if (!isOAuthCallback) {
      return;
    }

    const query = searchParams.toString();
    router.replace(query ? `/callback?${query}` : '/callback');
  }, [router, searchParams]);

  const isOAuthCallback =
    searchParams.has('code') ||
    searchParams.has('error') ||
    searchParams.has('accessToken') ||
    searchParams.has('refreshToken');

  if (isOAuthCallback) {
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
