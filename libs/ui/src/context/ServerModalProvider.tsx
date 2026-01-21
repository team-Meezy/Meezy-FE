'use client';

import { createContext, useContext, useState } from 'react';

const ServerModalContext = createContext<{
  isModalOpen: boolean;
  setIsModalOpen: (f: boolean) => void;
} | null>(null);

export function ServerModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <ServerModalContext.Provider value={{ isModalOpen, setIsModalOpen }}>
      {children}
    </ServerModalContext.Provider>
  );
}

export function useServerModal() {
  const ctx = useContext(ServerModalContext);
  if (!ctx) throw new Error('useServerModal must be used inside provider');
  return ctx;
}
