// ============================================
// Obsidian Arena — Splash Screen Component
// ============================================

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';

export interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  duration = 2000,
}) => {
  const [progress, setProgress] = useState(0);
  const setTelegramUser = useGameStore((state) => state.setTelegramUser);
  const setIsTelegramAvailable = useGameStore(
    (state) => state.setIsTelegramAvailable
  );
  const setSafeAreaInsets = useGameStore((state) => state.setSafeAreaInsets);

  // Auto-authenticate from Telegram WebApp SDK
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    const available = !!tg;
    setIsTelegramAvailable(available);

    // Expand to fullscreen
    if (available && tg) {
      (tg as any).ready(); // Явно указываем тип как any, чтобы обойти ошибку TypeScript
      tg.expand();
      // Включаем истинный Fullscreen (Bot API 8.0+)
      if (typeof (tg as any).requestFullscreen === 'function') {
        // (tg as any).requestFullscreen(); // Включается автоматически при expand() в Telegram Mini Apps
      }

      // Красим шапку и фон в цвет темы приложения (#0d0d12)
      tg.setHeaderColor('#0d0d12');
      tg.setBackgroundColor('#0d0d12');
      tg.enableClosingConfirmation();

      // Read safe area insets
      const safeAreaInsets = tg.safeAreaInsets as
        | { top: number; bottom: number; left: number; right: number }
        | undefined;
      if (safeAreaInsets) {
        setSafeAreaInsets({
          top: safeAreaInsets.top,
          bottom: safeAreaInsets.bottom,
          left: safeAreaInsets.left,
          right: safeAreaInsets.right,
        });
      }

      // Auto-authenticate user from initDataUnsafe
      const tgUser = tg.initDataUnsafe?.user;
      if (tgUser) {
        setTelegramUser({
          id: tgUser.id,
          username: tgUser.username,
          first_name: tgUser.first_name,
          last_name: tgUser.last_name,
          photo_url: tgUser.photo_url,
          language_code: tgUser.language_code,
        });
      }
    }
  }, [setTelegramUser, setIsTelegramAvailable, setSafeAreaInsets]);

  // Progress bar animation
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(100, (elapsed / duration) * 100);
      setProgress(newProgress);

      if (elapsed >= duration) {
        clearInterval(interval);
        onComplete();
      }
    }, 16);

    return () => clearInterval(interval);
  }, [duration, onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{ backgroundColor: '#0d0d12' }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      {/* Animated background glow */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(138,43,226,0.15) 0%, rgba(13,13,18,0) 70%)',
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(218,165,32,0.08) 0%, rgba(13,13,18,0) 70%)',
          }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.5,
          }}
        />
      </div>

      {/* Logo & Title */}
      <motion.div
        className="relative z-10 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Obsidian crystal icon */}
        <motion.div
          className="mx-auto mb-6 relative"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        >
          <svg
            width="80"
            height="80"
            viewBox="0 0 80 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <motion.path
              d="M40 5 L65 25 L55 70 L25 70 L15 25 Z"
              fill="url(#obsidianGradient)"
              stroke="#8a2be2"
              strokeWidth="2"
              filter="url(#glow)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
            />
            <path
              d="M40 5 L40 70"
              stroke="#daa520"
              strokeWidth="1"
              opacity="0.5"
            />
            <path
              d="M15 25 L65 25"
              stroke="#daa520"
              strokeWidth="1"
              opacity="0.3"
            />
            <defs>
              <linearGradient
                id="obsidianGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#1a1a2e" />
                <stop offset="50%" stopColor="#2d1b4e" />
                <stop offset="100%" stopColor="#0d0d12" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
          </svg>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-4xl font-bold mb-2"
          style={{
            background: 'linear-gradient(135deg, #8a2be2 0%, #daa520 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
          initial={{ opacity: 0, letterSpacing: '0.5em' }}
          animate={{ opacity: 1, letterSpacing: '0.1em' }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          OBSIDIAN
        </motion.h1>
        <motion.h2
          className="text-xl font-light tracking-[0.4em] text-purple-neon/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          ARENA
        </motion.h2>

        {/* Loading text */}
        <motion.p
          className="text-sm text-text-secondary mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {progress < 30
            ? 'Инициализация...'
            : progress < 60
              ? 'Подключение к Telegram...'
              : progress < 90
                ? 'Загрузка арены...'
                : 'Готово!'}
        </motion.p>
      </motion.div>

      {/* Progress bar */}
      <motion.div
        className="absolute bottom-20 left-1/2 -translate-x-1/2 w-64 z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <div className="w-full h-1 bg-obsidian-800/50 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #8a2be2 0%, #daa520 100%)',
              width: `${progress}%`,
            }}
          />
        </div>
        <div className="text-center text-xs text-text-tertiary mt-2">
          {Math.round(progress)}%
        </div>
      </motion.div>
    </motion.div>
  );
};