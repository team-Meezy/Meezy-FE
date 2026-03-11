import { useEffect, useRef, useState, useCallback } from 'react';
import {
  useMeetingSignal,
  useMeetingEvents,
  useMeetingVoiceActivity,
  useMeetingStore,
  uploadMeetingRecording,
  SignalType,
  MeetingEvent,
  MeetingSignal,
} from '@org/shop-data';

interface ParticipantStream {
  userId: string;
  stream: MediaStream;
  name?: string;
}

export function useMeetingWebRTC(teamId: string, myId: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<ParticipantStream[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const pcs = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const speakingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const isVADInitializingRef = useRef(false);
  const { meetingId } = useMeetingStore();
  const { sendVoiceActivity } = useMeetingVoiceActivity(meetingId, myId);

  // Recording Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const teamIdRef = useRef(teamId);
  const meetingIdRef = useRef(meetingId);

  // Helper for verbose logging
  const log = useCallback((msg: string, data?: any) => {
    const time = new Date().toLocaleTimeString();
    console.log(`[${time}] useMeetingWebRTC: ${msg}`, data || '');
  }, []);

  useEffect(() => {
    teamIdRef.current = teamId;
    meetingIdRef.current = meetingId;
  }, [teamId, meetingId]);

  const removeParticipant = useCallback((userId: string) => {
    const pc = pcs.current.get(userId);
    if (pc) {
      pc.close();
      pcs.current.delete(userId);
    }
    setRemoteStreams((prev) => prev.filter((s) => s.userId !== userId));
  }, []);

  const getOrCreatePC = useCallback(
    (targetUserId: string, isOfferer: boolean) => {
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
        setRemoteStreams((prev) => {
          if (prev.find((ps) => ps.userId === targetUserId)) return prev;
          return [...prev, { userId: targetUserId, stream: event.streams[0] }];
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

      pcs.current.set(targetUserId, pc);
      return pc;
    },
    [myId, removeParticipant]
  );

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
      if (toUserId !== myId) return;

      if (type === 'offer') {
        const pc = getOrCreatePC(fromUserId, false);
        await pc.setRemoteDescription(
          new RTCSessionDescription({ type: 'offer', sdp })
        );
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
        if (pc)
          await pc.setRemoteDescription(
            new RTCSessionDescription({ type: 'answer', sdp })
          );
      } else if (type === 'ice-candidate') {
        const pc = pcs.current.get(fromUserId);
        if (pc)
          await pc.addIceCandidate(
            new RTCIceCandidate({ candidate, sdpMid, sdpMLineIndex })
          );
      }
    },
    [myId, getOrCreatePC]
  );

  const { sendSignal } = useMeetingSignal(teamId, myId, onSignal);

  const connectToUser = useCallback(
    async (targetUserId: string) => {
      if (targetUserId === myId) return;
      const pc = getOrCreatePC(targetUserId, true);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSignal(targetUserId, {
        type: 'offer',
        fromUserId: myId,
        toUserId: targetUserId,
        sdp: offer.sdp,
      });
    },
    [myId, getOrCreatePC, sendSignal]
  );

  const onMeetingEvent = useCallback(
    async (event: MeetingEvent) => {
      log('meeting event received', event);
      switch (event.type) {
        case 'participant_joined':
          if (event.userId && event.userId !== myId) {
            connectToUser(event.userId);
          }
          break;
        case 'participant_left':
          if (event.userId) {
            removeParticipant(event.userId);
          }
          break;
        // meeting-ended 류 이벤트는 현재 MeetingEvent 타입에 없으므로,
        // 서버에서 별도 타입을 추가하면 여기에 case를 확장.
      }
    },
    [myId, removeParticipant, connectToUser, log]
  );

  useMeetingEvents(teamId, onMeetingEvent);

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

    try {
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
        log('Fallback MediaRecorder SUCCESS. state:', fallbackRecorder.state);
      } catch (fallbackError) {
        log(
          '[CRITICAL ERROR] Fallback MediaRecorder instantiation/start failed',
          fallbackError
        );
      }
    }
  }, [log]);

  const initLocalMedia = useCallback(async () => {
    log('initLocalMedia starting...');
    try {
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      log('getUserMedia SUCCESS. stream tracks:', stream.getTracks().length);
      setLocalStream(stream);
      localStreamRef.current = stream;
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
        let lastSentTime = 0;

        const checkVolume = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const average = sum / dataArray.length;

          if (average > 15 && ctx && ctx.state === 'running') {
            setIsSpeaking(true);
            const now = Date.now();
            if (now - lastSentTime > 1000) {
              sendVoiceActivity();
              lastSentTime = now;
            }
            if (speakingTimeoutRef.current)
              clearTimeout(speakingTimeoutRef.current);
            speakingTimeoutRef.current = setTimeout(
              () => setIsSpeaking(false),
              1000
            );
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

  // Recording Auto-start Effect
  useEffect(() => {
    log('Recording effect triggered', {
      hasStream: !!localStream,
      hasRecorder: !!mediaRecorderRef.current,
      recorderState: mediaRecorderRef.current?.state,
    });
    if (
      localStream &&
      (!mediaRecorderRef.current ||
        mediaRecorderRef.current.state === 'inactive')
    ) {
      startRecording();
    }
  }, [localStream, startRecording, log]);

  // Main Event Handler for Upload
  useEffect(() => {
    const handleStopAndUpload = async () => {
      log('[EVENT] meezy:stop-and-upload start');
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
    if (myId) initLocalMedia();
    return () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive'
      ) {
        mediaRecorderRef.current.stop();
      }
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      pcs.current.forEach((pc) => pc.close());
      pcs.current.clear();
    };
  }, [myId, initLocalMedia]);

  return {
    localStream,
    remoteStreams,
    isSpeaking,
    connectToUser,
    initLocalMedia,
  };
}
