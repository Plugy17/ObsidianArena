// ============================================
// Obsidian Arena — Bottom Navigation Component
// ============================================

import { motion } from 'framer-motion';
import {
  Sword,
  Backpack,
  ShoppingCart,
  Shield,
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

export const BottomNavigation: React.FC = () => {
  const { activeTab, setActiveTab } = useUser();
  const safeAreaInsets = useGameStore((state) => state.safeAreaInsets);

  // Calculate bottom padding from safe area insets (iOS home indicator, etc.)
  const safeBottom = safeAreaInsets?.bottom ?? 0;

  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{ paddingBottom: `${safeBottom}px` }}
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <div className="flex items-center justify-around p-2 backdrop-blur-md bg-black/60 border-t border-purple-neon/20">
        {NAVIGATION_TABS.map((tab) => {
          const Icon = tabIcons[tab.id as TabType];
          const isActive = activeTab === tab.id;

          return (
            <motion.button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`
                relative flex flex-col items-center justify-center
                w-16 h-16 rounded-xl transition-all duration-200
                ${
                  isActive
                    ? 'text-gold bg-gold/10 border border-gold/30'
                    : 'text-text-secondary hover:text-text-primary hover:bg-obsidian-800/50'
                }
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-1 bg-gold rounded-full"
                  layoutId="activeTabIndicator"
                />
              )}

              <Icon size={22} />
              <span className="text-xs mt-1 font-medium">{tab.label}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
};