import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserProfile {
  avatarUrl: string;
  height: string;
  weight: string;
  primaryGoal: string;
  isFasting: boolean;
}

const DEFAULT_PROFILE: UserProfile = {
  avatarUrl: '',
  height: '',
  weight: '',
  primaryGoal: '',
  isFasting: false,
};

interface UserProfileContextType {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const UserProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('zenith_user_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse user profile", e);
      }
    }
    return DEFAULT_PROFILE;
  });

  useEffect(() => {
    localStorage.setItem('zenith_user_profile', JSON.stringify(profile));
  }, [profile]);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  return (
    <UserProfileContext.Provider value={{ profile, updateProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
};
