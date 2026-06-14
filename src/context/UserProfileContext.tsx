import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase';

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
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize from LocalStorage for immediate render while waiting for auth/Firestore
  useEffect(() => {
    const saved = localStorage.getItem('zenith_user_profile');
    if (saved) {
      try {
        setProfile(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse local profile", e);
      }
    }
  }, []);

  // Sync auth state and fetch from Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            setProfile(data);
            localStorage.setItem('zenith_user_profile', JSON.stringify(data));
          }
        } catch (error) {
          console.error("Error fetching profile from Firestore", error);
        }
      } else {
        setUserId(null);
      }
      setIsLoaded(true);
    });
    return () => unsubscribe();
  }, []);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const newProfile = { ...profile, ...updates };
    setProfile(newProfile);
    localStorage.setItem('zenith_user_profile', JSON.stringify(newProfile));
    
    if (userId) {
      try {
        await setDoc(doc(db, 'users', userId), newProfile, { merge: true });
      } catch (error) {
        console.error("Error saving profile to Firestore", error);
      }
    }
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
