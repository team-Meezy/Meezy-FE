'use client';

import { useRouter } from 'next/navigation';
import { ApiError } from '../api/types/Error';

interface LoginFlowParams {
  email: string;
  password: string;
  setGeneralError: (msg: string) => void;
}

export function useLoginFlow({
  email,
  password,
  setGeneralError,
}: LoginFlowParams) {
  const router = useRouter();

  const validateEmailStep = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setGeneralError('이메일 형식이 올바르지 않습니다.');
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
    if (validateEmailStep() && validatePasswordStep()) {
      try {
        validateSuccessStep();
      } catch (error) {
        const apiError = error as ApiError;
        setGeneralError(apiError.message || '로그인에 실패했습니다.');
      }
    }
  };

  return {
    handleLogin,
  };
}
