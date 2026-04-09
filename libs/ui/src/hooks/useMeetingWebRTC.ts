'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  type MeetingIceServer,
  useMeetingSignal,
  useMeetingEvents,
  useMeetingVoiceActivity,
  useMeetingStore,
  uploadMeetingRecording,
  logRecordingUpload,
  logRecordingVoice,
  getActiveMeetings,
  MeetingEvent,
  MeetingSignal,
} from '@org/shop-data';
import {
  convertRecordingBlobToMp3,
  encodePcmChunksToMp3,
} from './meeting-recording-mp3';

interface ParticipantStream {
  userId: string;
  stream: MediaStream;
  name?: string;
}

interface RemoteMediaState {
  audioEnabled: boolean;
  videoEnabled: boolean;
}

function getMeetingUserId(entity: any) {
  return String(
    entity?.userId ||
      entity?.user_id ||
      entity?.user?.userId ||
      entity?.user?.user_id ||
      entity?.user?.id ||
      entity?.id ||
      ''
  ).trim();
}

function normalizeIceServers(
  value?: MeetingIceServer[]
): RTCIceServer[] {
  if (!Array.isArray(value) || value.length === 0) {
    return [];
  }

  return value
    .map((server) => ({
      urls: server.urls,
      username: server.username || undefined,
      credential: server.credential || undefined,
    }))
    .filter((server) =>
      Array.isArray(server.urls) ? server.urls.length > 0 : Boolean(server.urls)
    );
}

const PREFERRED_RECORDING_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/ogg',
  'audio/wav',
  'audio/mpeg',
];

function getSupportedRecordingMimeType() {
  if (typeof MediaRecorder === 'undefined') {
    return '';
  }

  return (
    PREFERRED_RECORDING_MIME_TYPES.find((mimeType) =>
      MediaRecorder.isTypeSupported(mimeType)
    ) ?? ''
  );
}

function getRecordingFileExtension(mimeType?: string) {
  const normalizedMimeType = String(mimeType ?? '').toLowerCase();

  if (normalizedMimeType.includes('webm')) return 'webm';
  if (normalizedMimeType.includes('ogg')) return 'ogg';
  if (normalizedMimeType.includes('wav')) return 'wav';
  if (normalizedMimeType.includes('mpeg') || normalizedMimeType.includes('mp3')) {
    return 'mp3';
  }

  return 'webm';
}

function getRecordingFileName(mimeType?: string) {
  return `recording.${getRecordingFileExtension(mimeType)}`;
}

export function useMeetingWebRTC(
  teamId: string,
  myId: string,
  localIds: string[],
  isActive: boolean
) {
  console.log('[DEBUG] useMeetingWebRTC initialized', { teamId, myId, isActive });
  const {
    meetingId,
    iceServers: meetingIceServers,
    setIsUploading,
    isRecording,
    setIsRecording,
    setStartTime,
    recordingElapsedMs,
    setRecordingElapsedMs,
  } = useMeetingStore();
  const iceServers = useRef<RTCIceServer[]>(normalizeIceServers(meetingIceServers));
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<ParticipantStream[]>([]);
  const [remoteMediaStates, setRemoteMediaStates] = useState<
    Record<string, RemoteMediaState>
  >({});
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [remoteVoices, setRemoteVoices] = useState<Record<string, boolean>>({});
  const remoteVoiceTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const pendingIceCandidates = useRef<
    Map<string, RTCIceCandidateInit[]>
  >(new Map());

  const pcs = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const speakingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const localSpeakingRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const isVADInitializingRef = useRef(false);
  // Recording Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef<string | null>(null);
  const recordingMimeTypeRef = useRef<string>('');
  const recordingMixContextRef = useRef<AudioContext | null>(null);
  const recordingDestinationRef =
    useRef<MediaStreamAudioDestinationNode | null>(null);
  const recordingMixGainRef = useRef<GainNode | null>(null);
  const recordingSourceNodesRef = useRef<MediaStreamAudioSourceNode[]>([]);
  const recordingSourceStreamsRef = useRef<MediaStream[]>([]);
  const mixedRecordingStreamRef = useRef<MediaStream | null>(null);
  const recordingProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const recordingMonitorGainRef = useRef<GainNode | null>(null);
  const recordingPcmLeftChunksRef = useRef<Float32Array[]>([]);
  const recordingPcmRightChunksRef = useRef<Float32Array[]>([]);
  const recordingPcmSampleRateRef = useRef<number>(44100);
  const stopAndUploadInProgressRef = useRef(false);
  const lastUploadedMeetingIdRef = useRef<string>('');

  const teamIdRef = useRef(teamId);
  const meetingIdRef = useRef(meetingId);
  const localIdsRef = useRef<string[]>([]);

  const log = useCallback((_msg: string, _data?: any) => {}, []);

  useEffect(() => {
    teamIdRef.current = teamId;
    meetingIdRef.current = meetingId;
    localIdsRef.current = localIds;
  }, [localIds, meetingId, teamId]);

  useEffect(() => {
    iceServers.current = normalizeIceServers(meetingIceServers);
    log('[WebRTC] active iceServers updated', iceServers.current);
  }, [log, meetingIceServers]);

  useEffect(() => {
    log('[WebRTC] lifecycle snapshot', {
      myId,
      meetingId,
      teamId,
      isActive,
      localIds,
    });
  }, [isActive, localIds, log, meetingId, myId, teamId]);

  useEffect(() => {
    log(
      '[WebRTC] remoteStreams snapshot',
      remoteStreams.map((entry) => ({
        userId: entry.userId,
        audioTracks: entry.stream.getAudioTracks().map((track) => ({
          id: track.id,
          enabled: track.enabled,
          readyState: track.readyState,
          muted: track.muted,
        })),
        videoTracks: entry.stream.getVideoTracks().map((track) => ({
          id: track.id,
          enabled: track.enabled,
          readyState: track.readyState,
          muted: track.muted,
        })),
      }))
    );
  }, [log, remoteStreams]);

  const shouldInitiateOffer = useCallback((firstId: string, secondId: string) => {
    return firstId.localeCompare(secondId, undefined, {
      numeric: true,
      sensitivity: 'base',
    }) < 0;
  }, []);

  const removeParticipant = useCallback((userId: string) => {
    const pc = pcs.current.get(userId);
    if (pc) {
      pc.close();
      pcs.current.delete(userId);
    }
    if (remoteVoiceTimers.current[userId]) {
      clearTimeout(remoteVoiceTimers.current[userId]);
      delete remoteVoiceTimers.current[userId];
    }
    pendingIceCandidates.current.delete(userId);
    setRemoteVoices((prev) => {
      if (!(userId in prev)) return prev;
      const next = { ...prev };
      delete next[userId];
      return next;
    });
    setRemoteMediaStates((prev) => {
      if (!(userId in prev)) return prev;
      const next = { ...prev };
      delete next[userId];
      return next;
    });
    setRemoteStreams((prev) => prev.filter((s) => s.userId !== userId));
  }, []);

  const cleanupRecordingMix = useCallback(() => {
    if (recordingProcessorRef.current) {
      try {
        recordingProcessorRef.current.disconnect();
      } catch {}
      recordingProcessorRef.current.onaudioprocess = null;
      recordingProcessorRef.current = null;
    }

    if (recordingMixGainRef.current) {
      try {
        recordingMixGainRef.current.disconnect();
      } catch {}
      recordingMixGainRef.current = null;
    }

    if (recordingMonitorGainRef.current) {
      try {
        recordingMonitorGainRef.current.disconnect();
      } catch {}
      recordingMonitorGainRef.current = null;
    }

    recordingSourceNodesRef.current.forEach((sourceNode) => {
      try {
        sourceNode.disconnect();
      } catch {
        // noop
      }
    });
    recordingSourceNodesRef.current = [];
    recordingSourceStreamsRef.current = [];

    if (mixedRecordingStreamRef.current) {
      mixedRecordingStreamRef.current.getTracks().forEach((track) => track.stop());
      mixedRecordingStreamRef.current = null;
    }

    recordingDestinationRef.current = null;
    recordingPcmLeftChunksRef.current = [];
    recordingPcmRightChunksRef.current = [];

    if (recordingMixContextRef.current) {
      const context = recordingMixContextRef.current;
      recordingMixContextRef.current = null;
      if (context.state !== 'closed') {
        void context.close().catch(() => undefined);
      }
    }
  }, []);

  const syncRecordingMix = useCallback(
    async (streams: ParticipantStream[]) => {
      const context = recordingMixContextRef.current;
      const destination = recordingDestinationRef.current;
      const mixGain = recordingMixGainRef.current;

      if (!context || !destination || !mixGain) {
        return 0;
      }

      recordingSourceNodesRef.current.forEach((sourceNode) => {
        try {
          sourceNode.disconnect();
        } catch {
          // noop
        }
      });
      recordingSourceNodesRef.current = [];
      recordingSourceStreamsRef.current = [];

      const sourceStreams: MediaStream[] = [];

      const appendAudioSource = (stream: MediaStream | null) => {
        if (!stream) return;

        const activeAudioTracks = stream
          .getAudioTracks()
          .filter((track) => track.readyState === 'live');

        if (activeAudioTracks.length === 0) {
          return;
        }

        const audioOnlyStream = new MediaStream(activeAudioTracks);
        const sourceNode = context.createMediaStreamSource(audioOnlyStream);
        sourceNode.connect(mixGain);
        recordingSourceNodesRef.current.push(sourceNode);
        sourceStreams.push(audioOnlyStream);
      };

      appendAudioSource(localStreamRef.current);
      streams.forEach((participant) => appendAudioSource(participant.stream));

      recordingSourceStreamsRef.current = sourceStreams;

      if (context.state === 'suspended') {
        await context.resume().catch(() => undefined);
      }

      return recordingSourceNodesRef.current.length;
    },
    []
  );

  const ensureMixedRecordingStream = useCallback(async () => {
    cleanupRecordingMix();

    const AudioContextClass =
      window.AudioContext || ((window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);

    if (!AudioContextClass) {
      log('[WARN] AudioContext is not available for recording mix');
      return null;
    }

    const context = new AudioContextClass();
    const destination = context.createMediaStreamDestination();
    const mixGain = context.createGain();
    mixGain.gain.value = 1;
    recordingMixContextRef.current = context;
    recordingDestinationRef.current = destination;
    recordingMixGainRef.current = mixGain;
    mixGain.connect(destination);

    const sourceCount = await syncRecordingMix(remoteStreams);
    if (sourceCount === 0) {
      log('[WARN] mixed recording stream has no audio sources');
      cleanupRecordingMix();
      return null;
    }

    mixedRecordingStreamRef.current = destination.stream;
    recordingPcmSampleRateRef.current = context.sampleRate;
    const processor = context.createScriptProcessor(4096, 2, 2);
    const monitorGain = context.createGain();
    monitorGain.gain.value = 0;

    processor.onaudioprocess = (event) => {
      const inputBuffer = event.inputBuffer;
      if (!inputBuffer || inputBuffer.length === 0) {
        return;
      }

      const left = new Float32Array(inputBuffer.getChannelData(0));
      recordingPcmLeftChunksRef.current.push(left);

      if (inputBuffer.numberOfChannels > 1) {
        const right = new Float32Array(inputBuffer.getChannelData(1));
        recordingPcmRightChunksRef.current.push(right);
      }
    };

    mixGain.connect(processor);
    processor.connect(monitorGain);
    monitorGain.connect(context.destination);

    recordingProcessorRef.current = processor;
    recordingMonitorGainRef.current = monitorGain;
    return destination.stream;
  }, [cleanupRecordingMix, log, remoteStreams, syncRecordingMix]);

  const teardownMeetingMedia = useCallback(() => {
    const shouldPreserveRecordingState =
      stopAndUploadInProgressRef.current ||
      mediaRecorderRef.current?.state === 'recording' ||
      Boolean(recordingStartedAtRef.current);

    Object.values(remoteVoiceTimers.current).forEach((timer) => clearTimeout(timer));
    remoteVoiceTimers.current = {};
    pendingIceCandidates.current.clear();
    pcs.current.forEach((pc) => pc.close());
    pcs.current.clear();
    setRemoteVoices({});
    setRemoteMediaStates({});
    setRemoteStreams([]);

    if (!shouldPreserveRecordingState && localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (!shouldPreserveRecordingState) {
      setLocalStream(null);
    }
    setIsRecording(false);
    setStartTime(null);
    setRecordingElapsedMs(0);

    if (!shouldPreserveRecordingState) {
      recordingStartedAtRef.current = null;
      recordingMimeTypeRef.current = '';
      mediaRecorderRef.current = null;
      recordedChunksRef.current = [];
      cleanupRecordingMix();
    }
  }, [cleanupRecordingMix, setIsRecording, setRecordingElapsedMs, setStartTime]);

  const getMeetingParticipantIds = useCallback(async () => {
    if (!teamIdRef.current) {
      return [];
    }

    const activeMeeting = await getActiveMeetings(teamIdRef.current);
    if (!Array.isArray(activeMeeting?.participants)) return [];

    return activeMeeting.participants
      .map((participant: any) => getMeetingUserId(participant))
      .filter(
        (participantId: string) =>
          participantId && !localIdsRef.current.includes(participantId)
        );
  }, []);

  const getLocalMediaState = useCallback((): RemoteMediaState => {
    const stream = localStreamRef.current;

    return {
      audioEnabled:
        stream?.getAudioTracks().some((track) => track.readyState === 'live' && track.enabled) ??
        false,
      videoEnabled:
        stream?.getVideoTracks().some((track) => track.readyState === 'live' && track.enabled) ??
        false,
    };
  }, []);

  const broadcastLocalMediaState = useCallback(
    async (targetUserIds?: string[]) => {
      if (!sendSignalRef.current || !myId) {
        return;
      }

      const participantIds =
        targetUserIds?.filter(
          (participantId) => participantId && !localIdsRef.current.includes(String(participantId))
        ) ?? (await getMeetingParticipantIds());

      if (participantIds.length === 0) {
        return;
      }

      const mediaState = getLocalMediaState();
      participantIds.forEach((participantId) => {
        sendSignalRef.current?.(participantId, {
          type: 'media-state',
          fromUserId: myId,
          toUserId: participantId,
          audioEnabled: mediaState.audioEnabled,
          videoEnabled: mediaState.videoEnabled,
        });
      });
    },
    [getLocalMediaState, getMeetingParticipantIds, myId]
  );

  const broadcastRecordingState = useCallback(
    async (
      type: 'recording-started' | 'recording-stopped',
      startedAt?: string,
      elapsedMs?: number
    ) => {
      try {
        const participantIds = await getMeetingParticipantIds();
        participantIds.forEach((participantId: string) => {
          sendSignalRef.current?.(participantId, {
            type,
            fromUserId: myId,
            toUserId: participantId,
            startedAt,
            elapsedMs,
          });
        });
      } catch (error) {
        log('[WARN] recording state broadcast failed', error);
      }
    },
    [getMeetingParticipantIds, log, myId]
  );

  const getOrCreatePC = useCallback(
    (targetUserId: string) => {
      const existingPc = pcs.current.get(targetUserId);
      if (existingPc) {
        if (
          existingPc.connectionState !== 'closed' &&
          existingPc.connectionState !== 'failed' &&
          existingPc.connectionState !== 'disconnected'
        ) {
          return existingPc;
        }

        existingPc.close();
        pcs.current.delete(targetUserId);
      }

      console.log(`Creating PeerConnection for: ${targetUserId}`);
      const pc = new RTCPeerConnection({
        iceServers: iceServers.current,
      });
      log(`[WebRTC] ICE servers for ${targetUserId}`, iceServers.current);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          log(`[WebRTC] local ICE candidate for ${targetUserId}`, {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
          });
          sendSignalRef.current?.(targetUserId, {
            type: 'ice-candidate',
            fromUserId: myId,
            toUserId: targetUserId,
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid || undefined,
            sdpMLineIndex: event.candidate.sdpMLineIndex ?? undefined,
          });
        }
      };

      pc.onicecandidateerror = (event) => {
        log(`[WebRTC] ICE candidate error for ${targetUserId}`, {
          address: event.address,
          port: event.port,
          url: event.url,
          errorCode: event.errorCode,
          errorText: event.errorText,
        });
      };

      pc.ontrack = (event) => {
        log(`[WebRTC] ontrack from ${targetUserId}: ${event.track.kind}`);
        setRemoteStreams((prev) => {
          const existingParticipant = prev.find(
            (ps) => ps.userId === targetUserId
          );

          if (existingParticipant) {
            // ?뵦 以묒슂: MediaStream 媛앹껜??李몄“瑜??덈줈 ?앹꽦?댁빞 React媛 蹂寃쎌쓣 媛먯??섍퀬 
            // Video ?붿냼??srcObject瑜?媛깆떊?섏뿬 ?ㅻ뵒??鍮꾨뵒?ㅺ? 紐⑤몢 ?뺤긽 異쒕젰?⑸땲??
            const newStream = new MediaStream(existingParticipant.stream.getTracks());
            const incomingTracks = event.streams[0] 
              ? event.streams[0].getTracks() 
              : [event.track];

            incomingTracks.forEach((track) => {
              const hasTrack = newStream
                .getTracks()
                .some((existingTrack) => existingTrack.id === track.id);

              if (!hasTrack) {
                newStream.addTrack(track);
              }
            });

            return prev.map((participant) =>
              participant.userId === targetUserId
                ? { ...participant, stream: newStream }
                : participant
            );
          }

          // 泥??몃옓??寃쎌슦?먮룄 ?덈줈??MediaStream?쇰줈 媛먯떥??愿由?
          const firstStream = event.streams[0] 
            ? new MediaStream(event.streams[0].getTracks()) 
            : new MediaStream([event.track]);
            
          return [...prev, { userId: targetUserId, stream: firstStream }];
        });
      };

      pc.oniceconnectionstatechange = () => {
        log(
          `[WebRTC] iceConnectionState for ${targetUserId}: ${pc.iceConnectionState}`
        );
      };

      pc.onicegatheringstatechange = () => {
        log(
          `[WebRTC] iceGatheringState for ${targetUserId}: ${pc.iceGatheringState}`
        );
      };

      pc.onsignalingstatechange = () => {
        log(`[WebRTC] signalingState for ${targetUserId}: ${pc.signalingState}`);
      };

      pc.onconnectionstatechange = () => {
        log(
          `[WebRTC] connectionState for ${targetUserId}: ${pc.connectionState}`
        );
        if (
          pc.connectionState === 'disconnected' ||
          pc.connectionState === 'failed' ||
          pc.connectionState === 'closed'
        ) {
          removeParticipant(targetUserId);
        }
      };

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      pc.onnegotiationneeded = async () => {
        try {
          if (pc.signalingState !== 'stable') return;
          // [PATCH] ?덉씠??而⑤뵒???닿껐???꾪빐 紐⑤뱺 李멸??먭? offer瑜?蹂대궪 ???덈룄濡??덉슜?섎릺,
          // onSignal ?먯꽌 "polite" ?꾨왂?쇰줈 glare(?숈떆 ?ㅽ띁) 異⑸룎???닿껐?⑸땲??
          // ?먮뒗, ?덉쟾?섍쾶 ID媛 ?묒? 履쎈쭔 ?좉퇋 ?몃옓??????ㅽ띁瑜?蹂대궡?꾨줉 ?좎??????덉?留?
          // ??寃쎌슦 Impolite ?ъ슜?먭? ?몃옓??異붽??덉쓣 ???곷?媛 ??諛⑸쾿???놁쑝誘濡??ㅽ띁瑜?蹂대깄?덈떎.
          log(`[WebRTC] Negotiation needed for ${targetUserId}, sending offer`);
          const offer = await pc.createOffer();
          log(`[WebRTC] offer created for ${targetUserId}`);
          await pc.setLocalDescription(offer);
          log(`[WebRTC] local offer applied for ${targetUserId}`);
          if (!sendSignalRef.current) {
            log(`[WebRTC] sendSignalRef missing for ${targetUserId}`);
            return;
          }
          log(`[WebRTC] invoking sendSignal for ${targetUserId}`);
          sendSignalRef.current(targetUserId, {
            type: 'offer',
            fromUserId: myId,
            toUserId: targetUserId,
            sdp: offer.sdp,
          });
          log(`[WebRTC] offer dispatched for ${targetUserId}`);
        } catch (err) {
          console.error('[WebRTC] Negotiation offer error:', err);
        }
      };

      pcs.current.set(targetUserId, pc);
      return pc;
    },
    [myId, removeParticipant]
  );

  const sendSignalRef = useRef<any>(null);
  const onSignal = useCallback(
    async (signal: MeetingSignal) => {
      const {
        type,
        fromUserId,
        toUserId,
        sdp,
        candidate,
        sdpMid,
        sdpMLineIndex,
      } = signal;
      if (!localIdsRef.current.includes(String(toUserId))) {
        log('[WebRTC] signal arrived on personal queue with unmatched toUserId; processing anyway', {
          type,
          fromUserId,
          toUserId,
          localIds: localIdsRef.current,
        });
      }

      if (type === 'recording-started') {
        recordingStartedAtRef.current = signal.startedAt || new Date().toISOString();
        setIsRecording(true);
        setStartTime(recordingStartedAtRef.current);
        setRecordingElapsedMs(Math.max(0, signal.elapsedMs ?? 0));
        return;
      } else if (type === 'recording-stopped') {
        recordingStartedAtRef.current = null;
        setIsRecording(false);
        setStartTime(null);
        setRecordingElapsedMs(Math.max(0, signal.elapsedMs ?? 0));
        return;
      } else if (type === 'media-state') {
        setRemoteMediaStates((prev) => ({
          ...prev,
          [fromUserId]: {
            audioEnabled: signal.audioEnabled ?? true,
            videoEnabled: signal.videoEnabled ?? true,
          },
        }));
        return;
      } else if (type === 'offer') {
        try {
          const pc = getOrCreatePC(fromUserId);
          const offerCollision = pc.signalingState !== 'stable';
          if (offerCollision) {
            log(
              `[WebRTC] Glare detected, rolling back to accept offer from ${fromUserId}`
            );
            await pc.setLocalDescription({ type: 'rollback' } as any);
          }

          log(`[WebRTC] applying remote offer from ${fromUserId}`);
          await pc.setRemoteDescription(
            new RTCSessionDescription({ type: 'offer', sdp })
          );
          log(`[WebRTC] remote offer applied from ${fromUserId}`);
          const pendingCandidates =
            pendingIceCandidates.current.get(fromUserId) ?? [];
          for (const queuedCandidate of pendingCandidates) {
            await pc.addIceCandidate(new RTCIceCandidate(queuedCandidate));
          }
          pendingIceCandidates.current.delete(fromUserId);
          log(`[WebRTC] creating local answer for ${fromUserId}`);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          log(`[WebRTC] local answer created for ${fromUserId}`);
          if (!sendSignalRef.current) {
            log(`[WebRTC] sendSignalRef missing for answer to ${fromUserId}`);
            return;
          }
          log(`[WebRTC] invoking sendSignal for answer to ${fromUserId}`);
          sendSignalRef.current(fromUserId, {
            type: 'answer',
            fromUserId: myId,
            toUserId: fromUserId,
            sdp: answer.sdp,
          });
          log(`[WebRTC] answer dispatched to ${fromUserId}`);
        } catch (error) {
          console.error(`[WebRTC] offer handling failed for ${fromUserId}`, error, {
            myId,
            toUserId,
            signalingState: pcs.current.get(fromUserId)?.signalingState,
            connectionState: pcs.current.get(fromUserId)?.connectionState,
          });
        }
      } else if (type === 'answer') {
        const pc = pcs.current.get(fromUserId);
        if (pc) {
          await pc.setRemoteDescription(
            new RTCSessionDescription({ type: 'answer', sdp })
          );
          log(`[WebRTC] remote answer applied from ${fromUserId}`);
          const pendingCandidates =
            pendingIceCandidates.current.get(fromUserId) ?? [];
          for (const queuedCandidate of pendingCandidates) {
            await pc.addIceCandidate(new RTCIceCandidate(queuedCandidate));
          }
          pendingIceCandidates.current.delete(fromUserId);
        }
      } else if (type === 'ice-candidate') {
        log(`[WebRTC] remote ICE candidate received from ${fromUserId}`, {
          candidate,
          sdpMid,
          sdpMLineIndex,
        });
        const pc = pcs.current.get(fromUserId);
        if (pc?.remoteDescription) {
          await pc.addIceCandidate(
            new RTCIceCandidate({ candidate, sdpMid, sdpMLineIndex })
          );
          log(`[WebRTC] remote ICE candidate applied from ${fromUserId}`);
        } else {
          const queued = pendingIceCandidates.current.get(fromUserId) ?? [];
          queued.push({ candidate, sdpMid, sdpMLineIndex });
          pendingIceCandidates.current.set(fromUserId, queued);
          log(`[WebRTC] remote ICE candidate queued for ${fromUserId}`);
        }
      }
    },
    [getOrCreatePC, myId, setIsRecording, setStartTime]
  );

  const { sendSignal } = useMeetingSignal(teamId, myId, onSignal);
  sendSignalRef.current = sendSignal;

  const createAndSendOffer = useCallback(
    async (targetUserId: string) => {
      log('[WebRTC] createAndSendOffer called', {
        targetUserId,
        myId,
        localIds: localIdsRef.current,
      });

      if (!myId) {
        log(`[WebRTC] skipping explicit offer for ${targetUserId}; myId is empty`);
        return;
      }
      if (localIdsRef.current.includes(String(targetUserId))) {
        log(
          `[WebRTC] skipping explicit offer for ${targetUserId}; target is recognized as local`
        );
        return;
      }

      const pc = getOrCreatePC(targetUserId);
      if (pc.signalingState !== 'stable') {
        log(
          `[WebRTC] skipping explicit offer for ${targetUserId}; signalingState=${pc.signalingState}`
        );
        return;
      }

      try {
        log(`[WebRTC] explicit offer start for ${targetUserId}`);
        const offer = await pc.createOffer();
        log(`[WebRTC] explicit offer created for ${targetUserId}`);
        await pc.setLocalDescription(offer);
        log(`[WebRTC] explicit local description set for ${targetUserId}`);
        if (!sendSignalRef.current) {
          log(`[WebRTC] explicit sendSignalRef missing for ${targetUserId}`);
          return;
        }
        log(`[WebRTC] explicit invoking sendSignal for ${targetUserId}`);
        sendSignalRef.current(targetUserId, {
          type: 'offer',
          fromUserId: myId,
          toUserId: targetUserId,
          sdp: offer.sdp,
        });
        log(`[WebRTC] explicit offer dispatched for ${targetUserId}`);
      } catch (error) {
        log(`[WebRTC] explicit offer failed for ${targetUserId}`, error);
      }
    },
    [getOrCreatePC, log, myId]
  );

  const onVoiceActivity = useCallback(
    (activity: any) => {
      const { userId, isSpeaking: speaking } = activity;
      if (localIdsRef.current.includes(String(userId))) return;

      if (speaking) {
        setRemoteVoices((prev) => ({ ...prev, [userId]: true }));

        if (remoteVoiceTimers.current[userId]) {
          clearTimeout(remoteVoiceTimers.current[userId]);
        }

        remoteVoiceTimers.current[userId] = setTimeout(() => {
          setRemoteVoices((prev) => ({ ...prev, [userId]: false }));
          delete remoteVoiceTimers.current[userId];
        }, 1500);
      } else {
        if (remoteVoiceTimers.current[userId]) {
          clearTimeout(remoteVoiceTimers.current[userId]);
          delete remoteVoiceTimers.current[userId];
        }
        setRemoteVoices((prev) => ({ ...prev, [userId]: false }));
      }
    },
    [myId]
  );

  const { sendVoiceActivity } = useMeetingVoiceActivity(
    meetingId,
    myId,
    onVoiceActivity
  );

  useEffect(() => {
    sendSignalRef.current = sendSignal;
  }, [sendSignal]);

  useEffect(() => {
    if (!isRecording || !meetingId || !teamId || !mediaRecorderRef.current) return;

    const startedAt = recordingStartedAtRef.current || new Date().toISOString();
    const intervalId = setInterval(() => {
      void broadcastRecordingState(
        'recording-started',
        startedAt,
        recordingElapsedMs
      );
    }, 3000);

    return () => clearInterval(intervalId);
  }, [broadcastRecordingState, isRecording, meetingId, recordingElapsedMs, teamId]);

  useEffect(() => {
    if (!isRecording || !recordingDestinationRef.current) {
      return;
    }

    void syncRecordingMix(remoteStreams);
  }, [isRecording, localStream, remoteStreams, syncRecordingMix]);

  const connectToUser = useCallback(
    async (targetUserId: string) => {
      if (!myId) {
        log(`[WebRTC] skipping connectToUser for ${targetUserId}; myId is empty`);
        return;
      }
      if (localIdsRef.current.includes(String(targetUserId))) {
        log(
          `[WebRTC] skipping connectToUser for ${targetUserId}; target is recognized as local`
        );
        return;
      }
      getOrCreatePC(targetUserId);
    },
    [myId, getOrCreatePC]
  );

  const toggleAudioEnabled = useCallback(
    async (enabled: boolean) => {
      const stream = localStreamRef.current;

      if (!stream) {
        return false;
      }

      const audioTracks = stream
        .getAudioTracks()
        .filter((track) => track.readyState === 'live');

      if (audioTracks.length === 0) {
        return false;
      }

      audioTracks.forEach((track) => {
        track.enabled = enabled;
      });

      await broadcastLocalMediaState();
      return enabled;
    },
    [broadcastLocalMediaState]
  );

  const toggleVideoEnabled = useCallback(
    async (enabled: boolean) => {
      const stream = localStreamRef.current;

      if (!stream) {
        return false;
      }

      const videoTracks = stream
        .getVideoTracks()
        .filter((track) => track.readyState === 'live');

      if (videoTracks.length === 0) {
        return false;
      }

      videoTracks.forEach((track) => {
        track.enabled = enabled;
      });

      await broadcastLocalMediaState();
      return enabled;
    },
    [broadcastLocalMediaState]
  );

  const onMeetingEvent = useCallback(
    async (event: MeetingEvent) => {
      log('[WebRTC] onMeetingEvent entered', {
        myId,
        isActive,
        event,
      });
      if (!myId) {
        log('[WebRTC] ignoring meeting event until myId is ready', event);
        return;
      }
      log('meeting event received', event);
      switch (event.type) {
        case 'participant-joined':
          // 1. ?닿? ?묒냽?덉쓣 ?? ?대? ?덈뒗 李멸??먮뱾(existingParticipantIds)?먭쾶 ?곌껐 ?쒕룄
          if (
            event.joinedUserId &&
            localIdsRef.current.includes(String(event.joinedUserId)) &&
            event.existingParticipantIds
          ) {
            log(`I joined. Connecting to existing participants: ${event.existingParticipantIds}`);
            const remoteParticipantIds = event.existingParticipantIds.filter(
              (pId) => !localIdsRef.current.includes(String(pId))
            );
            event.existingParticipantIds.forEach((pId) => {
              if (!localIdsRef.current.includes(String(pId))) {
                // Polite 諛쒖넚 ?꾨왂: ID媛 ???묒? 履쎌씠 癒쇱? Offer瑜?蹂대깂
                if (shouldInitiateOffer(myId, pId)) {
                  log(`polite initiation (existing): sending offer to ${pId}`);
                  void createAndSendOffer(pId);
                } else {
                  log(`polite initiation (existing): waiting for offer from ${pId}`);
                }
              }
            });
            void broadcastLocalMediaState(remoteParticipantIds);
          }
          // 2. ?ㅻⅨ ?щ엺???묒냽?덉쓣 ?? ?대떦 李멸??먯뿉寃??곌껐 ?쒕룄
          else if (
            event.joinedUserId &&
            !localIdsRef.current.includes(String(event.joinedUserId))
          ) {
            void broadcastLocalMediaState([event.joinedUserId]);
            if (shouldInitiateOffer(myId, event.joinedUserId)) {
              log(`polite initiation (newcomer): sending offer to ${event.joinedUserId}`);
              void createAndSendOffer(event.joinedUserId);
            } else {
              log(`polite initiation (newcomer): waiting for offer from ${event.joinedUserId}`);
            }
          }
          break;
        case 'participant-left':
          if (event.leftUserId) {
            removeParticipant(event.leftUserId);
          }
          break;
        case 'meeting-ended':
          log('meeting-ended event received, cleaning up');
          teardownMeetingMedia();
          break;
      }
    },
    [broadcastLocalMediaState, createAndSendOffer, myId, removeParticipant, connectToUser, log, shouldInitiateOffer, teardownMeetingMedia]
  );

  useMeetingEvents(teamId, onMeetingEvent);

  useEffect(() => {
    log('[WebRTC] syncParticipants effect entered', {
      teamId,
      meetingId,
      isActive,
      myId,
    });
    if (!teamId || !meetingId || !isActive || !myId) {
      log('[WebRTC] syncParticipants effect blocked', {
        teamId,
        meetingId,
        isActive,
        myId,
      });
      return;
    }

    const syncParticipants = async () => {
      try {
        log('[WebRTC] syncParticipants run start');
        const participantIds = await getMeetingParticipantIds();
        log('[WebRTC] syncParticipants resolved ids', participantIds);

        participantIds.forEach((participantId: string) => {
          const existingPc = pcs.current.get(participantId);
          if (
            existingPc &&
            existingPc.connectionState !== 'closed' &&
            existingPc.connectionState !== 'failed' &&
            existingPc.connectionState !== 'disconnected'
          ) {
            return;
          }

          if (shouldInitiateOffer(myId, participantId)) {
            void createAndSendOffer(participantId);
            return;
          }

          void connectToUser(participantId);
        });
      } catch (error) {
        log('[WARN] participant sync failed', error);
      }
    };

    void syncParticipants();
    const intervalId = setInterval(() => {
      void syncParticipants();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [connectToUser, createAndSendOffer, getMeetingParticipantIds, isActive, log, meetingId, myId, shouldInitiateOffer, teamId]);

  const startRecording = useCallback(() => {
    log('startRecording entry point');
    if (typeof MediaRecorder === 'undefined') {
      log('[ERROR] MediaRecorder is NOT supported in this browser');
      return;
    }
    if (!localStreamRef.current) {
      log('[WARN] startRecording aborted: localStreamRef.current is null');
      return;
    }

    log('MediaRecorder initializing...');
    recordedChunksRef.current = [];
    const selectedMimeType = getSupportedRecordingMimeType();

    const startedAt = new Date().toISOString();
    const beginRecorder = (recorder: MediaRecorder, mimeType: string) => {
      mediaRecorderRef.current = recorder;
      recordingMimeTypeRef.current = mimeType;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        log(
          'MediaRecorder stopped internally. Chunks collected:',
          recordedChunksRef.current.length
        );
      };

      recorder.start(1000);
      setIsRecording(true);
      setStartTime(startedAt);
      void broadcastRecordingState(
        'recording-started',
        startedAt,
        recordingElapsedMs
      );
      log('MediaRecorder SUCCESS. state:', recorder.state);
      log('MIME Type selected:', recorder.mimeType || mimeType);
    };

    recordingStartedAtRef.current = startedAt;

    void ensureMixedRecordingStream()
      .then((mixedStream) => {
        if (!mixedStream) {
          throw new Error('recording mix stream is unavailable');
        }

        const recorder = new MediaRecorder(mixedStream, {
          mimeType: selectedMimeType || undefined,
        });
        beginRecorder(recorder, recorder.mimeType || selectedMimeType);
      })
      .catch((error) => {
        log('[ERROR] MediaRecorder instantiation/start failed', error);

        try {
          const fallbackStream = mixedRecordingStreamRef.current || localStreamRef.current;
          if (!fallbackStream) {
            throw new Error('fallback recording stream is unavailable');
          }

          const fallbackRecorder = new MediaRecorder(fallbackStream);
          beginRecorder(fallbackRecorder, fallbackRecorder.mimeType || selectedMimeType);
        } catch (fallbackError) {
          log(
            '[CRITICAL ERROR] Fallback MediaRecorder instantiation/start failed',
            fallbackError
          );
          recordingStartedAtRef.current = null;
          cleanupRecordingMix();
        }
      });
  }, [
    broadcastRecordingState,
    cleanupRecordingMix,
    ensureMixedRecordingStream,
    log,
    recordingElapsedMs,
    setIsRecording,
    setRecordingElapsedMs,
    setStartTime,
  ]);

  const stopRecording = useCallback(() => {
    log('stopRecording triggered manually');
    const startedAt = recordingStartedAtRef.current;
    const nextElapsedMs =
      startedAt != null
        ? recordingElapsedMs +
          Math.max(0, Date.now() - new Date(startedAt).getTime())
        : recordingElapsedMs;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setStartTime(null);
    setRecordingElapsedMs(nextElapsedMs);
    recordingStartedAtRef.current = null;
    void broadcastRecordingState('recording-stopped', undefined, nextElapsedMs);
  }, [
    broadcastRecordingState,
    log,
    recordingElapsedMs,
    setIsRecording,
    setRecordingElapsedMs,
    setStartTime,
  ]);

  const initLocalMedia = useCallback(async () => {
    log('initLocalMedia starting...');
    try {
      const previousStream = localStreamRef.current;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      log('getUserMedia SUCCESS. stream tracks:', stream.getTracks().length);
      log('[WebRTC] local stream track details', {
        audioTracks: stream.getAudioTracks().map((track) => ({
          id: track.id,
          enabled: track.enabled,
          readyState: track.readyState,
          muted: track.muted,
          label: track.label,
        })),
        videoTracks: stream.getVideoTracks().map((track) => ({
          id: track.id,
          enabled: track.enabled,
          readyState: track.readyState,
          muted: track.muted,
          label: track.label,
        })),
      });
      setLocalStream(stream);
      localStreamRef.current = stream;

      // ?뵦 ?덉씠??而⑤뵒???닿껐: ?대? ?앹꽦??PeerConnection???덈떎硫??몃옓 異붽?
      pcs.current.forEach((pc, targetId) => {
        const senders = pc.getSenders();
        stream.getTracks().forEach((track) => {
          // 以묐났 異붽? 諛⑹?
          const sender = senders.find((s) => s.track?.kind === track.kind);
          if (sender) {
            log(`Replacing ${track.kind} track on existing PC: ${targetId}`);
            void sender.replaceTrack(track);
          } else {
            log(`Adding ${track.kind} track to existing PC: ${targetId}`);
            pc.addTrack(track, stream);
          }
        });

        // Offer ?щ컻?≪씠 ?꾩슂??寃쎌슦 (?꾩슂 ??negotiationneeded ?대깽???쒖슜 媛??
        // ?ш린?쒕뒗 媛꾨떒???ㅼ떆 offer瑜?蹂대궪 ?섎룄 ?덉쓬
      });

      previousStream?.getTracks().forEach((track) => track.stop());
      void broadcastLocalMediaState();
      return stream;
    } catch (error) {
      log('[ERROR] initLocalMedia failed', error);
      return null;
    }
  }, [broadcastLocalMediaState, log]);

  // VAD Loop logic
  useEffect(() => {
    if (!localStream) return;
    const initVAD = async () => {
      if (isVADInitializingRef.current) return;
      isVADInitializingRef.current = true;
      try {
        if (!audioContextRef.current) {
          const AC = window.AudioContext || (window as any).webkitAudioContext;
          if (AC) audioContextRef.current = new AC();
        }
        const ctx = audioContextRef.current;
        if (ctx && ctx.state === 'suspended') {
          const resume = () => ctx.resume().catch(() => {});
          window.addEventListener('click', resume, { once: true });
        }
        if (ctx && !analyserRef.current) {
          const source = ctx.createMediaStreamSource(localStream);
          analyserRef.current = ctx.createAnalyser();
          analyserRef.current.fftSize = 256;
          source.connect(analyserRef.current);
        }
        if (!analyserRef.current) return;

        const frequencyData = new Uint8Array(
          analyserRef.current.frequencyBinCount
        );
        const timeDomainData = new Uint8Array(analyserRef.current.fftSize);

        const checkVolume = () => {
          if (!analyserRef.current) return;
          const activeMeetingId = meetingIdRef.current || meetingId;
          const shouldLogVoice =
            Boolean(activeMeetingId) &&
            (mediaRecorderRef.current?.state === 'recording' ||
              Boolean(recordingStartedAtRef.current));

          // 留덉씠???뚯냼嫄??곹깭 ?뺤씤
          const isMuted = localStream.getAudioTracks().every(t => !t.enabled);
          if (isMuted) {
            if (localSpeakingRef.current) {
              localSpeakingRef.current = false;
              setIsSpeaking(false);
              sendVoiceActivity(false);
              if (shouldLogVoice) {
                logRecordingVoice('silent', {
                  meetingId: activeMeetingId,
                  userId: myId,
                  reason: 'muted',
                });
              }
            }
            if (speakingTimeoutRef.current) {
              clearTimeout(speakingTimeoutRef.current);
              speakingTimeoutRef.current = null;
            }
            animationFrameIdRef.current = requestAnimationFrame(checkVolume);
            return;
          }

          analyserRef.current.getByteFrequencyData(frequencyData);
          analyserRef.current.getByteTimeDomainData(timeDomainData);

          const maxVolume = Math.max(...frequencyData);
          const rms =
            Math.sqrt(
              timeDomainData.reduce((sum, value) => {
                const normalized = (value - 128) / 128;
                return sum + normalized * normalized;
              }, 0) / timeDomainData.length
            ) || 0;

          if ((maxVolume > 45 || rms > 0.02) && ctx && ctx.state === 'running') {
            if (!localSpeakingRef.current) {
              localSpeakingRef.current = true;
              setIsSpeaking(true);
              sendVoiceActivity(true);
              if (shouldLogVoice) {
                logRecordingVoice('speaking', {
                  meetingId: activeMeetingId,
                  userId: myId,
                  maxVolume,
                  rms,
                });
              }
            }
            if (speakingTimeoutRef.current)
              clearTimeout(speakingTimeoutRef.current);
            speakingTimeoutRef.current = setTimeout(
              () => {
                if (localSpeakingRef.current) {
                  localSpeakingRef.current = false;
                  setIsSpeaking(false);
                  sendVoiceActivity(false);
                  if (shouldLogVoice) {
                    logRecordingVoice('silent', {
                      meetingId: activeMeetingId,
                      userId: myId,
                      reason: 'timeout',
                    });
                  }
                }
                speakingTimeoutRef.current = null;
              },
              1000
            );
          } else if (localSpeakingRef.current && !speakingTimeoutRef.current) {
            localSpeakingRef.current = false;
            setIsSpeaking(false);
            sendVoiceActivity(false);
            if (shouldLogVoice) {
              logRecordingVoice('silent', {
                meetingId: activeMeetingId,
                userId: myId,
                reason: 'below-threshold',
              });
            }
          }
          animationFrameIdRef.current = requestAnimationFrame(checkVolume);
        };
        checkVolume();
      } catch (e) {
        console.error('VAD Error:', e);
      } finally {
        isVADInitializingRef.current = false;
      }
    };
    initVAD();
    return () => {
      if (animationFrameIdRef.current)
        cancelAnimationFrame(animationFrameIdRef.current);
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== 'closed'
      ) {
        audioContextRef.current.close().then(() => {
          audioContextRef.current = null;
        });
      }
    };
  }, [localStream, sendVoiceActivity]);

  // Recording Auto-start Effect - REMOVED (Recording should only start manually via assistant)
  /*
  useEffect(() => {
    if (
      isActive &&
      meetingId &&
      localStream &&
      (!mediaRecorderRef.current ||
        mediaRecorderRef.current.state === 'inactive')
    ) {
      startRecording();
    }
  }, [localStream, startRecording, log, meetingId, isActive]);
  */

  // Main Event Handler for Upload
  useEffect(() => {
    const handleStopAndUpload = async () => {
      const tId = teamIdRef.current;
      const mId = meetingIdRef.current;

      if (stopAndUploadInProgressRef.current) {
        return;
      }

      if (
        mId &&
        lastUploadedMeetingIdRef.current &&
        lastUploadedMeetingIdRef.current === mId
      ) {
        return;
      }

      log('[EVENT] meezy:stop-and-upload start');
      stopAndUploadInProgressRef.current = true;
      setIsUploading(true);
      const recorder = mediaRecorderRef.current;
      const stream = localStreamRef.current;

      log('[DEBUG] current context extracted', {
        teamId: tId,
        meetingId: mId,
        hasRecorder: !!recorder,
        recorderState: recorder?.state,
        hasStream: !!stream,
      });

      try {
        if (
          !tId &&
          !mId &&
          !recorder &&
          recordedChunksRef.current.length === 0 &&
          recordingPcmLeftChunksRef.current.length === 0
        ) {
          return;
        }

        let blob: Blob | null = null;
        const resolvedMimeType =
          recordingMimeTypeRef.current ||
          recorder?.mimeType ||
          recordedChunksRef.current[0]?.type ||
          getSupportedRecordingMimeType() ||
          'audio/webm';
        const recordingFileName = getRecordingFileName(resolvedMimeType);

        if (recorder && recorder.state !== 'inactive') {
          log('[DEBUG] calling recorder.stop()');

          blob = await new Promise<Blob>((resolve) => {
            const timeout = setTimeout(() => {
              log(
                '[WARN] stop recording timeout (3s) - resolving with available chunks'
              );
              resolve(
                new Blob(recordedChunksRef.current, { type: resolvedMimeType })
              );
            }, 3000);

            recorder.onstop = () => {
              clearTimeout(timeout);
              log('[DEBUG] MediaRecorder.onstop internally fired', {
                chunkCount: recordedChunksRef.current.length,
              });
              resolve(
                new Blob(recordedChunksRef.current, { type: resolvedMimeType })
              );
            };
            recorder.stop();
          });
        } else if (recordedChunksRef.current.length > 0) {
          log(
            '[WARN] Recorder is NULL or INACTIVE, but we have chunks! Uploading anyway.',
            {
              exists: !!recorder,
              state: recorder?.state,
              chunkCount: recordedChunksRef.current.length,
            }
          );
          blob = new Blob(recordedChunksRef.current, { type: resolvedMimeType });
        } else {
          log(
            '[WARN] Recorder is NULL or INACTIVE and NO chunks available, skipping upload',
            {
              exists: !!recorder,
              state: recorder?.state,
            }
          );
        }

        if (blob) {
          if (tId && mId && blob.size > 0) {
            const pcmLeftChunks = [...recordingPcmLeftChunksRef.current];
            const pcmRightChunks = [...recordingPcmRightChunksRef.current];
            const hasCapturedPcm = pcmLeftChunks.length > 0;

            logRecordingUpload('request', {
              teamId: tId,
              meetingId: mId,
              stage: 'prepare-upload',
              recorderState: recorder?.state ?? 'missing',
              recordedChunkCount: recordedChunksRef.current.length,
              pcmLeftChunkCount: pcmLeftChunks.length,
              pcmRightChunkCount: pcmRightChunks.length,
              blobSize: blob.size,
              blobType: blob.type,
            });

            const mp3Blob = hasCapturedPcm
              ? await encodePcmChunksToMp3({
                  leftChunks: pcmLeftChunks,
                  rightChunks: pcmRightChunks,
                  sampleRate: recordingPcmSampleRateRef.current,
                })
              : await convertRecordingBlobToMp3(blob);
            const recordingFileName = 'recording.mp3';

            logRecordingUpload('request', {
              teamId: tId,
              meetingId: mId,
              fileName: recordingFileName,
              size: mp3Blob.size,
              type: mp3Blob.type,
            });
            await uploadMeetingRecording(
              tId,
              mId,
              mp3Blob,
              recordingFileName
            );
            lastUploadedMeetingIdRef.current = mId;
          } else {
            if (tId || mId) {
              logRecordingUpload('skipped', {
                tIdExists: !!tId,
                mIdExists: !!mId,
                blobSize: blob.size,
                fileName: recordingFileName,
              });
            }
          }
        } else {
          if (tId || mId) {
            logRecordingUpload('skipped', {
              teamId: tId,
              meetingId: mId,
              reason: 'no-recording-blob',
            });
          }
        }
      } catch (err) {
        logRecordingUpload('error', {
          teamId: tId,
          meetingId: mId,
          stage: 'prepare-upload',
          recorderState: recorder?.state ?? 'missing',
          recordedChunkCount: recordedChunksRef.current.length,
          pcmLeftChunkCount: recordingPcmLeftChunksRef.current.length,
          pcmRightChunkCount: recordingPcmRightChunksRef.current.length,
          error: err,
        });
      } finally {
        mediaRecorderRef.current = null;
        recordedChunksRef.current = [];
        recordingMimeTypeRef.current = '';
        recordingPcmLeftChunksRef.current = [];
        recordingPcmRightChunksRef.current = [];
        cleanupRecordingMix();
        setIsUploading(false);
        stopAndUploadInProgressRef.current = false;
      }

      // Clean up tracks always at the end
      if (localStreamRef.current) {
        log('[DEBUG] Final track cleanup');
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
        setLocalStream(null);
      }

      teardownMeetingMedia();
    };

    window.addEventListener('meezy:stop-and-upload', handleStopAndUpload);
    return () => {
      console.log(
        `[${new Date().toLocaleTimeString()}] useMeetingWebRTC: event listener cleanup`
      );
      window.removeEventListener('meezy:stop-and-upload', handleStopAndUpload);
    };
  }, [log, teardownMeetingMedia]);

  useEffect(() => {
    if (myId && meetingId && teamId && isActive) {
      void initLocalMedia();
      return () => {
        if (speakingTimeoutRef.current) {
          clearTimeout(speakingTimeoutRef.current);
          speakingTimeoutRef.current = null;
        }
        localSpeakingRef.current = false;
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state !== 'inactive'
        ) {
          mediaRecorderRef.current.stop();
        }
        teardownMeetingMedia();
      };
    }

    if (!isActive || !myId) {
      teardownMeetingMedia();
    }

    return () => {
      if (speakingTimeoutRef.current) {
        clearTimeout(speakingTimeoutRef.current);
        speakingTimeoutRef.current = null;
      }
      localSpeakingRef.current = false;
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive'
      ) {
        mediaRecorderRef.current.stop();
      }
      teardownMeetingMedia();
    };
  }, [myId, initLocalMedia, meetingId, teamId, isActive, teardownMeetingMedia]);

  return {
    localStream,
    remoteStreams,
    remoteMediaStates,
    isSpeaking,
    remoteVoices,
    isRecording,
    connectToUser,
    initLocalMedia,
    toggleAudioEnabled,
    toggleVideoEnabled,
    startRecording,
    stopRecording,
  };
}
