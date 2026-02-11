'use client';

import { useRouter } from 'next/navigation';
import { useLocalLogin } from '@org/shop-data';
import { useServerLoading } from '../context';

interface LoginFlowParams {
  accountId: string;
  password: string;
  setGeneralError: (msg: string) => void;
}

export function useLoginFlow({
  accountId,
  password,
  setGeneralError,
}: LoginFlowParams) {
  const router = useRouter();
  const { setLoading, setLoadingState } = useServerLoading();

  const validateEmailStep = () => {
    if (!accountId) {
      setGeneralError('아이디를 입력해주세요.');
      return false;
    }
    return true;
  };

  const validatePasswordStep = () => {
    if (!password) {
      setGeneralError('비밀번호를 입력해주세요.');
      return false;
    }

    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,30}$/;
    if (!passwordRegex.test(password)) {
      setGeneralError(
        '비밀번호는 8~30자의 영문, 숫자, 특수문자(@$!%*#?&)를 모두 포함해야 합니다'
      );
      return false;
    }

    return true;
  };

  const validateSuccessStep = () => {
    router.push('/main');
    return true;
  };

  const handleLogin = async () => {
    setGeneralError('');

    if (!validateEmailStep() || !validatePasswordStep()) {
      return;
    }

    try {
      setLoading(true);
      setLoadingState('로그인 중...');
      const loginPromise = useLocalLogin(accountId, password);
      const delayPromise = new Promise((resolve) => setTimeout(resolve, 3000));

      const [res] = await Promise.all([loginPromise, delayPromise]);

      if (res.accessToken) {
        localStorage.setItem('accessToken', res.accessToken);
      }
      if (res.refreshToken) {
        localStorage.setItem('refreshToken', res.refreshToken);
      }

      validateSuccessStep();
    } catch (error: any) {
      setLoading(false);
      const statusCode = error.response?.status || error.statusCode;
      const message = error.response?.data?.message || error.message;

      if (statusCode === 400) {
        setGeneralError('입력된 정보가 유효하지 않습니다.');
      } else if (statusCode === 401) {
        setGeneralError('아이디 또는 비밀번호가 일치하지 않습니다.');
      } else if (statusCode === 403) {
        setGeneralError('접근 권한이 없습니다.');
      } else if (statusCode === 404) {
        setGeneralError('존재하지 않는 계정입니다.');
      } else if (statusCode === 409) {
        setGeneralError('허용되지 않는 요청입니다.');
      } else if (statusCode === 500) {
        setGeneralError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      } else {
        setGeneralError(message || '로그인 중 오류가 발생했습니다.');
      }
    }
  };

  return {
    handleLogin,
  };
}
