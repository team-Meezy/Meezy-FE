import { colors, typography } from '@meezy/ui';

export function Header() {
  return (
    <header
      className="w-full flex justify-between items-center p-6 "
      style={{
        ...typography.body.BodyM,
        backgroundColor: colors.black[100],
      }}
    >
      {/* 서비스 로고 */}
      <h1 className="text-[#ff5c00] font-extrabold text-2xl tracking-tight">
        Meezy.
      </h1>

      {/* 우측 유저 프로필 (이미지에서는 전체 레이아웃 우측 상단에 위치) */}
      <div className="flex items-center">
        <div className="w-10 h-10 bg-[#d9d9d9] rounded-full cursor-pointer hover:opacity-80 transition-opacity" />
      </div>
    </header>
  );
}
