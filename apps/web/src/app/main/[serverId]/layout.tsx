import {
  JoinedSidebar,
  CalendarMockup,
  useServerState,
  Header,
} from '@meezy/ui';
import { roomsrcList, userList, sidebarList } from '@meezy/ui';
import { useServerJoinedTeam } from '@meezy/ui';

export default function ServerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setChatRoom, setServerProfile } = useServerState();
  const { joined, setSelectedRoomId } = useServerJoinedTeam();

  return (
    <div className="flex flex-1 overflow-hidden">
      <JoinedSidebar
        setChatRoom={setChatRoom}
        setSelectedRoomId={setSelectedRoomId}
        setServerProfile={setServerProfile}
        sidebarList={sidebarList}
        roomsrcList={roomsrcList}
        userList={userList}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {joined && <Header />}
        <div className="flex flex-1 overflow-hidden">
          {children}
          {joined && (
            <aside className="max-w-[270px] bg-[#111111] border border-white/5 p-6">
              <CalendarMockup />
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
