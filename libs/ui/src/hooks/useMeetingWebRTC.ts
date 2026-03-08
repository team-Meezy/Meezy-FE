import { useEffect, useRef, useState, useCallback } from 'react';
import {
  useMeetingSignal,
  useMeetingEvents,
  useMeetingVoiceActivity,
  useMeetingStore,
  uploadMeetingRecording,
  SignalType,
  MeetingEvent,
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
          sendSignal({
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
        console.log(
          'Received remote track from:',
          targetUserId,
          event.streams[0]
        );
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
    async (signal: any) => {
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
        sendSignal({
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
        }
      } else if (type === 'ice-candidate') {
        const pc = pcs.current.get(fromUserId);
        if (pc) {
          await pc.addIceCandidate(
            new RTCIceCandidate({
              candidate,
              sdpMid,
              sdpMLineIndex,
            })
          );
        }
      }
    },
    [myId, getOrCreatePC]
  );

  const { sendSignal } = useMeetingSignal(teamId, myId, onSignal);

  const connectToUser = useCallback(
    async (targetUserId: string) => {
      if (targetUserId === myId) return;

      console.log(
        `🚀 [useMeetingWebRTC] Initiating connection to: ${targetUserId}`
      );
      const pc = getOrCreatePC(targetUserId, true);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      sendSignal({
        type: 'offer',
        fromUserId: myId,
        toUserId: targetUserId,
        sdp: offer.sdp,
      });
    },
    [myId, getOrCreatePC, sendSignal]
  );

  // 시그널링 외에 참가자 입장/퇴장 이벤트 처리
  const onMeetingEvent = useCallback(
    async (event: MeetingEvent) => {
      switch (event.type) {
        case 'participant-joined':
          if (event.joinedUserId && event.joinedUserId !== myId) {
            console.log(
              `New participant joined: ${event.joinedUserName} (${event.joinedUserId})`
            );
            connectToUser(event.joinedUserId);
          }
          break;
        case 'participant-left':
          if (event.leftUserId) {
            console.log(`Participant left: ${event.leftUserId}`);
            removeParticipant(event.leftUserId);
          }
          break;
        case 'meeting-ended':
          alert('회의가 종료되었습니다.');
          window.dispatchEvent(new CustomEvent('meezy:stop-and-upload'));
          setTimeout(() => {
            window.location.href = `/main/${teamId}`;
          }, 1000);
          break;
      }
    },
    [myId, teamId, removeParticipant]
  );

  useMeetingEvents(teamId, onMeetingEvent);

  // Recording Functions
  const startRecording = useCallback(() => {
    if (!localStreamRef.current) return;
    console.log('useMeetingWebRTC: Starting recording...');
    recordedChunksRef.current = [];

    // 지원 가능한 MIME 타입 정의
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/wav',
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
      console.log(
        'useMeetingWebRTC: MediaRecorder initialized with',
        recorder.mimeType
      );

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunksRef.current.push(event.data);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
    } catch (e) {
      console.error('useMeetingWebRTC: Failed to start recording:', e);
    }
  }, []);

  const initLocalMedia = useCallback(async () => {
    console.log('📹 [useMeetingWebRTC] Initializing local media for:', myId);
    try {
      // 기존 트랙이 있다면 중지
      localStreamRef.current?.getTracks().forEach((track) => track.stop());

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // 장치 목록 출력 (디버깅용)
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter((d) => d.kind === 'audioinput');
        console.log(
          '🎙️ [useMeetingWebRTC] Available Audio Inputs:',
          audioInputs.map((d) => ({
            label: d.label || 'Unknown Device',
            deviceId: d.deviceId,
          }))
        );
      } catch (e) {
        console.warn('🎙️ [useMeetingWebRTC] Could not enumerate devices');
      }

      setLocalStream(stream);
      localStreamRef.current = stream;
      return stream;
    } catch (error) {
      console.error('useMeetingWebRTC: Failed to get local media:', error);
      return null;
    }
  }, [myId]);

  const stopRecording = useCallback((): Promise<Blob> => {
    return new Promise((resolve) => {
      console.log('⏹️ [useMeetingWebRTC] stopRecording called');
      if (
        !mediaRecorderRef.current ||
        mediaRecorderRef.current.state === 'inactive'
      ) {
        console.warn('埋 [useMeetingWebRTC] MediaRecorder is not active');
        resolve(new Blob([], { type: 'audio/webm' }));
        return;
      }

      const mimeType = mediaRecorderRef.current.mimeType;

      mediaRecorderRef.current.onstop = () => {
        // [중요] 백엔드 문서상 MP3(audio/mpeg) 형식을 요구하므로,
        // 브라우저가 실제로는 WebM으로 기록했더라도 MIME 타입을 audio/mpeg로 설정하여 전송합니다.
        // 대부분의 최신 백엔드 엔진은 파일의 실제 바이너리를 분석하여 처리할 수 있습니다.
        const blob = new Blob(recordedChunksRef.current, {
          type: 'audio/mpeg',
        });
        console.log('✅ [useMeetingWebRTC] MP3(Fake) Blob created!', {
          size: blob.size,
          type: blob.type,
        });
        resolve(blob);
      };
      mediaRecorderRef.current.stop();
    });
  }, []);

  useEffect(() => {
    if (!localStream) return;

    const initVAD = async () => {
      if (isVADInitializingRef.current) {
        console.log('🎙️ [VAD] Already initializing, skipping duplicate call');
        return;
      }
      isVADInitializingRef.current = true;

      const isSecure = typeof window !== 'undefined' && window.isSecureContext;
      console.log('🎙️ [VAD] Initializing VAD...', {
        isSecureContext: isSecure,
        hasExistingContext: !!audioContextRef.current,
      });

      try {
        // 1. Check tracks first
        const audioTracks = localStream.getAudioTracks();
        if (audioTracks.length === 0) {
          console.warn('⚠️ [VAD] No audio tracks found in localStream');
          return;
        }

        audioTracks.forEach((track, i) => {
          console.log(`🎙️ [VAD] Track[${i}]:`, {
            label: track.label,
            enabled: track.enabled,
            readyState: track.readyState,
            muted: track.muted,
          });
        });

        // 2. Check permissions
        if (navigator.permissions && (navigator.permissions as any).query) {
          try {
            const status = await (navigator.permissions as any).query({
              name: 'microphone',
            });
            console.log('🎙️ [VAD] Microphone Permission state:', status.state);
          } catch (e) {
            console.log('🎙️ [VAD] Could not query permission status');
          }
        }

        // 3. Create or reuse AudioContext
        if (!audioContextRef.current) {
          console.log('🎙️ [VAD] Creating new AudioContext...');
          const AC = window.AudioContext || (window as any).webkitAudioContext;
          if (!AC) {
            console.error(
              '❌ [VAD] AudioContext NOT supported in this browser!'
            );
            return;
          }
          audioContextRef.current = new AC();
          console.log(
            '🎙️ [VAD] AudioContext created. State:',
            audioContextRef.current.state
          );
        }

        const ctx = audioContextRef.current;

        // 4. Handle suspended state
        if (ctx.state === 'suspended') {
          console.log(
            '🎙️ [VAD] AudioContext is suspended. VAD will start fully after user interaction.'
          );
          const resume = () => {
            if (ctx.state === 'suspended') {
              console.log('🎙️ [VAD] Attempting to resume AudioContext...');
              ctx
                .resume()
                .then(() => {
                  console.log(
                    '🎙️ [VAD] AudioContext resumed successfully. New state:',
                    ctx.state
                  );
                })
                .catch((err) => {
                  console.error('❌ [VAD] Failed to resume AudioContext:', err);
                });
            }
          };
          window.addEventListener('click', resume, { once: true });
          window.addEventListener('keydown', resume, { once: true });
        }

        // 5. Connect stream
        console.log('🎙️ [VAD] Connecting stream to analyser...');
        const source = ctx.createMediaStreamSource(localStream);
        analyserRef.current = ctx.createAnalyser();
        analyserRef.current.fftSize = 256;
        source.connect(analyserRef.current);

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const timeDataArray = new Uint8Array(bufferLength);
        let lastSentTime = 0;
        let logCounter = 0;

        const checkVolume = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          analyserRef.current.getByteTimeDomainData(timeDataArray);

          let sum = 0;
          let timeMax = 0;
          let timeMin = 255;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
            if (timeDataArray[i] > timeMax) timeMax = timeDataArray[i];
            if (timeDataArray[i] < timeMin) timeMin = timeDataArray[i];
          }
          const average = sum / bufferLength;
          // Time domain amplitude (128 is center/silence)
          const timeAmplitude = Math.max(timeMax - 128, 128 - timeMin);

          logCounter++;
          if (logCounter > 30) {
            const track = localStream.getAudioTracks()[0];
            console.log('🎙️ [VAD] Active.', {
              avgVol: average.toFixed(2),
              timeAmp: timeAmplitude,
              state: ctx.state,
              sampleRate: ctx.sampleRate,
              track: track
                ? {
                    label: track.label,
                    enabled: track.enabled,
                    muted: (track as any).muted || false, // 'muted' property on track
                    readyState: track.readyState,
                  }
                : 'no-track',
            });
            logCounter = 0;
          }

          if ((average > 15 || timeAmplitude > 5) && ctx.state === 'running') {
            setIsSpeaking(true);
            const now = Date.now();
            if (now - lastSentTime > 1000) {
              console.log(
                '🎙️ [VAD] Voice detected! avg:',
                average.toFixed(2),
                'amp:',
                timeAmplitude
              );
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
        console.log('🎙️ [VAD] Initialization complete and loop started.');
      } catch (e) {
        console.error('❌ [VAD] Initialization check failed:', e);
      } finally {
        isVADInitializingRef.current = false;
      }
    };

    initVAD();

    return () => {
      console.log('🎙️ [VAD] Cleaning up VAD...');
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== 'closed'
      ) {
        audioContextRef.current.close().then(() => {
          audioContextRef.current = null;
          analyserRef.current = null;
        });
      }
    };
  }, [localStream, sendVoiceActivity]);

  // Automatic Recording Start
  useEffect(() => {
    if (
      localStream &&
      (!mediaRecorderRef.current ||
        mediaRecorderRef.current.state === 'inactive')
    ) {
      startRecording();
    }
  }, [localStream, startRecording]);

  // Listen for Stop and Upload Event
  useEffect(() => {
    const handleStopAndUpload = async () => {
      console.log('useMeetingWebRTC: Event meezy:stop-and-upload received');
      try {
        console.log('useMeetingWebRTC: stopRecording called');
        const recordingBlob = await stopRecording();
        console.log('useMeetingWebRTC: stopRecording called', recordingBlob);

        // [중요] 미디어 트랙 중지 및 스트림 정리
        if (localStreamRef.current) {
          console.log('useMeetingWebRTC: Stopping all local tracks');
          localStreamRef.current.getTracks().forEach((track) => {
            track.stop();
            console.log(`Track ${track.kind} stopped`);
          });
          localStreamRef.current = null;
          setLocalStream(null);
        }

        if (teamId && meetingId && recordingBlob && recordingBlob.size > 0) {
          console.log(
            'useMeetingWebRTC: Calling uploadMeetingRecording...',
            recordingBlob
          );
          const res = await uploadMeetingRecording(
            teamId,
            meetingId,
            recordingBlob
          );
          console.log('useMeetingWebRTC: Recording uploaded successfully', res);
        } else {
          console.warn('useMeetingWebRTC: No recording data to upload', {
            teamId,
            meetingId,
            size: recordingBlob?.size,
          });
        }
      } catch (error) {
        console.error(
          'useMeetingWebRTC: Error in stop and upload handler:',
          error
        );
      }
    };

    window.addEventListener('meezy:stop-and-upload', handleStopAndUpload);
    return () => {
      window.removeEventListener('meezy:stop-and-upload', handleStopAndUpload);
    };
  }, [teamId, meetingId, stopRecording]);

  useEffect(() => {
    if (myId) initLocalMedia();

    return () => {
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
    startRecording,
    stopRecording,
    initLocalMedia,
  };
}
