'use client';

import { colors, typography } from '../../../design';

interface SignupHeaderProps {
  step: number;
}

export function SignupHeader({ step }: SignupHeaderProps) {
  return (
    <div className="w-full flex justify-between items-end mb-2">
      <h2
        style={{
          color: colors.white[100],
          ...typography.headline.LHeadlineB,
        }}
      >
        {step === 1 && '이메일'}
        {step === 2 && '이메일 인증'}
        {step === 3 && '아이디'}
        {step === 4 && '이름'}
        {step === 5 && '비밀번호'}
      </h2>
      <span
        style={{
          color: colors.primary[500],
          ...typography.body.BodyM,
        }}
      >
        {step != 6 && (
          <>
            <span style={{ color: colors.primary[500] }}>{step}</span>
            <span style={{ color: colors.gray[600] }}>/5</span>
          </>
        )}
      </span>
    </div>
  );
}
