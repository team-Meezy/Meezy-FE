import { colors, typography } from '../../../design';

interface LoginFooterProps {
  handleSignUpClick: () => void;
}

export const LoginFooter = ({ handleSignUpClick }: LoginFooterProps) => (
  <div className="pt-2 text-center">
    <p className="mb-4 text-sm">
      <span
        className="cursor-pointer underline underline-offset-4"
        style={{
          color: colors.primary[500],
          ...typography.body.BodyM,
        }}
        onClick={handleSignUpClick}
      >
        회원가입
      </span>{' '}
      <span
        style={{
          color: colors.gray[500],
          ...typography.body.BodyM,
        }}
      >
        하러 가기
      </span>
    </p>
    <button
      type="submit"
      className="w-full rounded-lg py-4 transition-colors hover:bg-orange-600"
      style={{
        backgroundColor: colors.primary[500],
        color: colors.white[100],
        ...typography.body.LBodyB,
      }}
    >
      로그인
    </button>
  </div>
);
