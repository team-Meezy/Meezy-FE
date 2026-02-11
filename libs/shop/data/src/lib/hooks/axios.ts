import axios from 'axios';

const getBaseUrl = () => {
  if (typeof process !== 'undefined' && process.env) {
    const url =
      process.env['NEXT_PUBLIC_BASE_URL'] || process.env['VITE_BASE_URL'];
    if (url) return url;
  }
  try {
    const env = (import.meta as any).env;
    return env?.VITE_BASE_URL || env?.BASE_URL || '/';
  } catch (e) {
    return '/';
  }
};

const BASE_URL = getBaseUrl();

// 인증이 필요한 API
export const privateApi = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // 쿠키에 리프레시 토큰이 있다면 필수
});

// 인증이 필요 없는 API
export const publicApi = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
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
