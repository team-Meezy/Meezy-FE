import { colors, typography } from '../../../design';

interface ProfileIdentityProps {
  userName: string;
  setUserName: (name: string) => void;
  userId: string;
  userEmail: string;
}

export function ProfileIdentity({
  userName,
  setUserName,
  userId,
  userEmail,
}: ProfileIdentityProps) {
  return (
    <section className="flex flex-col gap-4">
      {/* 이름 필드 */}
      <div className="flex flex-col gap-3">
        <label style={{ ...typography.body.BodyB }}>이름</label>
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          className="w-full max-w-lg h-10 px-4 rounded-lg outline-none border border-transparent focus:border-[#FF5C00] transition-all"
          style={{
            backgroundColor: '#1C1C1E',
            color: '#FFFFFF',
            ...typography.body.BodyM,
          }}
        />
      </div>

      <hr className="border-white/10" />

      {/* 아이디 필드 */}
      <div className="flex flex-col gap-3">
        <label style={{ ...typography.body.BodyB }}>아이디</label>
        <input
          type="text"
          value={userId}
          readOnly
          className="w-full max-w-lg h-10 px-4 rounded-lg outline-none opacity-80 cursor-default"
          style={{
            backgroundColor: '#1C1C1E',
            color: '#FFFFFF',
            ...typography.body.BodyM,
          }}
        />
      </div>

      <hr className="border-white/10" />

      {/* 이메일 필드 */}
      <div className="flex flex-col gap-3">
        <label style={{ ...typography.body.BodyB }}>이메일</label>
        <input
          type="email"
          value={userEmail}
          readOnly
          className="w-full max-w-lg h-10 px-4 rounded-lg outline-none opacity-80 cursor-default"
          style={{
            backgroundColor: '#1C1C1E',
            color: '#FFFFFF',
            ...typography.body.BodyM,
          }}
        />
      </div>
    </section>
  );
}
