import { colors, typography } from '../../../design';

interface SignupNavigationProps {
  step: number;
  formattedTime: React.ReactNode;
  handleGoToLogin: () => void;
  handleResendCode: () => void;
  handleBack: () => void;
  loading: boolean;
  remainingTime: number;
}

export function SignupNavigation({
  step,
  formattedTime,
  handleGoToLogin,
  handleResendCode,
  handleBack,
  loading,
  remainingTime,
}: SignupNavigationProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      {step === 2 && formattedTime}
      {step === 1 ? (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={handleGoToLogin}
            className="hover:text-white transition-colors border-b border-orange-500"
            style={{
              color: colors.primary[500],
              ...typography.body.BodyB,
              borderColor: colors.primary[500],
            }}
          >
            로그인
          </button>
          <span
            style={{
              color: colors.gray[400],
              ...typography.body.BodyB,
            }}
          >
            하러 가기
          </span>
        </div>
      ) : step === 2 ? (
        <div className="flex gap-2">
          <span
            style={{
              color: colors.gray[400],
              ...typography.body.BodyB,
            }}
          >
            코드가 오지 않았다면?
          </span>
          <button
            type="button"
            disabled={loading}
            onClick={handleResendCode}
            className="hover:text-white transition-colors border-b border-orange-500"
            style={{
              color: colors.primary[500],
              ...typography.body.BodyB,
              borderColor: colors.primary[500],
            }}
          >
            재전송
          </button>
        </div>
      ) : (
        ''
      )}

      <div className="w-full flex gap-2">
        {step != 1 && step != 6 && (
          <button
            type="button"
            onClick={handleBack}
            className="flex-1 hover:text-white transition-colors rounded-lg border border-orange-500"
            style={{
              color: colors.primary[500],
              ...typography.body.LBodyB,
              borderColor: colors.primary[500],
            }}
          >
            이전
          </button>
        )}
        <button
          disabled={loading}
          type="submit"
          className="flex-1 rounded-lg py-4 transition-colors hover:opacity-90 active:scale-[0.98]"
          style={{
            backgroundColor: colors.primary[500],
            color: colors.white[100],
            ...typography.body.LBodyB,
            opacity: loading ? 0.6 : 1,
            cursor:
              step === 2 && remainingTime === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '처리중...' : '다음'}
        </button>
      </div>
    </div>
  );
}
