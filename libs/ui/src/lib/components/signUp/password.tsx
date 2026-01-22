'use client';

import { useState } from 'react';
import { Input } from '../../components';

export function PasswordInput({
  password,
  setPassword,
  passwordConfirm,
  setPasswordConfirm,
}: {
  password: string;
  setPassword: (value: string) => void;
  passwordConfirm: string;
  setPasswordConfirm: (value: string) => void;
}) {
  const [passwordError, setPasswordError] = useState('');

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
          setPasswordError('');
        }}
        error={passwordError}
        required
      />
      <Input
        id="passwordConfirm"
        label="비밀번호 확인"
        type="password"
        placeholder="비밀번호 확인"
        value={passwordConfirm}
        onChange={(e) => {
          setPasswordConfirm(e.target.value);
          setPasswordError('');
        }}
        error={passwordError}
        required
      />
    </div>
  );
}
