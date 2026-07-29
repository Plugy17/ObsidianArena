// ============================================
// Obsidian Arena — Telegram Web Apps Provider
// ============================================

import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useRawInitData } from '@telegram-apps/sdk-react';

// --- Telegram Web App global type ---
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
            language_code?: string;
          };
          chat?: {
            id: number;
            title?: string;
            username?: string;
            type?: string;
          };
          auth_date: number;
          query_id?: string;
          start_param?: string;
          [key: string]: unknown;
        };
        expand: () => void;
        close: () => void;
        showAlert: (message: string) => void;
        showConfirm: (
          message: string,
          callback?: (confirmed: boolean) => void
        ) => void;
        showPopup: (params: Record<string, unknown>) => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        enableClosingConfirmation: () => void;
        disableClosingConfirmation: () => void;
        MainButton: {
          show: () => void;
          hide: () => void;
          setText: (text: string) => void;
          enable: () => void;
          disable: () => void;
          isVisible: boolean;
          isActive: boolean;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        BackButton: {
          show: () => void;
          hide: () => void;
          isVisible: boolean;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        HapticFeedback: {
          impact: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notification: (type: 'error' | 'success' | 'warning') => void;
          selection: () => void;
        };
        [key: string]: unknown;
      };
    };
  }
}

// --- Telegram Context Type ---
export interface TelegramContextType {
  isAvailable: boolean;
  initData: string | null;
  user: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    language_code?: string;
  } | null;
  chat: {
    id: number;
    title?: string;
    username?: string;
    type?: string;
  } | null;
  expand: () => void;
  close: () => void;
  showPopup: (params: Record<string, unknown>) => void;
  showAlert: (message: string) => void;
  showConfirm: (
    message: string,
    callback?: (confirmed: boolean) => void
  ) => void;
  mainButton: {
    show: () => void;
    hide: () => void;
    setText: (text: string) => void;
    enable: () => void;
    disable: () => void;
    isVisible: boolean;
    isActive: boolean;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  } | null;
  backButton: {
    show: () => void;
    hide: () => void;
    isVisible: boolean;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  } | null;
  haptic: {
    impact: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notification: (type: 'error' | 'success' | 'warning') => void;
    selection: () => void;
  } | null;
}

const TelegramContext = createContext<TelegramContextType | undefined>(
  undefined
);

// --- Hook for consuming Telegram context ---
export const useTelegram = (): TelegramContextType => {
  const context = useContext(TelegramContext);
  if (!context) {
    throw new Error('useTelegram must be used within a TelegramProvider');
  }
  return context;
};

// --- Telegram Provider ---
export const TelegramProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [user, setUser] = useState<TelegramContextType['user']>(null);
  const [chat, setChat] = useState<TelegramContextType['chat']>(null);
  const [initData, setInitData] = useState<string | null>(null);

  // useRawInitData is safe — returns undefined when not in TMA (doesn't throw)
  const rawInitData = useRawInitData();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    const available = !!tg;
    setIsAvailable(available);

    if (available && tg) {
      // Expand to full height
      tg.expand();
      // Enable closing confirmation
      tg.enableClosingConfirmation();
      // Set header color
      tg.setHeaderColor('#1a1a2e');
      // Set background color
      tg.setBackgroundColor('#0a0a12');

      // Extract user from initDataUnsafe
      const tgUser = tg.initDataUnsafe?.user;
      if (tgUser) {
        setUser(tgUser);
      }

      const tgChat = tg.initDataUnsafe?.chat;
      if (tgChat) {
        setChat(tgChat);
      }

      // Set init data from WebApp
      if (tg.initData) {
        setInitData(tg.initData);
      }
    }

    // Use raw init data from SDK (safe fallback)
    if (rawInitData) {
      setInitData(rawInitData);
    }
  }, [rawInitData]);

  const tg = window.Telegram?.WebApp;

  const expand = () => {
    if (tg) tg.expand();
  };

  const close = () => {
    if (tg) tg.close();
  };

  const showPopup = (params: Record<string, unknown>) => {
    if (tg) tg.showPopup(params);
  };

  const showAlert = (message: string) => {
    if (tg) tg.showAlert(message);
  };

  const showConfirm = (
    message: string,
    callback?: (confirmed: boolean) => void
  ) => {
    if (tg) tg.showConfirm(message, callback);
  };

  const mainButton = tg?.MainButton
    ? {
        show: () => tg.MainButton.show(),
        hide: () => tg.MainButton.hide(),
        setText: (text: string) => tg.MainButton.setText(text),
        enable: () => tg.MainButton.enable(),
        disable: () => tg.MainButton.disable(),
        isVisible: tg.MainButton.isVisible,
        isActive: tg.MainButton.isActive,
        onClick: (callback: () => void) => tg.MainButton.onClick(callback),
        offClick: (callback: () => void) => tg.MainButton.offClick(callback),
      }
    : null;

  const backButton = tg?.BackButton
    ? {
        show: () => tg.BackButton.show(),
        hide: () => tg.BackButton.hide(),
        isVisible: tg.BackButton.isVisible,
        onClick: (callback: () => void) => tg.BackButton.onClick(callback),
        offClick: (callback: () => void) => tg.BackButton.offClick(callback),
      }
    : null;

  const haptic = tg?.HapticFeedback
    ? {
        impact: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') =>
          tg.HapticFeedback.impact(style),
        notification: (type: 'error' | 'success' | 'warning') =>
          tg.HapticFeedback.notification(type),
        selection: () => tg.HapticFeedback.selection(),
      }
    : null;

  const value: TelegramContextType = {
    isAvailable,
    initData,
    user,
    chat,
    expand,
    close,
    showPopup,
    showAlert,
    showConfirm,
    mainButton,
    backButton,
    haptic,
  };

  return (
    <TelegramContext.Provider value={value}>
      {children}
    </TelegramContext.Provider>
  );
};
