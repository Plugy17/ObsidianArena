// ============================================
// Obsidian Arena — Match Result Screen
// ============================================

import { motion } from 'framer-motion';
import { Trophy, Skull, Coins } from 'lucide-react';

export interface MatchResult {
  won: boolean;
  stakedAmount: number;
  prize: number;
  commission: number;
  kills: number;
  deaths: number;
  duration: number;
}

export interface MatchResultScreenProps {
  result: MatchResult;
  onReturnToLobby: () => void;
}

export const MatchResultScreen: React.FC<MatchResultScreenProps> = ({
  result,
  onReturnToLobby,
}) => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-obsidian-900/95 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-md p-8 bg-obsidian-800 rounded-2xl border-2 shadow-2xl"
        style={{
          borderColor: result.won ? '#daa520' : '#ff5252',
          boxShadow: result.won
            ? '0 0 40px rgba(218,165,32,0.3)'
            : '0 0 40px rgba(255,82,82,0.3)',
        }}
        initial={{ scale: 0.5, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        {/* Result icon */}
        <motion.div
          className="text-center mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: result.won ? 360 : 0 }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          {result.won ? (
            <Trophy size={80} className="mx-auto text-gold" />
          ) : (
            <Skull size={80} className="mx-auto text-red-500" />
          )}
        </motion.div>

        {/* Result title */}
        <h2
          className="text-4xl font-bold text-center mb-2"
          style={{ color: result.won ? '#daa520' : '#ff5252' }}
        >
          {result.won ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ'}
        </h2>
        <p className="text-center text-text-secondary mb-6">
          {result.won ? 'Вы выиграли матч!' : 'В следующий раз повезёт больше'}
        </p>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3 bg-obsidian-700/50 rounded-lg text-center">
            <div className="text-text-tertiary text-xs mb-1">Убийства</div>
            <div className="text-2xl font-bold text-white">{result.kills}</div>
          </div>
          <div className="p-3 bg-obsidian-700/50 rounded-lg text-center">
            <div className="text-text-tertiary text-xs mb-1">Смерти</div>
            <div className="text-2xl font-bold text-white">{result.deaths}</div>
          </div>
          <div className="p-3 bg-obsidian-700/50 rounded-lg text-center">
            <div className="text-text-tertiary text-xs mb-1">Длительность</div>
            <div className="text-2xl font-bold text-white">
              {Math.floor(result.duration / 60)}:{String(Math.floor(result.duration % 60)).padStart(2, '0')}
            </div>
          </div>
          <div className="p-3 bg-obsidian-700/50 rounded-lg text-center">
            <div className="text-text-tertiary text-xs mb-1">Ставка</div>
            <div className="text-2xl font-bold text-white">{result.stakedAmount}</div>
          </div>
        </div>

        {/* Prize info */}
        <div
          className="p-4 rounded-lg mb-6 flex items-center gap-3"
          style={{
            background: result.won
              ? 'linear-gradient(135deg, rgba(218,165,32,0.15), rgba(138,43,226,0.15))'
              : 'rgba(255,82,82,0.1)',
          }}
        >
          <Coins size={32} className={result.won ? 'text-gold' : 'text-red-500'} />
          <div className="flex-1">
            <div className="text-sm text-text-secondary">
              {result.won ? 'Приз (за вычетом комиссии 5%)' : 'Потеряно'}
            </div>
            <div
              className="text-2xl font-bold"
              style={{ color: result.won ? '#daa520' : '#ff5252' }}
            >
              {result.won ? `+${result.prize}` : `-${result.stakedAmount}`} OBS
            </div>
          </div>
        </div>

        {/* Return button */}
        <button
          onClick={onReturnToLobby}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-neon to-gold text-white font-bold text-lg hover:scale-105 transition-transform"
        >
          Вернуться в лобби
        </button>
      </motion.div>
    </motion.div>
  );
};
