'use client';

import Image from 'next/image';

export function SocialButton({ icon, color }: { icon: string; color: string }) {
  const handleGoogleLogin = () => {
    console.log('Google Login');
    // window.location.href = `${BASE_URL}/api/v1/auth/google/login`;
  };

  const handleKakaoLogin = () => {
    console.log('Kakao Login');
    // window.location.href = `${BASE_URL}/api/v1/auth/kakao/login`;
  };

  const handleNaverLogin = () => {
    console.log('Naver Login');
    // window.location.href = `${BASE_URL}/api/v1/auth/naver/login`;
  };

  const handleoAuthLogin = () => {
    if (icon === 'G') {
      handleGoogleLogin();
    } else if (icon === 'K') {
      handleKakaoLogin();
    } else if (icon === 'N') {
      handleNaverLogin();
    }
  };

  return (
    <button
      className={`flex h-10 w-10 items-center justify-center rounded-full font-bold shadow-md ${color} hover:opacity-80 transition-opacity`}
      onClick={() => handleoAuthLogin()}
    >
      <Image src={icon} alt="icon" />
    </button>
  );
}
