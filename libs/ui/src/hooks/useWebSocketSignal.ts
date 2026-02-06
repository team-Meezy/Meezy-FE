'use client';
import { useEffect, useRef } from 'react';

type SignalHandler = (data: any) => void;

export function useWebSocketSignal(url: string, onMessage: SignalHandler) {
  const socketRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onmessage = (e) => {
      if (onMessageRef.current) {
        onMessageRef.current(JSON.parse(e.data));
      }
    };

    return () => socket.close();
  }, [url]);

  const send = (data: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
    }
  };

  return { send };
}
