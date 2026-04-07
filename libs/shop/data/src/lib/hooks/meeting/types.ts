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

export type ParticipantEngagementMetrics = {
  userId: string;
  voiceCount: number;
  chatCount: number;
  connectionSeconds: number;
  participationRate: number;
  participated: boolean;
};

export type TotalEngagementResponse = {
  meetingId: string;
  teamId: string;
  meetingDurationSeconds: number;
  createdAt: string;
  participants: ParticipantEngagementMetrics[];
};

export type IndividualEngagementResponse = {
  meetingId: string;
  userId: string;
  currentRate: number;
  averageRate: number;
  meetingCount: number;
};
