import Image from 'next/image';
import { colors, typography } from '@meezy/ui';
import Receive from '../../../../assets/reseive.png';

export function Success() {
  return (
    <div className="w-full flex flex-col items-center justify-center gap-3">
      <div className="w-[220px] flex flex-col">
        <Image src={Receive} alt="Receive" />
      </div>
      <div className="flex flex-col items-center justify-center gap-3">
        <p
          style={{
            ...typography.title.sTitleM,
            color: colors.white[100],
          }}
        >
          회원가입이 완료 되었습니다!
        </p>
        <p
          className="text-center"
          style={{
            ...typography.body.BodyM,
            color: colors.gray[500],
          }}
        >
          쾌적한 회의 분위기를 조성해주세요!
          <br />
          AI 도우미 리시브도 도와드릴게요!
        </p>
      </div>
    </div>
  );
}
