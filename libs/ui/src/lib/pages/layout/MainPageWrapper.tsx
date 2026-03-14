import NextImage from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { NoTeamReceive } from '../../../assets/index.client';
import { colors } from '../../../design';
import { useServerState, useProfile, useServerJoinedTeam } from '../../../context';
import { useTeamStore, useServerIdStore } from '@org/shop-data';

export function MainPageWrapper() {
  const { profile } = useProfile();
  const { setServerId } = useServerIdStore();
  const { setJoined } = useServerJoinedTeam();
  const { teams } = useTeamStore();
  const { updateTeams } = useServerState();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        setServerId('');
        setJoined(false);
        await updateTeams();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [setServerId, setJoined, updateTeams]);

  useEffect(() => {
    if (!loading && teams.length > 0) {
      router.push(`/main/${teams[0].teamId}`);
    }
  }, [loading, teams, router]);

  if (loading || teams.length > 0) {
    return (
      <div 
        className="flex-1 flex items-center justify-center" 
        style={{ backgroundColor: colors.black[100] }}
      >
        {/* 로딩 중이거나 리다이렉트 중일 때는 빈 화면 또는 로딩 스피너를 보여줌 */}
      </div>
    );
  }

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
              <NextImage src={NoTeamReceive} alt="no team receive" />
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
