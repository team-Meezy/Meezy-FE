import { Suspense } from 'react';
import LoginCallbackClient from './LoginCallbackClient';

export function OAuthCallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginCallbackClient />
    </Suspense>
  );
}

export default OAuthCallbackPage;
