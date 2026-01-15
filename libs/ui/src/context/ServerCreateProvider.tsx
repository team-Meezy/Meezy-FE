// ServerCreateContext.tsx
'use client';

import { createContext, useContext, useState } from 'react';

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

  return (
    <ServerCreateContext.Provider value={{ imageFile, setImageFile }}>
      {children}
    </ServerCreateContext.Provider>
  );
}

export function useServerCreate() {
  const ctx = useContext(ServerCreateContext);
  if (!ctx) throw new Error('useServerCreate must be used inside provider');
  return ctx;
}
