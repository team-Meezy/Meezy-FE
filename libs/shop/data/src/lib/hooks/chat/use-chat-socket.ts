import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import { useChatStore } from '../../chat-store';

export function useChatSocket(teamId: string, chatRoomId: string) {
  const client = useRef<Client | null>(null);
  const { addMessage } = useChatStore();

  const BASE_URL = process.env.VITE_BASE_URL;

  useEffect(() => {
    // 클라이언트 설정
    client.current = new Client({
      brokerURL: `wss://${BASE_URL}/ws`,
      onConnect: () => {
        // 메시지 수신 (Subscribe)
        client.current?.subscribe(
          `/topic/chat/${chatRoomId}`,
          (message: any) => {
            const newMessage = JSON.parse(message.body);
            addMessage(newMessage); // 수신된 메시지를 스토어에 추가
          }
        );
      },
    });

    client.current.activate(); // 연결 시작

    return () => {
      client.current?.deactivate(); // 언마운트 시 연결 종료
    };
  }, [chatRoomId]);

  // 메시지 보내기 (Publish)
  const sendMessage = (content: string) => {
    if (client.current?.connected) {
      client.current.publish({
        destination: `/api/v1/teams/${teamId}/chat-rooms/${chatRoomId}/messages`,
        body: JSON.stringify({ content }),
      });
    }
  };

  return { sendMessage };
}
