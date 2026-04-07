export type MeetingIceServer = {
  urls: string | string[];
  username?: string | null;
  credential?: string | null;
};

export type MeetingParticipant = {
  participantId?: string;
  userId?: string;
  name?: string;
  profileImageUrl?: string | null;
  joinedAt?: string;
};

export type MeetingResponse = {
  meetingId: string;
  teamId: string;
  hostUserId: string;
  status: string;
  startedAt: string;
  participants: MeetingParticipant[];
  iceServers: MeetingIceServer[];
};
