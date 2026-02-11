import { LoginPage } from './LoginPage';
import { useServerLoading } from '../../context';

export function LoadingPage() {
  const { loading, loadingState } = useServerLoading();
  return loading ? (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-black">
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 rounded-full border-4 border-gray-800"></div>
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
      </div>
      <p className="mt-4 text-lg font-medium text-white animate-pulse">
        {loadingState}
      </p>
      <p className="text-lg font-medium text-white animate-pulse">
        잠시만 기다려주세요!
      </p>
    </div>
  ) : (
    <LoginPage />
  );
}
