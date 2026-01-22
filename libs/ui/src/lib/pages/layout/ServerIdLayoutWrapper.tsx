import {
  roomsrcList,
  userList,
  sidebarList,
  useServerJoinedTeam,
  useServerState,
} from '../../../context';
import { JoinedSideba } from '../../sidebar';
import { CalendarMockup, Header } from '../../components';

export function ServerIdLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setChatRoom, setServerProfile } = useServerState();
  const { joined, setSelectedRoomId } = useServerJoinedTeam();

  return (
    <div className="flex flex-1 overflow-hidden">
      <JoinedSideba
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
