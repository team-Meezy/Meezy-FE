import { useEffect, useRef, useState } from 'react';

export function usePeerConnection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  onIceCandidate: (candidate: RTCIceCandidate) => void
) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    pcRef.current = pc;

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((mediaStream) => {
        console.log('getUserMedia success, stream:', mediaStream);
        if (!isMounted || pc.signalingState === 'closed') {
          console.log('Component unmounted or PC closed');
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }

        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }

        mediaStream.getTracks().forEach((track) => {
          if (pc.signalingState !== 'closed') {
            pc.addTrack(track, mediaStream);
          }
        });
      })
      .catch((error) => {
        console.error('getUserMedia error:', error);
      });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        onIceCandidate(event.candidate);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('connectionState:', pc.connectionState);
    };

    pc.ontrack = (event) => {
      if (videoRef.current) {
        videoRef.current.srcObject = event.streams[0];
      }
    };

    return () => {
      isMounted = false;
      pc.close();
    };
  }, []);

  const toggleVideo = async (isEnable: boolean) => {
    if (!stream || !pcRef.current) return;

    if (isEnable) {
      // 1. 카메라 켜기
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        const newTrack = newStream.getVideoTracks()[0];

        // 기존 스트림에 새 트랙 추가
        stream.addTrack(newTrack);

        // PeerConnection의 Sender 트랙 교체 (재협상 없이 화면 갱신)
        const sender = pcRef.current
          .getSenders()
          .find((s) => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(newTrack);
        }

        setVideoEnabled(true);
      } catch (err) {
        console.error('카메라를 켜는 데 실패했습니다:', err);
      }
    } else {
      // 2. 카메라 끄기 (하드웨어 종료)
      const videoTracks = stream.getVideoTracks();
      videoTracks.forEach((track) => {
        track.stop(); // 하드웨어 전원 종료
        stream.removeTrack(track); // 스트림에서 제거
      });

      // 상대방에게 검은 화면(null) 송출
      const sender = pcRef.current
        .getSenders()
        .find((s) => s.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(null);
      }

      setVideoEnabled(false);
    }
  };

  const toggleAudio = (isEnable: boolean) => {
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = isEnable;
      });
      setAudioEnabled(isEnable);
      console.log(`Mic is now ${isEnable ? 'ON' : 'OFF'}`);
    }
  };

  return {
    pcRef,
    toggleVideo,
    toggleAudio,
    videoEnabled,
    audioEnabled,
    stream,
  };
}
