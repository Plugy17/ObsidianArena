// ============================================
// Obsidian Arena — Sidebar Navigation (Desktop)
// ============================================

import { motion } from 'framer-motion';
import {
  Sword,
  Backpack,
  ShoppingCart,
  Shield,
  Sparkles,
} from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { useGameStore } from '../../store/gameStore';
import { NAVIGATION_TABS } from '../../config/constants';
import type { TabType } from '../../types';

const tabIcons: Record<TabType, React.FC<{ size: number }>> = {
  arena: Sword,
  inventory: Backpack,
  market: ShoppingCart,
  guilds: Shield,
};

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab } = useUser();
  const safeAreaInsets = useGameStore((state) => state.safeAreaInsets);
  const safeTop = safeAreaInsets?.top ?? 0;

  return (
    <motion.aside
      className="hidden md:flex flex-col w-64 fixed left-0 top-0 bottom-0 bg-[#12121a] border-r border-purple-500/20 p-6 z-40"
      style={{ paddingTop: `${safeTop + 24}px` }}
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {/* Logo */}
      <div className="mb-8 flex items-center space-x-2">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <Sparkles size={28} className="text-purple-neon" />
        </motion.div>
        <div>
          <h1
            className="text-lg font-bold"
            style={{
              background: 'linear-gradient(135deg, #8a2be2 0%, #daa520 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            OBSIDIAN
          </h1>
          <p className="text-xs text-purple-neon/60 tracking-widest">ARENA</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {NAVIGATION_TABS.map((tab, index) => {
          const Icon = tabIcons[tab.id as TabType];
          const isActive = activeTab === tab.id;

          return (
            <motion.button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`
                w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200
                ${
                  isActive
                    ? 'text-gold bg-gold/10 border border-gold/30'
                    : 'text-text-secondary hover:text-text-primary hover:bg-obsidian-800/50'
                }
              `}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Icon size={22} />
              <span className="font-medium">{tab.label}</span>
              {isActive && (
                <motion.div
                  className="ml-auto w-1.5 h-1.5 bg-gold rounded-full"
                  layoutId="sidebarActiveDot"
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-purple-500/10">
        <p className="text-xs text-text-tertiary text-center">
          Obsidian Arena v1.0
        </p>
      </div>
    </motion.aside>
  );
};