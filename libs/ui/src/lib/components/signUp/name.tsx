'use client';

import { useState } from 'react';
import { Input } from '../../components';

export function NameInput({
  name,
  setName,
}: {
  name: string;
  setName: (value: string) => void;
}) {
  const [nameError, setNameError] = useState('');

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
          setNameError('');
        }}
        error={nameError}
        required
      />
    </div>
  );
}
