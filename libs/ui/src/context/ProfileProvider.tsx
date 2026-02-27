'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { getMyProfile } from '@org/shop-data';

const ProfileContext = createContext<{
  profile: any;
  loading: boolean;
  refetchProfile: () => Promise<void>;
  silentRefetchProfile: () => Promise<void>;
} | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await getMyProfile();
      setProfile(data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const silentFetchProfile = async () => {
    try {
      const data = await getMyProfile();
      setProfile(data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const value = useMemo(
    () => ({
      profile,
      loading,
      refetchProfile: fetchProfile,
      silentRefetchProfile: silentFetchProfile,
    }),
    [profile, loading]
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
