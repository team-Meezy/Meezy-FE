'use client';

import { useEffect, useRef, useState } from 'react';

export const useWebSocket = () => {
  const socketRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080');
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const message = event.data;
      setMessages((prevMessages) => [...prevMessages, message]);
    };

    return () => {
      socket.close();
    };
  }, []);

  const sendMessage = () => {
    if (!input || !socketRef.current) return;
    socketRef.current.send(input);
    setInput('');
  };

  return {
    messages,
    input,
    setInput,
    sendMessage,
  };
};
