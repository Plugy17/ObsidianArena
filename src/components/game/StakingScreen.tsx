// ============================================
// Obsidian Arena — Staking Screen (OBS Tokens)
// ============================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const STAKE_OPTIONS = [10, 50, 100];

export interface StakingScreenProps {
  onStake: (amount: number) => void;
  onBack: () => void;
}

export const StakingScreen: React.FC<StakingScreenProps> = ({ onStake, onBack }) => {
  const { profile } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);

  const balance = profile?.obsBalance ?? 0;

  const handleConfirm = async () => {
    if (!selectedAmount || selectedAmount > balance) return;
    setProcessing(true);
    // Escrow: deduct stake from balance immediately
    // Server will handle actual pool distribution on match end
    onStake(selectedAmount);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-obsidian-900/95 backdrop-blur-sm"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <div className="w-full max-w-md p-6 bg-obsidian-800 rounded-2xl border border-purple-neon/30 shadow-2xl">
        <h2 className="text-2xl font-bold text-center mb-2 text-gradient-purple">
          Ставка на матч
        </h2>
        <p className="text-center text-text-secondary text-sm mb-6">
          Выберите сумму ставки в OBS токенах
        </p>

        {/* Balance display */}
        <div className="flex items-center justify-between mb-6 p-3 bg-obsidian-700/50 rounded-lg">
          <span className="text-text-secondary text-sm">Ваш баланс:</span>
          <span className="text-gold font-bold text-lg">{balance} OBS</span>
        </div>

        {/* Stake options */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {STAKE_OPTIONS.map((amount) => {
            const disabled = amount > balance;
            const selected = selectedAmount === amount;
            return (
              <button
                key={amount}
                onClick={() => !disabled && setSelectedAmount(amount)}
                disabled={disabled}
                className={`p-4 rounded-xl border-2 font-bold transition-all ${
                  selected
                    ? 'border-gold bg-gold/10 text-gold scale-105'
                    : disabled
                      ? 'border-gray-700 bg-gray-800/50 text-gray-600 cursor-not-allowed'
                      : 'border-purple-neon/30 bg-obsidian-700/50 text-white hover:border-purple-neon'
                }`}
              >
                <div className="text-2xl">{amount}</div>
                <div className="text-xs mt-1">OBS</div>
              </button>
            );
          })}
        </div>

        {/* Potential winnings */}
        {selectedAmount && (
          <motion.div
            className="mb-6 p-4 bg-gradient-to-r from-purple-neon/10 to-gold/10 rounded-lg border border-purple-neon/20"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Ваша ставка:</span>
              <span className="text-white font-bold">{selectedAmount} OBS</span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-text-secondary">При победе:</span>
              <span className="text-gold font-bold">
                +{Math.floor(selectedAmount * 2 * 0.95)} OBS
              </span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-text-tertiary">Комиссия (5%):</span>
              <span className="text-text-tertiary">
                -{Math.floor(selectedAmount * 2 * 0.05)} OBS
              </span>
            </div>
          </motion.div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 py-3 rounded-xl border border-gray-600 text-text-secondary hover:bg-obsidian-700 transition-colors"
          >
            Назад
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedAmount || processing || (selectedAmount ?? 0) > balance}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-neon to-gold text-white font-bold disabled:opacity-50 hover:scale-105 transition-transform"
          >
            {processing ? 'Поиск матча...' : 'В бой!'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
