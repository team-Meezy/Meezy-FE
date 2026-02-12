'use client';

import { useState } from 'react';
import { Input } from '../../components';

export function IdInput({
  id,
  setId,
  generalError,
  setGeneralError,
}: {
  id: string;
  setId: (value: string) => void;
  generalError: string;
  setGeneralError: (msg: string) => void;
}) {
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
