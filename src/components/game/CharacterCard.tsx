// ============================================
// Obsidian Arena — Character Card Component
// ============================================

import { motion } from 'framer-motion';
import {
  Sword,
  Shield,
  Zap,
  Heart,
  Star,
} from 'lucide-react';
import type { Character } from '../../types';
import { RARITY_CONFIG, ROLE_CONFIG } from '../../config/constants';
import { Card } from '../ui/Card';

export interface CharacterCardProps {
  character: Character;
  isSelected?: boolean;
  onSelect?: () => void;
  showStats?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  isSelected = false,
  onSelect,
  showStats = true,
  size = 'md',
}) => {
  const rarityConfig = RARITY_CONFIG[character.rarity];
  const roleConfig = ROLE_CONFIG[character.role];

  const sizeConfig = {
    sm: { img: 'w-20 h-20', card: 'p-3' },
    md: { img: 'w-full h-40 md:h-48', card: 'p-4' },
    lg: { img: 'w-full h-48 md:h-64', card: 'p-6' },
  };

  const expPercent = Math.min(
    100,
    (character.experience / (character.level * 100)) * 100
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="w-full"
    >
      <Card
        variant={isSelected ? 'glass-gold' : 'glass-purple'}
        padding="none"
        hoverable={!!onSelect}
        onClick={onSelect}
        className={`relative overflow-hidden ${sizeConfig[size].card}`}
      >
        {/* Rarity border glow */}
        <div
          className="absolute inset-0 rounded-xl opacity-30"
          style={{
            boxShadow: `0 0 20px ${rarityConfig.color}`,
          }}
        />

        {/* Selection indicator */}
        {isSelected && (
          <motion.div
            className="absolute top-2 right-2 z-10 bg-gold rounded-full p-1"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <Star size={14} className="text-obsidian-950" fill="currentColor" />
          </motion.div>
        )}

        <div className="relative flex flex-col items-center text-center">
          {/* Character Image */}
          <motion.img
            src={character.imageUrl}
            alt={character.name}
            className={`${sizeConfig[size].img} object-cover rounded-lg mb-3 border-2`}
            style={{ borderColor: rarityConfig.color }}
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300 }}
          />

          {/* Name & Role */}
          <h3
            className="font-bold text-lg mb-1"
            style={{ color: rarityConfig.color }}
          >
            {character.name}
          </h3>
          <div
            className="text-xs px-2 py-0.5 rounded-full mb-2 flex items-center space-x-1"
            style={{
              backgroundColor: `${roleConfig.color}20`,
              color: roleConfig.color,
            }}
          >
            <span>{roleConfig.icon}</span>
            <span>{roleConfig.label}</span>
          </div>

          {/* Stats */}
          {showStats && (
            <div className="grid grid-cols-2 gap-2 w-full mt-2">
              <div className="flex items-center justify-center space-x-1 text-sm">
                <Sword size={14} className="text-purple-neon" />
                <span className="text-text-secondary">
                  Атк: <span className="text-text-primary">{character.attack}</span>
                </span>
              </div>
              <div className="flex items-center justify-center space-x-1 text-sm">
                <Shield size={14} className="text-blue-400" />
                <span className="text-text-secondary">
                  Защ: <span className="text-text-primary">{character.defense}</span>
                </span>
              </div>
              <div className="flex items-center justify-center space-x-1 text-sm">
                <Zap size={14} className="text-yellow-400" />
                <span className="text-text-secondary">
                  Скор: <span className="text-text-primary">{character.speed}</span>
                </span>
              </div>
              <div className="flex items-center justify-center space-x-1 text-sm">
                <Heart size={14} className="text-red-400" />
                <span className="text-text-secondary">
                  HP: <span className="text-text-primary">{character.health}</span>
                </span>
              </div>
            </div>
          )}

          {/* Level & Experience */}
          <div className="w-full mt-3">
            <div className="flex justify-between text-xs text-text-secondary mb-1">
              <span>Уровень {character.level}</span>
              <span>
                {character.experience} / {character.level * 100} XP
              </span>
            </div>
            <div className="w-full h-2 bg-obsidian-700/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-neon to-gold rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${expPercent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Rarity Badge */}
          <div
            className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-xs font-bold"
            style={{
              backgroundColor: rarityConfig.bgColor,
              color: rarityConfig.color,
              border: `1px solid ${rarityConfig.borderColor}`,
            }}
          >
            {rarityConfig.label}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
