'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  useMeetingSignal,
  useMeetingEvents,
  useMeetingVoiceActivity,
  useMeetingStore,
  uploadMeetingRecording,
  getActiveMeetings,
  MeetingEvent,
  MeetingSignal,
} from '@org/shop-data';

interface ParticipantStream {
  userId: string;
  stream: MediaStream;
  name?: string;
}

export function useMeetingWebRTC(
  teamId: string,
  myId: string,
  localIds: string[],
  isActive: boolean
) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<ParticipantStream[]>([]);
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
  const {
    meetingId,
    setIsUploading,
    isRecording,
    setIsRecording,
    setStartTime,
  } = useMeetingStore();

  // Recording Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef<string | null>(null);

  const teamIdRef = useRef(teamId);
  const meetingIdRef = useRef(meetingId);
  const localIdsRef = useRef<string[]>([]);

  // Helper for verbose logging
  const log = useCallback((msg: string, data?: any) => {
    const time = new Date().toLocaleTimeString();
    console.log(`[${time}] useMeetingWebRTC: ${msg}`, data || '');
  }, []);

  useEffect(() => {
    teamIdRef.current = teamId;
    meetingIdRef.current = meetingId;
    localIdsRef.current = localIds;
  }, [localIds, meetingId, teamId]);

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
    setRemoteStreams((prev) => prev.filter((s) => s.userId !== userId));
  }, []);

  const teardownMeetingMedia = useCallback(() => {
    Object.values(remoteVoiceTimers.current).forEach((timer) => clearTimeout(timer));
    remoteVoiceTimers.current = {};
    pendingIceCandidates.current.clear();
    pcs.current.forEach((pc) => pc.close());
    pcs.current.clear();
    setRemoteVoices({});
    setRemoteStreams([]);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setIsRecording(false);
    setStartTime(null);
    recordingStartedAtRef.current = null;
  }, [setIsRecording, setStartTime]);

  const getMeetingParticipantIds = useCallback(async () => {
    const activeMeeting = await getActiveMeetings(teamIdRef.current);
    if (!Array.isArray(activeMeeting?.participants)) return [];

    return activeMeeting.participants
      .map((participant: any) =>
        String(
          participant?.userId ||
            participant?.user_id ||
            participant?.accountId ||
            participant?.id ||
            participant?.user?.id ||
            participant?.user?.userId ||
            participant?.user?.user_id ||
            participant?.teamMemberId ||
            participant?.memberId ||
            ''
        ).trim()
      )
      .filter(
        (participantId: string) =>
          participantId && !localIdsRef.current.includes(participantId)
      );
  }, []);

  const broadcastRecordingState = useCallback(
    async (type: 'recording-started' | 'recording-stopped', startedAt?: string) => {
      try {
        const participantIds = await getMeetingParticipantIds();
        participantIds.forEach((participantId: string) => {
          sendSignalRef.current?.(participantId, {
            type,
            fromUserId: myId,
            toUserId: participantId,
            startedAt,
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
      if (pcs.current.has(targetUserId)) {
        return pcs.current.get(targetUserId)!;
      }

      console.log(`Creating PeerConnection for: ${targetUserId}`);
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal(targetUserId, {
            type: 'ice-candidate',
            fromUserId: myId,
            toUserId: targetUserId,
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid || undefined,
            sdpMLineIndex: event.candidate.sdpMLineIndex ?? undefined,
          });
        }
      };

      pc.ontrack = (event) => {
        log(`[WebRTC] ontrack from ${targetUserId}: ${event.track.kind}`);
        setRemoteStreams((prev) => {
          const existingParticipant = prev.find(
            (ps) => ps.userId === targetUserId
          );

          if (existingParticipant) {
            // 🔥 중요: MediaStream 객체의 참조를 새로 생성해야 React가 변경을 감지하고 
            // Video 요소의 srcObject를 갱신하여 오디오/비디오가 모두 정상 출력됩니다.
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

          // 첫 트랙인 경우에도 새로운 MediaStream으로 감싸서 관리
          const firstStream = event.streams[0] 
            ? new MediaStream(event.streams[0].getTracks()) 
            : new MediaStream([event.track]);
            
          return [...prev, { userId: targetUserId, stream: firstStream }];
        });
      };

      pc.onconnectionstatechange = () => {
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
          // [PATCH] 레이스 컨디션 해결을 위해 모든 참가자가 offer를 보낼 수 있도록 허용하되,
          // onSignal 에서 "polite" 전략으로 glare(동시 오퍼) 충돌을 해결합니다.
          // 또는, 안전하게 ID가 작은 쪽만 신규 트랙에 대한 오퍼를 보내도록 유지할 수 있지만,
          // 이 경우 Impolite 사용자가 트랙을 추가했을 때 상대가 알 방법이 없으므로 오퍼를 보냅니다.
          log(`[WebRTC] Negotiation needed for ${targetUserId}, sending offer`);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          sendSignalRef.current?.(targetUserId, {
            type: 'offer',
            fromUserId: myId,
            toUserId: targetUserId,
            sdp: offer.sdp,
          });
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
      if (!localIdsRef.current.includes(String(toUserId))) return;

      if (type === 'recording-started') {
        recordingStartedAtRef.current = signal.startedAt || new Date().toISOString();
        setIsRecording(true);
        setStartTime(recordingStartedAtRef.current);
        return;
      } else if (type === 'recording-stopped') {
        recordingStartedAtRef.current = null;
        setIsRecording(false);
        setStartTime(null);
        return;
      } else if (type === 'offer') {
        const pc = getOrCreatePC(fromUserId);
        const polite = shouldInitiateOffer(myId, fromUserId);
        const offerCollision = pc.signalingState !== 'stable';

        if (offerCollision && !polite) {
          log(`[WebRTC] Glare detected, I am impolite, ignoring offer from ${fromUserId}`);
          return;
        }

        if (offerCollision && polite) {
          log(`[WebRTC] Glare detected, I am polite, rolling back to accept offer from ${fromUserId}`);
          await pc.setLocalDescription({ type: 'rollback' } as any);
        }

        await pc.setRemoteDescription(
          new RTCSessionDescription({ type: 'offer', sdp })
        );
        const pendingCandidates =
          pendingIceCandidates.current.get(fromUserId) ?? [];
        for (const queuedCandidate of pendingCandidates) {
          await pc.addIceCandidate(new RTCIceCandidate(queuedCandidate));
        }
        pendingIceCandidates.current.delete(fromUserId);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendSignal(fromUserId, {
          type: 'answer',
          fromUserId: myId,
          toUserId: fromUserId,
          sdp: answer.sdp,
        });
      } else if (type === 'answer') {
        const pc = pcs.current.get(fromUserId);
        if (pc) {
          await pc.setRemoteDescription(
            new RTCSessionDescription({ type: 'answer', sdp })
          );
          const pendingCandidates =
            pendingIceCandidates.current.get(fromUserId) ?? [];
          for (const queuedCandidate of pendingCandidates) {
            await pc.addIceCandidate(new RTCIceCandidate(queuedCandidate));
          }
          pendingIceCandidates.current.delete(fromUserId);
        }
      } else if (type === 'ice-candidate') {
        const pc = pcs.current.get(fromUserId);
        if (pc?.remoteDescription) {
          await pc.addIceCandidate(
            new RTCIceCandidate({ candidate, sdpMid, sdpMLineIndex })
          );
        } else {
          const queued = pendingIceCandidates.current.get(fromUserId) ?? [];
          queued.push({ candidate, sdpMid, sdpMLineIndex });
          pendingIceCandidates.current.set(fromUserId, queued);
        }
      }
    },
    [getOrCreatePC, myId, setIsRecording, setStartTime, shouldInitiateOffer]
  );

  const { sendSignal } = useMeetingSignal(teamId, myId, onSignal);

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
      void broadcastRecordingState('recording-started', startedAt);
    }, 3000);

    return () => clearInterval(intervalId);
  }, [broadcastRecordingState, isRecording, meetingId, teamId]);

  const connectToUser = useCallback(
    async (targetUserId: string) => {
      if (localIdsRef.current.includes(String(targetUserId))) return;
      getOrCreatePC(targetUserId);
    },
    [myId, getOrCreatePC]
  );

  const onMeetingEvent = useCallback(
    async (event: MeetingEvent) => {
      log('meeting event received', event);
      switch (event.type) {
        case 'participant-joined':
          // 1. 내가 접속했을 때: 이미 있는 참가자들(existingParticipantIds)에게 연결 시도
          if (
            event.joinedUserId &&
            localIdsRef.current.includes(String(event.joinedUserId)) &&
            event.existingParticipantIds
          ) {
            log(`I joined. Connecting to existing participants: ${event.existingParticipantIds}`);
            event.existingParticipantIds.forEach((pId) => {
              if (!localIdsRef.current.includes(String(pId))) {
                // Polite 발송 전략: ID가 더 작은 쪽이 먼저 Offer를 보냄
                if (shouldInitiateOffer(myId, pId)) {
                  log(`polite initiation (existing): sending offer to ${pId}`);
                  connectToUser(pId);
                } else {
                  log(`polite initiation (existing): waiting for offer from ${pId}`);
                }
              }
            });
          }
          // 2. 다른 사람이 접속했을 때: 해당 참가자에게 연결 시도
          else if (
            event.joinedUserId &&
            !localIdsRef.current.includes(String(event.joinedUserId))
          ) {
            if (shouldInitiateOffer(myId, event.joinedUserId)) {
              log(`polite initiation (newcomer): sending offer to ${event.joinedUserId}`);
              connectToUser(event.joinedUserId);
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
    [myId, removeParticipant, connectToUser, log, shouldInitiateOffer, teardownMeetingMedia]
  );

  useMeetingEvents(teamId, onMeetingEvent);

  useEffect(() => {
    if (!teamId || !meetingId || !isActive) return;

    const syncParticipants = async () => {
      try {
        const participantIds = await getMeetingParticipantIds();

        participantIds.forEach((participantId: string) => {
          if (pcs.current.has(participantId)) return;
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
  }, [connectToUser, getMeetingParticipantIds, isActive, log, meetingId, teamId]);

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

    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/wav',
      'audio/mpeg', // fallback check
    ];
    let selectedMimeType = '';
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        selectedMimeType = mimeType;
        break;
      }
    }

    const startedAt = new Date().toISOString();
    try {
      recordingStartedAtRef.current = startedAt;
      const recorder = new MediaRecorder(localStreamRef.current, {
        mimeType: selectedMimeType || undefined,
      });
      mediaRecorderRef.current = recorder; // Ensure ref is assigned before starting

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

      recorder.start(1000); // 1s chunks
      setIsRecording(true);
      setStartTime(startedAt);
      void broadcastRecordingState('recording-started', startedAt);
      log('MediaRecorder SUCCESS. state:', recorder.state);
      log('MIME Type selected:', recorder.mimeType);
    } catch (e) {
      log('[ERROR] MediaRecorder instantiation/start failed', e);
      // Fallback: Try without specific options if it failed
      try {
        const fallbackRecorder = new MediaRecorder(localStreamRef.current);
        mediaRecorderRef.current = fallbackRecorder;
        fallbackRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };
        fallbackRecorder.onstop = () => {
          log(
            'Fallback MediaRecorder stopped internally. Chunks collected:',
            recordedChunksRef.current.length
          );
        };
        fallbackRecorder.start(1000);
        setIsRecording(true);
        setStartTime(startedAt);
        void broadcastRecordingState('recording-started', startedAt);
        log('Fallback MediaRecorder SUCCESS. state:', fallbackRecorder.state);
      } catch (fallbackError) {
        log(
          '[CRITICAL ERROR] Fallback MediaRecorder instantiation/start failed',
          fallbackError
        );
      }
    }
  }, [broadcastRecordingState, log, setIsRecording, setStartTime]);

  const stopRecording = useCallback(() => {
    log('stopRecording triggered manually');
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setStartTime(null);
    recordingStartedAtRef.current = null;
    void broadcastRecordingState('recording-stopped');
  }, [broadcastRecordingState, log, setIsRecording, setStartTime]);

  const initLocalMedia = useCallback(async () => {
    log('initLocalMedia starting...');
    try {
      const previousStream = localStreamRef.current;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      log('getUserMedia SUCCESS. stream tracks:', stream.getTracks().length);
      setLocalStream(stream);
      localStreamRef.current = stream;

      // 🔥 레이스 컨디션 해결: 이미 생성된 PeerConnection이 있다면 트랙 추가
      pcs.current.forEach((pc, targetId) => {
        const senders = pc.getSenders();
        stream.getTracks().forEach((track) => {
          // 중복 추가 방지
          const sender = senders.find((s) => s.track?.kind === track.kind);
          if (sender) {
            log(`Replacing ${track.kind} track on existing PC: ${targetId}`);
            void sender.replaceTrack(track);
          } else {
            log(`Adding ${track.kind} track to existing PC: ${targetId}`);
            pc.addTrack(track, stream);
          }
        });

        // Offer 재발송이 필요한 경우 (필요 시 negotiationneeded 이벤트 활용 가능)
        // 여기서는 간단히 다시 offer를 보낼 수도 있음
      });

      previousStream?.getTracks().forEach((track) => track.stop());
      return stream;
    } catch (error) {
      log('[ERROR] initLocalMedia failed', error);
      return null;
    }
  }, [log]);

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

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

        const checkVolume = () => {
          if (!analyserRef.current) return;
          
          // 마이크 음소거 상태 확인
          const isMuted = localStream.getAudioTracks().every(t => !t.enabled);
          if (isMuted) {
            if (localSpeakingRef.current) {
              localSpeakingRef.current = false;
              setIsSpeaking(false);
              sendVoiceActivity(false);
            }
            if (speakingTimeoutRef.current) {
              clearTimeout(speakingTimeoutRef.current);
              speakingTimeoutRef.current = null;
            }
            animationFrameIdRef.current = requestAnimationFrame(checkVolume);
            return;
          }

          analyserRef.current.getByteFrequencyData(dataArray);
          
          // Peak volume detection (Math.max)
          // 단순 평균보다는 피크 함량을 체크하는 것이 목소리 감지에 더 정교합니다.
          const maxVolume = Math.max(...dataArray);

          // threshold 70 (0~255 범위)
          if (maxVolume > 70 && ctx && ctx.state === 'running') {
            if (!localSpeakingRef.current) {
              localSpeakingRef.current = true;
              setIsSpeaking(true);
              sendVoiceActivity(true);
            }
            if (speakingTimeoutRef.current)
              clearTimeout(speakingTimeoutRef.current);
            speakingTimeoutRef.current = setTimeout(
              () => {
                if (localSpeakingRef.current) {
                  localSpeakingRef.current = false;
                  setIsSpeaking(false);
                  sendVoiceActivity(false);
                }
                speakingTimeoutRef.current = null;
              },
              1000
            );
          } else if (localSpeakingRef.current && !speakingTimeoutRef.current) {
            localSpeakingRef.current = false;
            setIsSpeaking(false);
            sendVoiceActivity(false);
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
      log('[EVENT] meezy:stop-and-upload start');
      setIsUploading(true);
      const tId = teamIdRef.current;
      const mId = meetingIdRef.current;
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
        let blob: Blob | null = null;

        if (recorder && recorder.state !== 'inactive') {
          log('[DEBUG] calling recorder.stop()');

          blob = await new Promise<Blob>((resolve) => {
            const timeout = setTimeout(() => {
              log(
                '[WARN] stop recording timeout (3s) - resolving with available chunks'
              );
              resolve(
                new Blob(recordedChunksRef.current, { type: 'audio/mpeg' })
              );
            }, 3000);

            recorder.onstop = () => {
              clearTimeout(timeout);
              log('[DEBUG] MediaRecorder.onstop internally fired', {
                chunkCount: recordedChunksRef.current.length,
              });
              resolve(
                new Blob(recordedChunksRef.current, { type: 'audio/mpeg' })
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
          blob = new Blob(recordedChunksRef.current, { type: 'audio/mpeg' });
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
          log('[DEBUG] final blob generated', { size: blob.size });
          if (tId && mId && blob.size > 0) {
            log('[DEBUG] initializing uploadMeetingRecording API call...');
            const res = await uploadMeetingRecording(tId, mId, blob);
            console.log('[SUCCESS] API call completed', res);
          } else {
            log('[WARN] upload conditions NOT met (IDs missing or zero size)', {
              tIdExists: !!tId,
              mIdExists: !!mId,
              blobSize: blob.size,
            });
          }
        }
      } catch (err) {
        log('[ERROR] handleStopAndUpload task failed', err);
      } finally {
        setIsUploading(false);
      }

      // Clean up tracks always at the end
      if (localStreamRef.current) {
        log('[DEBUG] Final track cleanup');
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
        setLocalStream(null);
      }
    };

    window.addEventListener('meezy:stop-and-upload', handleStopAndUpload);
    return () => {
      console.log(
        `[${new Date().toLocaleTimeString()}] useMeetingWebRTC: event listener cleanup`
      );
      window.removeEventListener('meezy:stop-and-upload', handleStopAndUpload);
    };
  }, [log]);

  useEffect(() => {
    if (myId && meetingId && teamId && isActive) initLocalMedia();
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
    isSpeaking,
    remoteVoices,
    isRecording,
    connectToUser,
    initLocalMedia,
    startRecording,
    stopRecording,
  };
}
