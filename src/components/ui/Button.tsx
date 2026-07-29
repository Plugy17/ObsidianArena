// ============================================
// Obsidian Arena — UI Button Component
// ============================================

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'success'
  | 'gold';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps {
  children: ReactNode;
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  className?: string;
  animate?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-purple-neon to-purple-neon-2 text-white border border-purple-neon/50 hover:border-purple-neon hover:shadow-[0_0_12px_theme(colors.purple-neon)]',
  secondary:
    'bg-obsidian-800/70 text-text-primary border border-glass-border hover:border-purple-neon/30',
  ghost:
    'bg-transparent text-text-secondary hover:text-text-primary hover:bg-obsidian-800/50',
  danger:
    'bg-gradient-to-r from-red-600 to-red-700 text-white border border-red-600/50 hover:border-red-400 hover:shadow-[0_0_12px_theme(colors.red.400)]',
  success:
    'bg-gradient-to-r from-green-600 to-green-700 text-white border border-green-600/50 hover:border-green-400 hover:shadow-[0_0_12px_theme(colors.green.400)]',
  gold:
    'bg-gradient-to-r from-gold to-gold-2 text-obsidian-950 border border-gold/50 hover:border-gold-3 hover:shadow-[0_0_12px_theme(colors.gold)]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-2.5 text-lg',
  xl: 'px-8 py-3 text-xl',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  animate = true,
}) => {
  const baseClasses =
    'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-neon/50 focus:ring-offset-2 focus:ring-offset-obsidian-950 disabled:opacity-50 disabled:cursor-not-allowed';

  const widthClass = fullWidth ? 'w-full' : '';

  const content = (
    <>
      {loading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : icon && iconPosition === 'left' ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      <span>{children}</span>
      {icon && iconPosition === 'right' && !loading ? (
        <span className="ml-2">{icon}</span>
      ) : null}
    </>
  );

  if (!animate) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || loading}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
      >
        {content}
      </button>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {content}
    </motion.button>
  );
};
