'use client';

import Image from 'next/image';
import { colors, typography } from '../../../../design';
import { Receive } from '../../../../assets/index.client';

export function Success() {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-3">
      <div className="flex w-[220px] flex-col">
        <Image src={Receive} alt="Receive" />
      </div>
      <div className="flex flex-col items-center justify-center gap-3">
        <p
          style={{
            ...typography.title.sTitleM,
            color: colors.white[100],
          }}
        >
          회원가입이 완료되었습니다.
        </p>
        <p
          className="text-center"
          style={{
            ...typography.body.BodyM,
            color: colors.gray[500],
          }}
        >
          쾌적한 회의 분위기를 만들어보세요.
          <br />
          AI 도우미 리시브도 곧 함께할게요.
        </p>
      </div>
    </div>
  );
}
