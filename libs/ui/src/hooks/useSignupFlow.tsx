import { useState, useEffect } from 'react';
import { ApiError } from '../api';
import { useRouter } from 'next/navigation';

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
      // const response = await signupAuthCode({ email });
      // console.log('응답 데이터:', response);

      return true;
    } catch (error) {
      const apiError = error as ApiError;
      setGeneralError(apiError.message || '인증번호 전송에 실패했습니다.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const validatePasswordStep = () => {
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

    return true;
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
      setIsLoading(true);
      // const response = await signupAuthCodeCheck({ email, otp: authCode });
      // console.log('응답 데이터:', response);
      // const loginData = await signup({
      //   name,
      //   email,
      //   password,
      //   passwordConfirm,
      // });
      // console.log('회원가입 응답 데이터:', loginData);

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
    else if (step === 5 && validatePasswordStep()) setStep(step + 1);
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
