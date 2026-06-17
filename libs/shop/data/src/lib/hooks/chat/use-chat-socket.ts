import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useChatStore } from '../../chat-store';

interface UseChatSocketOptions {
  receiveMessages?: boolean;
}

export function useChatSocket(
  teamId: string,
  chatRoomId: string,
  options?: UseChatSocketOptions
) {
  const client = useRef<Client | null>(null);
  const { addMessage } = useChatStore();
  const receiveMessages = options?.receiveMessages ?? true;

  useEffect(() => {
    if (!chatRoomId) return;

    const token = localStorage.getItem('accessToken');
    const socketUrl = 'https://api.meezy.kr/ws-chat';

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
      debug: () => undefined,
      onConnect: () => {
        if (!receiveMessages) return;

        client.current?.subscribe(`/topic/chat/${chatRoomId}`, (message: any) => {
          try {
            const newMessage = JSON.parse(message.body);
            addMessage(newMessage);
          } catch (err) {
            console.error(' [STOMP] Failed to parse message:', err);
          }
        });
      },
      onStompError: (frame) => {
        console.error(' ??[STOMP] Error:', frame.headers['message']);
        console.error(' [STOMP] Details:', frame.body);
      },
      onWebSocketError: (event) => {
        console.error(' ??[WebSocket] Error:', event);
      },
    });

    client.current.activate();

    return () => {
      client.current?.deactivate();
    };
  }, [chatRoomId, addMessage, receiveMessages]);

  const sendMessage = (content: string) => {
    if (client.current?.connected) {
      try {
        client.current.publish({
          destination: `/app/teams/${teamId}/chat-rooms/${chatRoomId}/messages`,
          body: JSON.stringify({
            content,
          }),
        });
        return true;
      } catch (err) {
        console.error(' ??[STOMP] Failed to publish message:', err);
        return false;
      }
    } else {
      return false;
    }
  };

  return { sendMessage };
}
