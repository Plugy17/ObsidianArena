// ============================================
// Obsidian Arena — HUD Component
// ============================================

import { motion } from 'framer-motion';
import { Zap, Heart, Clock, Gem, Skull } from 'lucide-react';
import type { MatchStateData } from '../../logic/moba/types';

interface HUDProps {
  matchState: MatchStateData;
  onAbilityPress: (key: 'Q' | 'W' | 'E' | 'R') => void;
  abilityNames: { Q: string; W: string; E: string; R: string };
  cooldowns: { Q: number; W: number; E: number; R: number };
  maxCooldowns: { Q: number; W: number; E: number; R: number };
  isPC: boolean;
}

export const HUD: React.FC<HUDProps> = ({
  matchState,
  onAbilityPress,
  abilityNames,
  cooldowns,
  maxCooldowns,
  isPC,
}) => {
  const player = matchState.playerChampion;
  const healthPercent = (player.health / player.maxHealth) * 100;
  const xpPercent = Math.min(100, (matchState.playerXP / (matchState.playerLevel * 100)) * 100);

  const formatTime = (ms: number): string => {
    const totalSec = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
      {/* Player Stats Bar */}
      <div className="absolute bottom-4 left-4 pointer-events-auto">
        <div className="glass-purple rounded-xl p-3 min-w-[200px]">
          {/* Health */}
          <div className="flex items-center gap-2 mb-2">
            <Heart size={16} className="text-red-400" />
            <div className="w-48 h-5 bg-obsidian-700/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${healthPercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-sm font-bold text-text-primary">
              {Math.round(player.health)} / {player.maxHealth}
            </span>
          </div>

          {/* XP */}
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-purple-neon" />
            <div className="w-48 h-4 bg-obsidian-700/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-neon to-gold rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${xpPercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-sm font-bold text-text-primary">
              {matchState.playerLevel} / {matchState.playerXP}
            </span>
          </div>
        </div>
      </div>

      {/* Game Stats */}
      <div className="absolute bottom-4 right-4 pointer-events-auto">
        <div className="glass-purple rounded-xl p-3 min-w-[150px]">
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              <Gem size={14} className="text-purple-neon" />
              <span className="font-bold">{matchState.playerGold}</span>
            </div>
            <div className="flex items-center gap-1">
              <Skull size={14} className="text-red-400" />
              <span className="font-bold">{matchState.playerKills}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart size={14} className="text-blue-400" />
              <span className="font-bold text-red-400">{matchState.playerDeaths}</span>
            </div>
          </div>
          <div className="mt-1 text-xs text-text-tertiary">
            <Clock size={12} className="inline mr-1" />
            {formatTime(matchState.gameTime)}
          </div>
        </div>
      </div>

      {/* Ability Bar (PC only) */}
      {isPC && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto">
          <div className="flex gap-2 glass-purple rounded-xl p-2">
            {(['Q', 'W', 'E', 'R'] as const).map((key) => {
              const cooldown = cooldowns[key];
              const maxCd = maxCooldowns[key];
              const isOnCooldown = cooldown > 0;
              const cdPercent = maxCd > 0 ? (cooldown / maxCd) * 100 : 0;

              return (
                <motion.button
                  key={key}
                  type="button"
                  onClick={() => onAbilityPress(key)}
                  disabled={isOnCooldown}
                  className={`
                    relative w-14 h-14 rounded-lg font-bold text-sm
                    bg-obsidian-800/70 border-2
                    ${
                      isOnCooldown
                        ? 'border-gray-600 text-gray-500 cursor-not-allowed'
                        : 'border-purple-neon/50 text-white hover:border-gold hover:shadow-[0_0_12px_theme(colors.purple.neon)]'
                    }
                  `}
                  whileTap={{ scale: isOnCooldown ? 1 : 0.9 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <div className="absolute top-1 left-1 text-xs font-bold text-gold">{key}</div>
                  <div className="absolute inset-0 flex items-center justify-center text-xs mt-4">
                    {abilityNames[key]}
                  </div>
                  {isOnCooldown && (
                    <>
                      <div
                        className="absolute inset-0 bg-black/70 rounded-lg"
                        style={{
                          clipPath: `polygon(0 0, 100% 0, 100% ${cdPercent}%, 0 ${cdPercent}%)`,
                        }}
                      />
                      <div className="absolute bottom-1 right-1 text-xs text-gray-400">
                        {Math.ceil(cooldown)}s
                      </div>
                    </>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Match Status */}
      {matchState.matchResult && (
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="glass-purple rounded-2xl p-8 text-center min-w-[300px]">
            <h2
              className={`text-4xl font-bold mb-4 ${
                matchState.matchResult === 'player_victory'
                  ? 'text-gradient-gold'
                  : 'text-gradient-purple'
              }`}
            >
              {matchState.matchResult === 'player_victory' ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ!'}
            </h2>
            <p className="text-text-secondary mb-4">
              {matchState.matchResult === 'player_victory'
                ? 'Ты победил!'
                : 'К сожалению, ты проиграл.'}
            </p>
            <div className="flex justify-center gap-4 text-sm text-text-secondary">
              <span>Убийств: {matchState.playerKills}</span>
              <span>Смертей: {matchState.playerDeaths}</span>
              <span>Золото: {matchState.playerGold}</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
