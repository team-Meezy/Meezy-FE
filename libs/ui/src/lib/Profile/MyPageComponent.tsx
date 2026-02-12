import { useEffect, useState } from 'react';
import { colors, typography } from '../../design';
import { ProfileImg, ProfileIdentity, ProfileActions } from './components';
import { MyPageModal } from '../modals';
import { useProfile } from '../../context';

export function MyPageComponent() {
  const [tab, setTab] = useState(true);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmModalTitle, setConfirmModalTitle] = useState('');
  const [confirmModalDescription, setConfirmModalDescription] = useState('');

  const { profile, loading } = useProfile();
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    if (profile) {
      setUserName(profile.name || '');
      setUserId(profile.accountId || '');
      setUserEmail(profile.email || '');
    }
  }, [profile]);

  if (loading || !profile) {
    return (
      <div
        className="flex-[3] min-h-screen p-5 flex items-center justify-center border border-white/5"
        style={{ backgroundColor: colors.black[100], color: '#FFFFFF' }}
      >
        <p style={{ ...typography.body.BodyM, color: colors.gray[400] }}>
          프로필 정보를 불러오는 중입니다...
        </p>
      </div>
    );
  }

  const onConfirmModalOpen = () => {
    setConfirmModalOpen(true);
  };
  const onConfirmModalClose = () => setConfirmModalOpen(false);

  const onTabProfile = () => setTab(true);
  const onTabSettings = () => setTab(false);

  const handleSave = () => {
    console.log('저장하기');
  };

  const tapStyle = (tab: boolean) => {
    if (tab) {
      return {
        ...typography.body.BodyB,
        color: colors.white[100],
        backgroundColor: colors.gray[800],
      };
    } else {
      return {
        ...typography.body.BodyB,
        color: colors.gray[400],
        backgroundColor: 'transparent',
      };
    }
  };

  return (
    <div
      className="flex-[3] min-h-screen p-5 flex flex-col gap-5 border border-white/5"
      style={{ backgroundColor: colors.black[100], color: '#FFFFFF' }}
    >
      {/* 탭 메뉴 */}
      <div className="flex gap-3 border-b border-white/10 pb-2">
        <button
          className="px-5 py-3 rounded-md"
          style={tapStyle(tab)}
          onClick={onTabProfile}
        >
          서버 프로필
        </button>
        <button
          className="px-5 py-3 rounded-md"
          style={tapStyle(!tab)}
          onClick={onTabSettings}
        >
          설정
        </button>
      </div>

      {/* 헤더 섹션 */}
      <section className="flex flex-col gap-4">
        <h1 style={{ ...typography.title.sTitleB }}>
          {tab ? '프로필' : '설정'}
        </h1>
        <p style={{ ...typography.body.BodyB, color: colors.gray[400] }}>
          {tab
            ? '공개적으로 보일 프로필인 이름, 대표 이미지 등을정해주세요!'
            : '개인의 전체적인 설정을 조정할 수 있습니다.'}
        </p>
      </section>

      <hr className="border-white/10" />

      {tab ? (
        <>
          <ProfileImg />
          <ProfileIdentity
            userName={userName}
            setUserName={setUserName}
            userId={userId}
            userEmail={userEmail}
            handleSave={handleSave}
          />
        </>
      ) : (
        <ProfileActions
          onConfirmModalOpen={onConfirmModalOpen}
          Title={setConfirmModalTitle}
          Description={setConfirmModalDescription}
        />
      )}

      <MyPageModal
        onClose={onConfirmModalClose}
        isOpen={confirmModalOpen}
        title={confirmModalTitle}
        description={confirmModalDescription}
      />
    </div>
  );
}
