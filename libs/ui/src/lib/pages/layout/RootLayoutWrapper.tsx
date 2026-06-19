'use client';

import {
  ServerCreateProvider,
  ServerJoinedTeamProvider,
  ServerStateProvider,
  ProfileProvider,
  MeetingProvider,
} from '../../../context';
import { LoadingOverlay } from '../../components';
import { ServerModal } from '../../modals';
import { useModalStore } from '@org/shop-data';

export function RootLayoutWrapper({ children }: { children: React.ReactNode }) {
  const { isModalOpen, setIsModalOpen } = useModalStore();

  return (
    <ServerCreateProvider>
      <ServerJoinedTeamProvider>
        <ServerStateProvider>
          <ProfileProvider>
            <MeetingProvider>{children}</MeetingProvider>
            <ServerModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
            />
          </ProfileProvider>
          <LoadingOverlay />
        </ServerStateProvider>
      </ServerJoinedTeamProvider>
    </ServerCreateProvider>
  );
}
