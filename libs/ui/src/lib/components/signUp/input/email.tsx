'use client';

import { Input } from '../..';

export function EmailInput({
  email,
  setEmail,
  generalError,
  setGeneralError,
}: {
  email: string;
  setEmail: (email: string) => void;
  generalError: string;
  setGeneralError: (generalError: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <Input
        type="text"
        id="email"
        label="이메일"
        placeholder="example@email.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setGeneralError('');
        }}
        error={generalError}
      />
    </div>
  );
}
