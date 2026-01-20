'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

const ServerStateContext = createContext<{
  feedback: boolean;
  setFeedback: (open: boolean) => void;
  summary: boolean;
  setSummary: (open: boolean) => void;
  chatRoom: boolean;
  setChatRoom: (open: boolean) => void;
  serverProfile: boolean;
  setServerProfile: (open: boolean) => void;
  mypage: boolean;
  setMypage: (open: boolean) => void;
  joined: boolean;
  setJoined: (open: boolean) => void;
} | null>(null);

export function ServerStateProvider({ children }: { children: ReactNode }) {
  const [chatRoom, setChatRoom] = useState(false);
  const [feedback, setFeedback] = useState(false);
  const [summary, setSummary] = useState(false);
  const [serverProfile, setServerProfile] = useState(false);
  const [mypage, setMypage] = useState(false);
  const [joined, setJoined] = useState(true);

  return (
    <ServerStateContext.Provider
      value={{
        feedback,
        setFeedback,
        summary,
        setSummary,
        chatRoom,
        setChatRoom,
        serverProfile,
        setServerProfile,
        mypage,
        setMypage,
        joined,
        setJoined,
      }}
    >
      {children}
    </ServerStateContext.Provider>
  );
}

export function useServerState() {
  const ctx = useContext(ServerStateContext);
  if (!ctx) throw new Error('useServerState must be used inside provider');
  return ctx;
}
