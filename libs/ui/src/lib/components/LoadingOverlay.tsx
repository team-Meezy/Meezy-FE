'use client';

import { useLoadingStore } from '@org/shop-data';

export function LoadingOverlay() {
  const { loading, loadingState } = useLoadingStore();

  if (!loading) return null;

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-[#0c0c0c] fixed inset-0 z-[9999] backdrop-blur-sm">
      <div className="relative h-20 w-20 mb-8">
        <div className="absolute inset-0 rounded-full border-4 border-white/5"></div>
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-t-[#FF5C00] border-l-transparent border-b-transparent border-r-transparent shadow-[0_0_20px_rgba(255,92,0,0.3)]"></div>
      </div>
      <div className="flex flex-col items-center gap-3">
        <p className="text-2xl font-bold text-white tracking-widest uppercase mb-1">
          Meezy<span className="text-[#FF5C00]">.</span>
        </p>
        <p className="text-lg font-medium text-gray-400 animate-pulse text-center px-6">
          {loadingState || '잠시만 기다려주세요!'}
        </p>
      </div>
    </div>
  );
}
