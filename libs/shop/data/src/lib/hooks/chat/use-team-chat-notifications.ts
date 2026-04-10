import { useEffect, useMemo, useRef } from 'react';
import { Client, type StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useChatStore } from '../../chat-store';

export function useTeamChatNotifications(teamId: string) {
  const clientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<Record<string, StompSubscription>>({});
  const { chatRooms, receiveMessage } = useChatStore();

  const roomIds = useMemo(
    () => chatRooms.map((room) => room.chatRoomId).filter(Boolean),
    [chatRooms]
  );

  useEffect(() => {
    if (!teamId) return;

    const token = localStorage.getItem('accessToken');
    const socketUrl = 'https://api.meezy.kr/ws-chat';

    const syncSubscriptions = () => {
      const client = clientRef.current;

      if (!client?.connected) return;

      const nextRoomIds = new Set(roomIds);

      Object.entries(subscriptionsRef.current).forEach(([roomId, subscription]) => {
        if (!nextRoomIds.has(roomId)) {
          subscription.unsubscribe();
          delete subscriptionsRef.current[roomId];
        }
      });

      roomIds.forEach((roomId) => {
        if (subscriptionsRef.current[roomId]) return;

        subscriptionsRef.current[roomId] = client.subscribe(
          `/topic/chat/${roomId}`,
          (message: any) => {
            try {
              receiveMessage(JSON.parse(message.body));
            } catch (error) {
              console.error('[STOMP] Failed to parse team chat message:', error);
            }
          }
        );
      });
    };

    clientRef.current = new Client({
      webSocketFactory: () =>
        new SockJS(socketUrl, null, { transports: ['websocket'] }),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      heartbeatIncoming: 25000,
      heartbeatOutgoing: 25000,
      onConnect: syncSubscriptions,
      onStompError: (frame) => {
        console.error(
          '[STOMP] Team chat notification error:',
          frame.headers['message']
        );
      },
      onWebSocketError: (event) => {
        console.error('[WebSocket] Team chat notification error:', event);
      },
    });

    clientRef.current.activate();

    return () => {
      Object.values(subscriptionsRef.current).forEach((subscription) =>
        subscription.unsubscribe()
      );
      subscriptionsRef.current = {};
      clientRef.current?.deactivate();
      clientRef.current = null;
    };
  }, [teamId, receiveMessage, roomIds]);

  useEffect(() => {
    const client = clientRef.current;

    if (!client?.connected) return;

    const nextRoomIds = new Set(roomIds);

    Object.entries(subscriptionsRef.current).forEach(([roomId, subscription]) => {
      if (!nextRoomIds.has(roomId)) {
        subscription.unsubscribe();
        delete subscriptionsRef.current[roomId];
      }
    });

    roomIds.forEach((roomId) => {
      if (subscriptionsRef.current[roomId]) return;

      subscriptionsRef.current[roomId] = client.subscribe(
        `/topic/chat/${roomId}`,
        (message: any) => {
          try {
            receiveMessage(JSON.parse(message.body));
          } catch (error) {
            console.error('[STOMP] Failed to parse team chat message:', error);
          }
        }
      );
    });
  }, [receiveMessage, roomIds]);
}
