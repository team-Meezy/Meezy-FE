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
    window.location.href = `${baseUrl}/oauth2/authorization/${provider}`;
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
