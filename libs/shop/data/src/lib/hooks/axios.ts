import axios from 'axios';

const getBaseUrl = () => {
  let url = '';

  // 체크: process.env (Next.js or Node environment)
  if (typeof process !== 'undefined' && process.env) {
    url =
      process.env['NEXT_PUBLIC_BASE_URL'] || process.env['VITE_BASE_URL'] || '';
  }

  // 체크: import.meta.env (Vite environment)
  if (!url || url === 'undefined' || url === '/') {
    try {
      const env = (import.meta as any).env;
      url = env?.VITE_BASE_URL || env?.BASE_URL || '';
    } catch (e) {
      /* ignore */
    }
  }

  // 브라우저 환경이라면 window.location을 최종 폴백으로 사용
  if (
    (!url || url === 'undefined' || url === '/') &&
    typeof window !== 'undefined'
  ) {
    // meezy.kr 도메인이라면 기본적으로 api.meezy.kr 을 사용하도록 명시적 폴백 설정
    if (window.location.hostname.includes('meezy.kr')) {
      url = 'https://api.meezy.kr';
    } else {
      url = window.location.origin;
    }
  }

  // 최종 정리: "undefined" 문자열이거나 빈 값이면 '/' 반환, 아니면 끝의 '/' 제거
  if (!url || url === 'undefined') return '/';

  const cleaned = url.replace(/\/$/, '');
  // 일부 환경에서 BASE_URL이 ".../api"로 주어지는 경우가 있어, 중복 prefix를 방지하기 위해 보정
  return cleaned.endsWith('/api') ? cleaned.slice(0, -4) : cleaned;
};

export const BASE_URL = getBaseUrl();

// WebSocket을 위한 설정
export const WS_PROTOCOL =
  (typeof window !== 'undefined' &&
    (window.location.protocol === 'https:' ||
      window.location.host.includes('meezy.kr'))) ||
  BASE_URL.includes('meezy.kr') ||
  BASE_URL.startsWith('https')
    ? 'wss'
    : 'ws';

// WS_HOST는 프로토콜(http/https)을 제외한 호스트명만 포함해야 함
const getWsHost = () => {
  if (BASE_URL.startsWith('http')) {
    return BASE_URL.replace(/^https?:\/\//, '').split('/')[0];
  }
  if (typeof window !== 'undefined' && window.location.host) {
    return window.location.host;
  }
  // Fallback to api.meezy.kr if we're in a known environment but can't find host
  return 'api.meezy.kr';
};

export const WS_HOST = getWsHost();

if (typeof window !== 'undefined') {
  console.log(' [Meezy API Client Config]', {
    BASE_URL,
    WS_PROTOCOL,
    WS_HOST,
  });

  if (
    window.location.protocol === 'http:' &&
    window.location.hostname.includes('meezy.kr')
  ) {
    console.error(
      '🔴 [Meezy] INSECURE CONTEXT DETECTED! Audio processing (VAD) and secure WebSockets will likely be blocked by the browser on http://api.meezy.kr. Please use https://api.meezy.kr'
    );
  }
}

// 인증이 필요한 API
export const privateApi = axios.create({
  baseURL: BASE_URL,
});

// 인증이 필요 없는 API
export const publicApi = axios.create({
  baseURL: BASE_URL,
});

// [요청 인터셉터] : 모든 privateApi 요청 직전에 실행
privateApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// [응답 인터셉터] : 서버 응답이 왔을 때 실행
privateApi.interceptors.response.use(
  (response) => response, // 성공하면 그대로 반환
  async (error) => {
    const originalRequest = error.config;

    // 401 에러가 발생했고, 재시도한 적이 없다면
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // 리프레시 토큰으로 새 엑세스 토큰 요청 (publicApi 사용)
        const res = await publicApi.post('reissue');
        const newAccessToken = res.data.accessToken;
        if (!newAccessToken) {
          throw new Error('Token refresh returned empty access token');
        }

        localStorage.setItem('accessToken', newAccessToken);

        // 새 토큰으로 헤더 교체 후 원래 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return privateApi(originalRequest);
      } catch (reissueError) {
        // 리프레시 토큰마저 만료되었다면 로그아웃 처리
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(reissueError);
      }
    }
    return Promise.reject(error);
  }
);
