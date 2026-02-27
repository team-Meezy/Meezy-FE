// ServerCreateContext.tsx
'use client';

import { createContext, useContext, useState, useMemo } from 'react';

const ServerCreateContext = createContext<{
  imageFile: File | null;
  setImageFile: (f: File | null) => void;
} | null>(null);

export function ServerCreateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [imageFile, setImageFile] = useState<File | null>(null);

  const value = useMemo(() => ({ imageFile, setImageFile }), [imageFile]);

  return (
    <ServerCreateContext.Provider value={value}>
      {children}
    </ServerCreateContext.Provider>
  );
}

export function useServerCreate() {
  const ctx = useContext(ServerCreateContext);
  if (!ctx) throw new Error('useServerCreate must be used inside provider');
  return ctx;
}
