import { publicApi } from '../axios';

export interface OAuthCodeExchangeResponse {
  accessToken?: string;
  isProfileCompleted?: boolean | string;
  profileCompleted?: boolean | string;
}

export const exchangeOAuthCode = async (code: string, state?: string | null) => {
  const response = await publicApi.post<OAuthCodeExchangeResponse>(
    '/oauth2/callback',
    {
      code,
      state: state || undefined,
    }
  );

  return response.data;
};
