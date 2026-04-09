import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BASE_URL, STOMP_SOCKET_URL } from '../axios';
import { logMeetingStomp } from '../../recording-console';

type PublishRequest = {
  destination: string;
  body?: string;
};

type SubscriberCallback = (message: IMessage) => void;

const subscriberMap = new Map<string, Set<SubscriberCallback>>();
const subscriptionMap = new Map<string, StompSubscription>();
const pendingPublishes: PublishRequest[] = [];

let sharedClient: Client | null = null;
let referenceCount = 0;

function getConnectHeaders() {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('accessToken')
      : null;

  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function subscribeDestination(destination: string) {
  if (!sharedClient?.connected || subscriptionMap.has(destination)) {
    return;
  }

  const subscription = sharedClient.subscribe(destination, (message) => {
    const callbacks = subscriberMap.get(destination);
    if (!callbacks || callbacks.size === 0) {
      return;
    }

    callbacks.forEach((callback) => callback(message));
  });

  subscriptionMap.set(destination, subscription);
}

function resubscribeAll() {
  subscriptionMap.forEach((subscription) => subscription.unsubscribe());
  subscriptionMap.clear();

  subscriberMap.forEach((_callbacks, destination) => {
    subscribeDestination(destination);
  });
}

function flushPendingPublishes() {
  if (!sharedClient?.connected || pendingPublishes.length === 0) {
    return;
  }

  const queuedPublishes = [...pendingPublishes];
  pendingPublishes.length = 0;

  queuedPublishes.forEach(({ destination, body }) => {
    logMeetingStomp('flush', {
      destination,
      hasBody: Boolean(body),
      queuedCount: queuedPublishes.length,
    });
    sharedClient?.publish({
      destination,
      body,
    });
  });
}

function ensureClient() {
  if (sharedClient || !BASE_URL) {
    return;
  }

  logMeetingStomp('connect', {
    socketUrl: STOMP_SOCKET_URL,
  });

  sharedClient = new Client({
    webSocketFactory: () => new SockJS(STOMP_SOCKET_URL, null, {}),
    connectHeaders: getConnectHeaders(),
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => {
      logMeetingStomp('connected', {
        subscriptions: subscriberMap.size,
      });
      resubscribeAll();
      flushPendingPublishes();
    },
    onWebSocketClose: () => {
      logMeetingStomp('close');
      subscriptionMap.clear();
    },
    onDisconnect: () => {
      logMeetingStomp('disconnect');
      subscriptionMap.clear();
    },
  });

  sharedClient.activate();
}

export function retainSharedMeetingStomp() {
  referenceCount += 1;
  ensureClient();
}

export function releaseSharedMeetingStomp() {
  referenceCount = Math.max(0, referenceCount - 1);

  if (referenceCount > 0 || !sharedClient) {
    return;
  }

  const clientToClose = sharedClient;
  sharedClient = null;
  pendingPublishes.length = 0;
  subscriptionMap.clear();
  void clientToClose.deactivate();
}

export function subscribeSharedMeetingTopic(
  destination: string,
  callback: SubscriberCallback
) {
  const callbacks = subscriberMap.get(destination) ?? new Set<SubscriberCallback>();
  callbacks.add(callback);
  subscriberMap.set(destination, callbacks);
  subscribeDestination(destination);

  return () => {
    const currentCallbacks = subscriberMap.get(destination);
    if (!currentCallbacks) {
      return;
    }

    currentCallbacks.delete(callback);

    if (currentCallbacks.size > 0) {
      return;
    }

    subscriberMap.delete(destination);
    const subscription = subscriptionMap.get(destination);
    if (subscription) {
      subscription.unsubscribe();
      subscriptionMap.delete(destination);
    }
  };
}

export function publishSharedMeetingMessage(request: PublishRequest) {
  if (sharedClient?.connected) {
    logMeetingStomp('send', {
      destination: request.destination,
      hasBody: Boolean(request.body),
      connected: true,
    });
    sharedClient.publish(request);
    return;
  }

  logMeetingStomp('queue', {
    destination: request.destination,
    hasBody: Boolean(request.body),
    connected: false,
    pendingCount: pendingPublishes.length + 1,
  });
  pendingPublishes.push(request);
  ensureClient();
}

export function isSharedMeetingStompConnected() {
  return Boolean(sharedClient?.connected);
}
