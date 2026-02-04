import { useEffect, useRef } from 'react';

export function usePeerConnection(
  videoRef: React.RefObject<HTMLVideoElement>,
  onIceCandidate: (candidate: RTCIceCandidate) => void
) {
  const pcRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    let isMounted = true;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    pcRef.current = pc;

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        console.log('getUserMedia success, stream:', stream);
        console.log('Stream tracks:', stream.getTracks());
        console.log(stream.getTracks().filter((d) => d.kind === 'videoinput'));
        if (!isMounted || pc.signalingState === 'closed') {
          console.log('Component unmounted or PC closed');
          return;
        }

        if (videoRef.current) {
          console.log('Setting srcObject to video element');
          videoRef.current.srcObject = stream;
          console.log('Video element srcObject:', videoRef.current.srcObject);
        } else {
          console.log('videoRef.current is null');
        }

        stream.getTracks().forEach((track) => {
          if (pc.signalingState !== 'closed') {
            pc.addTrack(track, stream);
          }
          console.log('track.readyState:', track.readyState);

          track.onunmute = () => {
            console.log('track unmuted → frames start');
          };

          track.onmute = () => {
            console.log('track muted');
          };

          track.onended = () => {
            console.log('track ended');
          };
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

  return pcRef;
}
