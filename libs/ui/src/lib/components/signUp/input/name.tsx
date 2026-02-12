'use client';

import { Input } from '../..';

export function NameInput({
  name,
  setName,
  generalError,
  setGeneralError,
}: {
  name: string;
  setName: (value: string) => void;
  generalError: string;
  setGeneralError: (msg: string) => void;
}) {
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
