import Image from 'next/image';
import { NoTeamReceive } from '../../../assets/index.client';
import { colors } from '../../../design';
import { useEffect, useState } from 'react';
import { getMyProfile } from '@org/shop-data';

export function MainPageWrapper() {
  const [profile, setProfile] = useState<any>(null);
  console.log('Current Profile State:', profile);

  useEffect(() => {
    const getProfile = async () => {
      const data = await getMyProfile();
      setProfile(data);
    };
    getProfile();
  }, []);

  return (
    <>
      {/* [메인] 실제 내용이 들어가는 둥근 박스 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 중앙 빈 화면 박스 */}
        <main
          className="flex-[3] border border-white/5 flex flex-col items-center justify-center"
          style={{ backgroundColor: colors.black[100] }}
        >
          {/* '아직 참가한 팀이 없습니다' 섹션 */}
          <div className="text-center flex flex-col gap-2">
            <div className="w-32 h-32 bg-[#2a2a2a] rounded-full mx-auto mb-6">
              <Image src={NoTeamReceive} alt="no team receive" />
            </div>
            <h2 className="text-xl font-bold mb-2">
              아직 참가한 팀이 없습니다.
            </h2>
            <p className="text-gray-500 text-sm">
              왼쪽 플러스 버튼을 눌러 팀에 참여하거나, 팀을 생성하여 다양한
              사람들과
              <br /> AI 기반 회의를 진행하고 요약 및 피드백을 해드려요!
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
