// ============================================
// Obsidian Arena — Zustand Game Store
// ============================================

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// --- Telegram User Type ---
export interface TelegramUser {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  language_code?: string;
}

// --- Safe Area Insets (Telegram Mini App) ---
export interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

// --- Game Store State ---
export interface GameState {
  // Telegram data
  telegramUser: TelegramUser | null;
  isTelegramAvailable: boolean;

  // TON Connect data
  tonWallet: string;
  isWalletConnected: boolean;

  // Economy
  obsidianBalance: number;
  gramBalance: number;

  // Safe area insets (Telegram Mini App)
  safeAreaInsets: SafeAreaInsets | null;

  // Actions
  setTelegramUser: (user: TelegramUser | null) => void;
  setIsTelegramAvailable: (available: boolean) => void;
  setTonWallet: (address: string) => void;
  setIsWalletConnected: (connected: boolean) => void;
  setObsidianBalance: (balance: number) => void;
  updateObsidianBalance: (amount: number) => void;
  setGramBalance: (balance: number) => void;
  updateGramBalance: (amount: number) => void;
  setSafeAreaInsets: (insets: SafeAreaInsets | null) => void;
}

// --- Create Store ---
export const useGameStore = create<GameState>()(
  subscribeWithSelector((set) => ({
    // Initial state
    telegramUser: null,
    isTelegramAvailable: false,
    tonWallet: '',
    isWalletConnected: false,
    obsidianBalance: 0,
    gramBalance: 0,
    safeAreaInsets: null,

    // Telegram actions
    setTelegramUser: (user) => set({ telegramUser: user }),
    setIsTelegramAvailable: (available) =>
      set({ isTelegramAvailable: available }),

    // TON Connect actions
    setTonWallet: (address) => set({ tonWallet: address }),
    setIsWalletConnected: (connected) =>
      set({ isWalletConnected: connected }),

    // Economy actions
    setObsidianBalance: (balance) => set({ obsidianBalance: balance }),
    updateObsidianBalance: (amount) =>
      set((state) => ({
        obsidianBalance: Math.max(0, state.obsidianBalance + amount),
      })),
    setGramBalance: (balance) => set({ gramBalance: balance }),
    updateGramBalance: (amount) =>
      set((state) => ({
        gramBalance: Math.max(0, state.gramBalance + amount),
      })),
    setSafeAreaInsets: (insets) => set({ safeAreaInsets: insets }),
  }))
);

// --- Selectors for convenient access ---
export const useTelegramUser = () => useGameStore((state) => state.telegramUser);
export const useTonWallet = () => useGameStore((state) => state.tonWallet);
export const useObsidianBalance = () =>
  useGameStore((state) => state.obsidianBalance);
export const useIsWalletConnected = () =>
  useGameStore((state) => state.isWalletConnected);
