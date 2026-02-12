'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  useRequestEmailVerification,
  useVerifyEmailCode,
  useLocalSignup,
} from '@org/shop-data';
import { useServerLoading } from '../context';

interface SignupFlowParams {
  name: string;
  email: string;
  password: string;
  id: string;
  passwordConfirm: string;
  authCode: string;
  loading: boolean;
  setGeneralError: (msg: string) => void;
  setRemainingTime: (time: number) => void;
}

export function useSignupFlow({
  name,
  email,
  password,
  id,
  passwordConfirm,
  authCode,
  loading,
  setGeneralError,
  setRemainingTime,
}: SignupFlowParams) {
  const [step, setStep] = useState(1);
  const router = useRouter();
  const { setLoading, setLoadingState } = useServerLoading();

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
      setLoading(true);
      await useRequestEmailVerification(email);

      return true;
    } catch (error: any) {
      const statusCode = error.response?.status || error.statusCode;
      if (statusCode === 409) {
        setGeneralError('이미 가입된 이메일입니다.');
      } else if (statusCode === 400) {
        setGeneralError('잘못된 이메일 형식입니다.');
      } else if (statusCode === 429) {
        setGeneralError(
          '너무 많은 요청을 보냈습니다. 24시간 후에 다시 시도해주세요.'
        );
      } else {
        setGeneralError('인증번호 전송에 실패했습니다. 다시 시도해 주세요.');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const validatePasswordStep = async () => {
    if (!password) {
      setGeneralError('비밀번호를 입력해주세요.');
      return false;
    }

    if (!passwordConfirm) {
      setGeneralError('비밀번호 확인을 입력해주세요.');
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
      setLoading(true);
      setLoadingState('회원가입 중...');

      await Promise.all([
        useLocalSignup(email, id, name, password),
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);
      setLoading(false);
      return true;
    } catch (error: any) {
      setLoading(false);
      const statusCode = error.response?.status || error.statusCode;
      if (statusCode === 409) {
        setGeneralError('이미 사용 중인 아이디 또는 이메일입니다.');
      } else {
        setGeneralError('회원가입에 실패했습니다. 다시 시도해 주세요.');
      }
      return false;
    }
  };

  const validateNameStep = () => {
    if (!name) {
      setGeneralError('이름을 입력해주세요.');
      return false;
    } else if (name.length <= 2 || name.length >= 10) {
      setGeneralError('이름은 2자 이상 10자 이내로 입력해주세요.');
      return false;
    }
    return true;
  };

  const validateIdStep = () => {
    if (!id) {
      setGeneralError('아이디를 입력해주세요.');
      return false;
    } else if (id.length <= 6 || id.length >= 15) {
      setGeneralError('아이디는 6자 이상 15자 이내로 입력해주세요.');
      return false;
    }
    return true;
  };

  const validateAuthCodeStep = async () => {
    if (!authCode || authCode.length !== 6) {
      setGeneralError('인증번호를 입력해주세요.');
      return false;
    }
    try {
      setLoading(true);
      setLoadingState('인증번호 확인 중...');
      await useVerifyEmailCode(email, authCode);
      return true;
    } catch (error: any) {
      const statusCode = error.response?.status || error.statusCode;
      if (statusCode === 400) {
        setGeneralError('잘못된 인증번호입니다.');
      } else {
        setGeneralError('인증번호 전송에 실패했습니다. 다시 시도해 주세요.');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const validateSuccessStep = async () => {
    setLoading(true);
    setLoadingState('로그인 페이지로 이동 중...');
    await new Promise((resolve) => setTimeout(resolve, 2000));
    router.push('/login');
    return true;
  };

  const handleGoToLogin = async () => {
    setLoading(true);
    setLoadingState('로그인 페이지로 이동 중!');
    await new Promise((resolve) => setTimeout(resolve, 2000));
    router.push('/login');
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      e.preventDefault();
      await handleNext();
    }
  };

  const handleResendCode = async () => {
    try {
      setLoading(true);
      await useRequestEmailVerification(email);
      setRemainingTime(180);
    } catch (error: any) {
      const statusCode = error.response?.status || error.statusCode;
      if (statusCode === 429) {
        setGeneralError(
          '너무 많은 요청을 보냈습니다. 24시간 후에 다시 시도해주세요.'
        );
      } else {
        setGeneralError('인증번호 재전송에 실패했습니다. 다시 시도해 주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (step === 1 && (await validateEmailStep())) {
      setStep(step + 1);
      setRemainingTime(180);
    } else if (step === 2 && (await validateAuthCodeStep())) {
      setStep(step + 1);
    } else if (step === 3 && validateIdStep()) {
      setStep(step + 1);
    } else if (step === 4 && validateNameStep()) {
      setStep(step + 1);
    } else if (step === 5 && (await validatePasswordStep())) {
      setStep(step + 1);
    } else if (step === 6 && (await validateSuccessStep())) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  return {
    step,
    handleNext,
    handleBack,
    handleGoToLogin,
    handleKeyDown,
    handleResendCode,
  };
}
