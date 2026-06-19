import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Client, type StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useChatStore, type Message } from '../../chat-store';
import { STOMP_SOCKET_URL } from '../axios';

export function useTeamChatNotifications(teamId: string) {
  const clientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<Record<string, StompSubscription>>({});
  const roomIdsRef = useRef<string[]>([]);
  const receiveMessageRef = useRef<(message: Message) => void>(() => undefined);
  const { chatRooms, receiveMessage } = useChatStore();

  const roomIds = useMemo(
    () => chatRooms.map((room) => room.chatRoomId).filter(Boolean),
    [chatRooms]
  );

  useEffect(() => {
    roomIdsRef.current = roomIds;
    receiveMessageRef.current = receiveMessage;
  }, [receiveMessage, roomIds]);

  const syncSubscriptions = useCallback(() => {
    const client = clientRef.current;
    if (!client?.connected) return;

    const nextRoomIds = new Set(roomIdsRef.current);

    Object.entries(subscriptionsRef.current).forEach(([roomId, subscription]) => {
      if (!nextRoomIds.has(roomId)) {
        subscription.unsubscribe();
        delete subscriptionsRef.current[roomId];
      }
    });

    roomIdsRef.current.forEach((roomId) => {
      if (subscriptionsRef.current[roomId]) return;

      subscriptionsRef.current[roomId] = client.subscribe(
        `/topic/chat/${roomId}`,
        (message) => {
          try {
            receiveMessageRef.current(JSON.parse(message.body));
          } catch (error) {
            console.error('[STOMP] Failed to parse team chat message:', error);
          }
        }
      );
    });
  }, []);

  useEffect(() => {
    if (!teamId) return;

    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('accessToken')
        : null;

    clientRef.current = new Client({
      webSocketFactory: () =>
        new SockJS(STOMP_SOCKET_URL, null, { transports: ['websocket'] }),
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
  }, [syncSubscriptions, teamId]);

  useEffect(() => {
    syncSubscriptions();
  }, [roomIds, syncSubscriptions]);
}
