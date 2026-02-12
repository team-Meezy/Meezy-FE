import { colors, typography } from '../../../design';

interface LoginOptionsProps {
  rememberMe: boolean;
  setRememberMe: (rememberMe: boolean) => void;
}

export const LoginOptions = ({
  rememberMe,
  setRememberMe,
}: LoginOptionsProps) => (
  <div className="flex items-center justify-between">
    <label
      className="flex items-center gap-2 cursor-pointer"
      style={{
        color: colors.gray[500],
        ...typography.body.BodyB,
      }}
    >
      <div className="relative flex items-center justify-center">
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(!rememberMe)}
          className="peer h-5 w-5 cursor-pointer appearance-none rounded-sm border border-2 border-gray-700 transition-colors checked:border-primary-500 checked:bg-primary-500 hover:border-primary-500"
          style={{
            backgroundColor: colors.gray[900],
          }}
        />
        <svg
          className="pointer-events-none absolute h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 12.75l6 6 9-13.5"
          />
        </svg>
      </div>
      로그인 상태 유지
    </label>
    <a
      href="#"
      className="hover:text-white transition-colors underline"
      style={{
        color: colors.gray[500],
        ...typography.body.BodyB,
      }}
    >
      비밀번호를 잊으셨나요?
    </a>
  </div>
);
