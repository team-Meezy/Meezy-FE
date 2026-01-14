import { useState } from 'react';
import { Input } from '@meezy/ui';

export function EmailInput({
  email,
  setEmail,
}: {
  email: string;
  setEmail: (email: string) => void;
}) {
  const [emailError, setEmailError] = useState('');

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
          setEmailError('');
        }}
        error={emailError}
        required
      />
    </div>
  );
}
