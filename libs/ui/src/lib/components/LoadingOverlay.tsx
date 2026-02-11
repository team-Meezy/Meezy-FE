'use client';

import { useServerLoading } from '../../context';

export function LoadingOverlay() {
  const { loading, loadingState } = useServerLoading();

  if (!loading) return null;

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-black fixed inset-0 z-[9999]">
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 rounded-full border-4 border-gray-800"></div>
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
      </div>
      <p className="mt-4 text-lg font-medium text-white animate-pulse text-center px-4">
        {loadingState || '잠시만 기다려주세요!'}
      </p>
      {loadingState && (
        <p className="text-lg font-medium text-white animate-pulse mt-2">
          잠시만 기다려주세요!
        </p>
      )}
    </div>
  );
}
