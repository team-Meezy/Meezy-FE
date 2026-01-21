'use client';

import { useState } from 'react';
import { Input } from '@meezy/ui';

export function IdInput({
  id,
  setId,
}: {
  id: string;
  setId: (value: string) => void;
}) {
  const [idError, setIdError] = useState('');

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
          setIdError('');
        }}
        error={idError}
        required
      />
    </div>
  );
}
