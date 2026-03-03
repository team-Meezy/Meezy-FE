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

  const pcs = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
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
    try {
      const recorder = new MediaRecorder(localStreamRef.current, {
        mimeType: 'video/webm;codecs=vp8,opus',
      });
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunksRef.current.push(event.data);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
    } catch (e) {
      console.error('useMeetingWebRTC: Failed to start recording:', e);
    }
  }, []);

  const stopRecording = useCallback((): Promise<Blob> => {
    return new Promise((resolve) => {
      if (
        !mediaRecorderRef.current ||
        mediaRecorderRef.current.state === 'inactive'
      ) {
        resolve(new Blob([], { type: 'video/webm' }));
        return;
      }
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: 'video/webm',
        });
        console.log(
          'useMeetingWebRTC: Recording stopped, blob size:',
          blob.size
        );
        resolve(blob);
      };
      mediaRecorderRef.current.stop();
    });
  }, []);

  // Voice Activity Detection (VAD)
  useEffect(() => {
    if (!localStream) return;

    let audioContext: AudioContext;
    let analyser: AnalyserNode;
    let animationFrameId: number;

    const initVAD = async () => {
      try {
        audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(localStream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        let lastSentTime = 0;

        const checkVolume = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;

          if (average > 30) {
            const now = Date.now();
            if (now - lastSentTime > 1500) {
              sendVoiceActivity();
              lastSentTime = now;
            }
          }
          animationFrameId = requestAnimationFrame(checkVolume);
        };

        checkVolume();
      } catch (e) {
        console.error('VAD Initialization failed:', e);
      }
    };

    initVAD();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (audioContext) audioContext.close();
    };
  }, [localStream, sendVoiceActivity]);

  // Automatic Recording Start
  useEffect(() => {
    if (localStream && !mediaRecorderRef.current) {
      startRecording();
    }
  }, [localStream, startRecording]);

  // Listen for Stop and Upload Event
  useEffect(() => {
    const handleStopAndUpload = async () => {
      console.log('useMeetingWebRTC: Event meezy:stop-and-upload received');
      await stopRecording(); // 로컬 녹음은 중지하되, 스펙상 파일 업로드는 하지 않음
      if (teamId && meetingId) {
        try {
          // 스펙에 따라 빈 바디로 요청을 보냅니다.
          await uploadMeetingRecording(teamId, meetingId);
          console.log('useMeetingWebRTC: Recording trigger sent successfully');
        } catch (error) {
          console.error(
            'useMeetingWebRTC: Failed to trigger recording:',
            error
          );
        }
      }
    };

    window.addEventListener('meezy:stop-and-upload', handleStopAndUpload);
    return () => {
      window.removeEventListener('meezy:stop-and-upload', handleStopAndUpload);
    };
  }, [teamId, meetingId, stopRecording]);

  useEffect(() => {
    const initLocalMedia = async () => {
      console.log('useMeetingWebRTC: Initializing local media for', myId);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
        localStreamRef.current = stream;
      } catch (error) {
        console.error('useMeetingWebRTC: Failed to get local media:', error);
      }
    };

    if (myId) initLocalMedia();

    return () => {
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      pcs.current.forEach((pc) => pc.close());
      pcs.current.clear();
    };
  }, [myId]);

  const connectToUser = useCallback(
    async (targetUserId: string) => {
      if (targetUserId === myId) return;

      console.log(`Initiating connection to: ${targetUserId}`);
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

  return {
    localStream,
    remoteStreams,
    connectToUser,
    startRecording,
    stopRecording,
  };
}
