'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

export function SocialButton({
  icon,
  color,
  provider,
}: {
  icon: string;
  color: string;
  provider: 'google' | 'kakao' | 'naver';
}) {
  const router = useRouter();

  const handleoAuthLogin = () => {
    const baseUrl = process.env['NEXT_PUBLIC_BASE_URL'];
    if (!baseUrl) {
      console.error('NEXT_PUBLIC_BASE_URL is not configured');
      return;
    }

    const oauthUrl = `${baseUrl}/oauth2/authorization/${provider}`;

    // 팝업으로 OAuth 창 열기
    const popup = window.open(
      oauthUrl,
      'OAuthPopup',
      'width=600,height=700,scrollbars=yes,resizable=yes'
    );

    if (!popup) {
      // 팝업 차단된 경우 기존 방식으로 fallback
      window.location.href = oauthUrl;
      return;
    }

    // 팝업 URL을 주기적으로 확인해서 토큰 추출
    const pollTimer = setInterval(() => {
      try {
        // 팝업이 닫혔으면 종료
        if (popup.closed) {
          clearInterval(pollTimer);
          return;
        }

        // 팝업 URL에 접근 가능하면 (같은 도메인)
        const popupUrl = popup.location.href;

        // 백엔드가 JSON을 반환하는 경우: 팝업 document body에서 파싱
        const bodyText = popup.document?.body?.innerText;
        if (bodyText) {
          try {
            const data = JSON.parse(bodyText);
            if (data.accessToken && data.refreshToken) {
              clearInterval(pollTimer);
              popup.close();

              localStorage.setItem('accessToken', data.accessToken);
              localStorage.setItem('refreshToken', data.refreshToken);

              if (data.isProfileCompleted === false) {
                router.push('/signUp');
              } else {
                router.push('/main');
              }
            }
          } catch {
            // JSON 파싱 실패 - 아직 로딩 중이거나 OAuth 화면
          }
        }
      } catch {
        // Cross-origin 접근 에러 - OAuth 외부 페이지(Google 등)이므로 무시
      }
    }, 500);

    // 최대 5분 후 타임아웃
    setTimeout(() => {
      clearInterval(pollTimer);
      if (!popup.closed) {
        popup.close();
      }
    }, 5 * 60 * 1000);
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
