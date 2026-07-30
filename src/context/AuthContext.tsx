// ============================================
// Obsidian Arena — Auth Context (Firebase + Telegram)
// ============================================

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { db } from '../services/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

// --- User Profile Type ---
export interface UserProfile {
  id: string;
  telegramId: number;
  username: string;
  firstName: string;
  lastName?: string;
  photoUrl?: string;
  obsBalance: number;
  wins: number;
  losses: number;
  rank: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

// --- Auth Context Type ---
interface AuthContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginWithTelegram: (tgUser: {
    id: number;
    username?: string;
    first_name: string;
    last_name?: string;
    photo_url?: string;
  }) => Promise<UserProfile>;
  updateBalance: (newBalance: number) => Promise<void>;
  updateStats: (won: boolean) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

// --- Default rank ---
const DEFAULT_RANK = 'Bronze';

// --- Auth Provider ---
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- Login / Register with Telegram initData ---
  const loginWithTelegram = useCallback(
    async (tgUser: {
      id: number;
      username?: string;
      first_name: string;
      last_name?: string;
      photo_url?: string;
    }): Promise<UserProfile> => {
      const userDocRef = doc(db, 'users', String(tgUser.id));
      const userDoc = await getDoc(userDocRef);

      let userProfile: UserProfile;

      if (userDoc.exists()) {
        // Existing user
        userProfile = userDoc.data() as UserProfile;
      } else {
        // New user — create profile
        userProfile = {
          id: String(tgUser.id),
          telegramId: tgUser.id,
          username: tgUser.username || `player_${tgUser.id}`,
          firstName: tgUser.first_name,
          lastName: tgUser.last_name || '',
          photoUrl: tgUser.photo_url || '',
          obsBalance: 100, // Default balance
          wins: 0,
          losses: 0,
          rank: DEFAULT_RANK,
        };
        await setDoc(userDocRef, {
          ...userProfile,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      setProfile(userProfile);
      return userProfile;
    },
    []
  );

  // --- Update balance ---
  const updateBalance = useCallback(
    async (newBalance: number) => {
      if (!profile) return;
      const userDocRef = doc(db, 'users', profile.id);
      await updateDoc(userDocRef, {
        obsBalance: newBalance,
        updatedAt: serverTimestamp(),
      });
      setProfile({ ...profile, obsBalance: newBalance });
    },
    [profile]
  );

  // --- Update win/loss stats ---
  const updateStats = useCallback(
    async (won: boolean) => {
      if (!profile) return;
      const userDocRef = doc(db, 'users', profile.id);
      const newWins = profile.wins + (won ? 1 : 0);
      const newLosses = profile.losses + (won ? 0 : 1);
      await updateDoc(userDocRef, {
        wins: newWins,
        losses: newLosses,
        updatedAt: serverTimestamp(),
      });
      setProfile({ ...profile, wins: newWins, losses: newLosses });
    },
    [profile]
  );

  // --- Refresh profile from Firestore ---
  const refreshProfile = useCallback(async () => {
    if (!profile) return;
    const userDocRef = doc(db, 'users', profile.id);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      setProfile(userDoc.data() as UserProfile);
    }
  }, [profile]);

  // --- Auto-login from Telegram WebApp on mount ---
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const tg = window.Telegram?.WebApp;
      const tgUser = tg?.initDataUnsafe?.user;
      if (tgUser) {
        try {
          await loginWithTelegram({
            id: tgUser.id,
            username: tgUser.username,
            first_name: tgUser.first_name,
            last_name: tgUser.last_name,
            photo_url: tgUser.photo_url,
          });
        } catch (e) {
          console.error('Auth error:', e);
        }
      }
      setIsLoading(false);
    };
    init();
  }, [loginWithTelegram]);

  const value: AuthContextType = {
    profile,
    isLoading,
    isAuthenticated: !!profile,
    loginWithTelegram,
    updateBalance,
    updateStats,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
