// ============================================
// Obsidian Arena — Header Component
// ============================================

import { motion } from 'framer-motion';
import { Wallet, Trophy, Gem, Coins } from 'lucide-react';
import { useTon } from '../../context/TonProvider';
import { useUser } from '../../context/UserContext';
import {
  useTelegramUser,
  useTonWallet,
  useObsidianBalance,
} from '../../store/gameStore';
import { Button } from '../ui/Button';

export const Header: React.FC = () => {
  const { user, isLoading } = useUser();
  const { isConnected, connect, disconnect } = useTon();

  // --- Get data from Zustand game store ---
  const telegramUser = useTelegramUser();
  const tonWallet = useTonWallet();
  const obsidianBalance = useObsidianBalance();

  // Determine display name and avatar — prefer Telegram data, fallback to UserContext
  const displayName =
    telegramUser?.first_name || user?.firstName || 'Гость';
  const displayAvatar =
    telegramUser?.photo_url ||
    user?.avatarUrl ||
    `https://placehold.co/40x40/8a2be2/ffffff?text=${displayName[0] || 'U'}`;
  const displayLevel = user?.level || 1;
  const displayGramBalance = user?.gramBalance || 0;

  // Use store balance if available (> 0), otherwise fall back to UserContext
  const displayObsidianBalance =
    obsidianBalance > 0 ? obsidianBalance : user?.obsidianBalance || 0;

  // Use store wallet if available, otherwise fall back to UserContext
  const displayWallet = tonWallet || user?.walletAddress || '';

  if (isLoading || !user) {
    return (
      <header className="flex items-center justify-between p-4 glass-purple rounded-b-2xl">
        <div className="animate-pulse flex items-center space-x-3">
          <div className="w-10 h-10 bg-obsidian-700 rounded-full" />
          <div className="h-4 w-24 bg-obsidian-700 rounded" />
        </div>
        <div className="animate-pulse">
          <div className="h-8 w-32 bg-obsidian-700 rounded-xl" />
        </div>
      </header>
    );
  }

  const formatAddress = (addr: string): string => {
    if (addr.length <= 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

  const formatBalance = (balance: number): string => {
    if (balance >= 1000000) {
      return `${(balance / 1000000).toFixed(1)}M`;
    }
    if (balance >= 1000) {
      return `${(balance / 1000).toFixed(1)}K`;
    }
    return balance.toFixed(1);
  };

  return (
    <motion.header
      className="flex items-center justify-between p-4 glass-purple rounded-b-2xl"
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {/* Left: User Info */}
      <div className="flex items-center space-x-3">
        <motion.img
          src={displayAvatar}
          alt={displayName}
          className="w-10 h-10 rounded-full border-2 border-purple-neon/50 object-cover"
          whileHover={{ scale: 1.1, rotate: 5 }}
        />
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-text-primary">
              {displayName}
            </span>
            <motion.span
              className="text-xs bg-gold/20 text-gold px-1.5 py-0.5 rounded-full flex items-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <Trophy size={12} className="mr-0.5" />
              {displayLevel}
            </motion.span>
          </div>
          <div className="flex items-center space-x-3 text-xs text-text-secondary">
            <span className="flex items-center">
              <Gem size={12} className="mr-1 text-purple-neon" />
              {formatBalance(displayObsidianBalance)} OBS
            </span>
            {displayGramBalance !== undefined && displayGramBalance > 0 && (
              <span className="flex items-center">
                <Coins size={12} className="mr-1 text-gold" />
                {displayGramBalance.toFixed(3)} GRAM
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Wallet Connection */}
      <div className="flex items-center space-x-3">
        {(isConnected || displayWallet) && (
          <motion.div
            className="text-xs text-text-secondary hidden sm:block"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {formatAddress(displayWallet)}
          </motion.div>
        )}
        {isConnected ? (
          <Button
            variant="secondary"
            size="sm"
            icon={<Wallet size={16} />}
            onClick={disconnect}
            animate={false}
          >
            Отключить
          </Button>
        ) : (
          <Button
            variant="gold"
            size="sm"
            icon={<Wallet size={16} />}
            onClick={connect}
          >
            Подключить
          </Button>
        )}
      </div>
    </motion.header>
  );
};
