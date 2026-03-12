'use client';

import Image from 'next/image';

export function SocialButton({
  icon,
  color,
  provider,
}: {
  icon: string;
  color: string;
  provider: 'google' | 'kakao' | 'naver';
}) {
  const handleoAuthLogin = () => {
    const baseUrl = process.env['NEXT_PUBLIC_BASE_URL'];
    if (!baseUrl) {
      console.error('NEXT_PUBLIC_BASE_URL is not configured');
      return;
    }

    const oauthUrl = `${baseUrl}/oauth2/authorization/${provider}`;

    // 현재 창에서 바로 OAuth 진행
    window.location.href = oauthUrl;
  };

  return (
    <button
      type="button"
      className={`flex h-10 w-10 items-center justify-center rounded-full font-bold shadow-md ${color} hover:opacity-80 transition-opacity`}
      onClick={() => handleoAuthLogin()}
    >
      <Image src={icon} alt="icon" />
    </button>
  );
}
