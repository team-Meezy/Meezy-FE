'use client';

import { useState } from 'react';
import { Input } from '../../components';

export function PasswordInput({
  password,
  setPassword,
  passwordConfirm,
  setPasswordConfirm,
  generalError,
  setGeneralError,
}: {
  password: string;
  setPassword: (value: string) => void;
  passwordConfirm: string;
  setPasswordConfirm: (value: string) => void;
  generalError: string;
  setGeneralError: (msg: string) => void;
}) {
  const isPasswordError =
    generalError === '비밀번호를 입력해주세요.' ||
    generalError ===
      '비밀번호는 8~30자의 영문, 숫자, 특수문자(@$!%*#?&)를 모두 포함해야 합니다';
  const isPasswordConfirmError =
    generalError === '비밀번호 확인을 입력해주세요.' ||
    generalError === '비밀번호가 일치하지 않습니다.' ||
    generalError ===
      '비밀번호는 8~30자의 영문, 숫자, 특수문자(@$!%*#?&)를 모두 포함해야 합니다';
  return (
    <div className="flex flex-col gap-3">
      <Input
        id="password"
        label="비밀번호"
        type="password"
        placeholder="비밀번호"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setGeneralError('');
        }}
        error={isPasswordError ? generalError : ''}
      />
      <Input
        id="passwordConfirm"
        label="비밀번호 확인"
        type="password"
        placeholder="비밀번호 확인"
        value={passwordConfirm}
        onChange={(e) => {
          setPasswordConfirm(e.target.value);
          setGeneralError('');
        }}
        error={isPasswordConfirmError ? generalError : ''}
      />
    </div>
  );
}
