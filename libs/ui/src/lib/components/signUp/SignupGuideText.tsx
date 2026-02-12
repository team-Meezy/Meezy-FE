import { colors, typography } from '../../../design';

export function SignupGuideText({ step }: { step: number }) {
  return (
    <div
      className="w-full mb-8"
      style={{
        color: colors.gray[400],
        ...typography.body.BodyM,
      }}
    >
      {step === 1 && '회원 가입에 사용 할 이메일을 작성해주세요.'}
      {step === 2 && '회원님이 작성한 이메일로 전송된 코드를 입력해주세요.'}
      {step === 3 &&
        '아이디는 한 번 설정하면 변경이 불가하니 신중하게 작성해주세요.'}
      {step === 4 &&
        '이름은 한 번 설정하면 변경이 불가하니 신중하게 작성해주세요.'}
      {step === 5 && (
        <div className="flex flex-col gap-1">
          <p>타인에게 노출이 되지 않을 비밀번호로 설정해주세요!</p>
          <p>조건이 들어가는 글 자리입니다.</p>
        </div>
      )}
    </div>
  );
}
