'use client';

import { Input } from '../..';
import { useSignupStore, useErrorStore } from '@org/shop-data';

export function IdInput() {
  const { id, setId } = useSignupStore();
  const { generalError, setGeneralError } = useErrorStore();
  return (
    <div className="flex flex-col gap-3">
      <Input
        type="text"
        id="id"
        label="아이디"
        placeholder="아이디를 입력해주세요."
        value={id}
        onChange={(e) => {
          setId(e.target.value);
          setGeneralError('');
        }}
        error={generalError}
      />
    </div>
  );
}
