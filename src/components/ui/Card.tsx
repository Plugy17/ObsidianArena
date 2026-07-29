// ============================================
// Obsidian Arena — UI Card Component
// ============================================

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

export type CardVariant = 'default' | 'glass' | 'glass-purple' | 'glass-gold';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
  animate?: boolean;
}

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-obsidian-800/50 border border-glass-border',
  glass: 'glass',
  'glass-purple': 'glass-purple',
  'glass-gold': 'glass-gold',
};

const paddingClasses: Record<CardPadding, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'glass',
  padding = 'md',
  className = '',
  hoverable = false,
  onClick,
  animate = true,
}) => {
  const cardContent = (
    <div
      className={`
        rounded-xl transition-all duration-200
        ${variantClasses[variant]}
        ${paddingClasses[padding]}
        ${hoverable ? 'hover:border-purple-neon/40 hover:shadow-[0_0_16px_rgba(138,43,226,0.2)]' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );

  if (!animate) {
    return cardContent;
  }

  return (
    <motion.div
      whileHover={hoverable ? { scale: 1.01 } : undefined}
      whileTap={onClick ? { scale: 0.99 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {cardContent}
    </motion.div>
  );
};
