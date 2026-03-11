import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useChatStore } from '../../chat-store';

export function useChatSocket(teamId: string, chatRoomId: string) {
  const client = useRef<Client | null>(null);
  const { addMessage } = useChatStore();

  useEffect(() => {
    if (!chatRoomId) return;

    const token = localStorage.getItem('accessToken');
    const socketUrl = 'https://meezy.kr/ws-chat';

    console.log(' 🔌 [Chat Socket Attempt (SockJS)]', {
      socketUrl,
      chatRoomId,
    });

    client.current = new Client({
      webSocketFactory: () =>
        new SockJS(socketUrl, null, { transports: ['websocket'] }),
      connectHeaders:
        token != null
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      reconnectDelay: 5000,
      heartbeatIncoming: 25000,
      heartbeatOutgoing: 25000,
      debug: (str) => {
        console.log(' [STOMP Debug]', str);
      },
      onConnect: () => {
        console.log(' ✅ [STOMP] Chat Connected (SockJS)');
        // 메시지 수신 (Subscribe)
        client.current?.subscribe(
          `/topic/chat/${chatRoomId}`,
          (message: any) => {
            try {
              const newMessage = JSON.parse(message.body);
              console.log(' 📩 [STOMP] Message Received:', newMessage);
              addMessage(newMessage); // 수신된 메시지를 스토어에 추가
            } catch (err) {
              console.error(' [STOMP] Failed to parse message:', err);
            }
          }
        );
      },
      onStompError: (frame) => {
        console.error(' ❌ [STOMP] Error:', frame.headers['message']);
        console.error(' [STOMP] Details:', frame.body);
      },
      onWebSocketError: (event) => {
        console.error(' ❌ [WebSocket] Error:', event);
      },
      onDisconnect: () => {
        console.log(' ⚠️ [STOMP] Disconnected');
      },
    });

    client.current.activate(); // 연결 시작

    return () => {
      console.log(' 🔌 [STOMP] Deactivating socket for room:', chatRoomId);
      client.current?.deactivate(); // 언마운트 시 연결 종료
    };
  }, [chatRoomId, addMessage]);

  // 메시지 보내기 (STOMP Publish)
  const sendMessage = async (content: string) => {
    if (client.current?.connected) {
      try {
        console.log(' 📤 [STOMP] Publishing message:', content);
        client.current.publish({
          destination: `/app/teams/${teamId}/chat-rooms/${chatRoomId}/messages`,
          body: JSON.stringify({
            content,
          }),
        });
      } catch (err) {
        console.error(' ❌ [STOMP] Failed to publish message:', err);
      }
    } else {
      console.warn(' ⚠️ [STOMP] Cannot send message: Not connected');
    }
  };

  return { sendMessage };
}
