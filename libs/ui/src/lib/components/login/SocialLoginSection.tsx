import { colors, typography } from '../../../design';
import { SocialButton } from '../SocialButton';
import Google from '../../../assets/Google.svg';
import Kakao from '../../../assets/Kakao.svg';
import Naver from '../../../assets/Naver.svg';

export const SocialLoginSection = () => (
  <>
    <div className="relative py-4">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-800" />
      </div>
      <div className="relative flex justify-center uppercase">
        <span
          className="bg-black px-2"
          style={{
            backgroundColor: colors.black[100],
            color: colors.gray[500],
            ...typography.body.BodyB,
          }}
        >
          SNS 계정으로 로그인
        </span>
      </div>
    </div>
    <div className="flex justify-center gap-4">
      <SocialButton
        icon={Google}
        color="bg-white text-black"
        provider="google"
      />
      <SocialButton
        icon={Kakao}
        color="bg-yellow-400 text-black"
        provider="kakao"
      />
      <SocialButton
        icon={Naver}
        color="bg-green-500 text-white"
        provider="naver"
      />
    </div>
  </>
);
