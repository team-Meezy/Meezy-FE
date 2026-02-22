'use client';

import { Input } from '../..';
import { useSignupStore, useErrorStore } from '@org/shop-data';

export function EmailInput() {
  const { email, setEmail } = useSignupStore();
  const { generalError, setGeneralError } = useErrorStore();
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
