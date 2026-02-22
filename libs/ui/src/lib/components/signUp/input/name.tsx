'use client';

import { Input } from '../..';
import { useSignupStore, useErrorStore } from '@org/shop-data';

export function NameInput() {
  const { name, setName } = useSignupStore();
  const { generalError, setGeneralError } = useErrorStore();
  return (
    <div className="flex flex-col gap-3">
      <Input
        type="text"
        id="name"
        label="이름"
        placeholder="이름을 입력해주세요."
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setGeneralError('');
        }}
        error={generalError}
      />
    </div>
  );
}
