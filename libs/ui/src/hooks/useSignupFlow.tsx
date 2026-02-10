'use client';

import { useState, useEffect } from 'react';
import { ApiError } from '../api';
import { useRouter } from 'next/navigation';
import {
  useRequestEmailVerification,
  useVerifyEmailCode,
  useLocalSignup,
} from '@org/shop-data';

interface SignupFlowParams {
  name: string;
  email: string;
  password: string;
  id: string;
  passwordConfirm: string;
  authCode: string;
  setGeneralError: (msg: string) => void;
  setIsLoading: (v: boolean) => void;
}

export function useSignupFlow({
  name,
  email,
  password,
  id,
  passwordConfirm,
  authCode,
  setGeneralError,
  setIsLoading,
}: SignupFlowParams) {
  const [step, setStep] = useState(1);
  const router = useRouter();

  useEffect(() => {
    setGeneralError('');
  }, [step, setGeneralError]);

  const validateEmailStep = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setGeneralError('이메일 형식이 올바르지 않습니다.');
      return false;
    }

    try {
      setIsLoading(true);
      const response = await useRequestEmailVerification(email);
      console.log('응답 데이터:', response);

      return true;
    } catch (error: any) {
      const statusCode = error.response?.status || error.statusCode;
      if (statusCode === 409) {
        setGeneralError('이미 가입된 이메일입니다.');
      } else if (statusCode === 400) {
        setGeneralError('잘못된 이메일 형식입니다.');
      } else {
        setGeneralError('인증번호 전송에 실패했습니다. 다시 시도해 주세요.');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const validatePasswordStep = async () => {
    if (!password || !passwordConfirm) {
      setGeneralError('비밀번호를 입력해주세요.');
      return false;
    }

    if (password !== passwordConfirm) {
      setGeneralError('비밀번호가 일치하지 않습니다.');
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

    try {
      setIsLoading(true);
      const response = await useLocalSignup(email, id, name, password);
      console.log('성공', response);
      return true;
    } catch (error: any) {
      const statusCode = error.response?.status || error.statusCode;
      if (statusCode === 409) {
        setGeneralError('이미 사용 중인 아이디 또는 이메일입니다.');
      } else {
        setGeneralError('회원가입에 실패했습니다. 다시 시도해 주세요.');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const validateNameStep = () => {
    if (!name) {
      setGeneralError('이름을 입력해주세요.');
      return false;
    }
    return true;
  };

  const validateIdStep = () => {
    if (!id) {
      setGeneralError('아이디를 입력해주세요.');
      return false;
    }
    return true;
  };

  const validateAuthCodeStep = async () => {
    if (!authCode) {
      setGeneralError('인증번호를 입력해주세요.');
      return false;
    }
    try {
      const response = await useVerifyEmailCode(email, authCode);
      console.log('응답 데이터:', response);
      setIsLoading(true);
      return true;
    } catch (error) {
      const apiError = error as ApiError;
      setGeneralError(apiError.message || '인증번호 확인에 실패했습니다.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const validateSuccessStep = () => {
    router.push('/login');
    return true;
  };

  const handleNext = async () => {
    if (step === 1 && (await validateEmailStep())) setStep(step + 1);
    else if (step === 2 && (await validateAuthCodeStep())) setStep(step + 1);
    else if (step === 3 && validateIdStep()) setStep(step + 1);
    else if (step === 4 && validateNameStep()) setStep(step + 1);
    else if (step === 5 && (await validatePasswordStep())) setStep(step + 1);
    else if (step === 6 && validateSuccessStep()) setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  return {
    step,
    handleNext,
    handleBack,
  };
}
