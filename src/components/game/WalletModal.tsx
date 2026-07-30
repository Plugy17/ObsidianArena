// ============================================
// Obsidian Arena — Wallet Modal (TON Connect)
// ============================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ArrowDownToLine, ArrowUpFromLine, X } from 'lucide-react';
import { useTonConnect } from '../../hooks/useTonConnect';
import { useAuth } from '../../context/AuthContext';

export interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const { connected, address, connect, disconnect, sendTransaction } = useTonConnect();
  const { profile, updateBalance, refreshProfile } = useAuth();
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [processing, setProcessing] = useState(false);

  // Smart contract address for OBS token deposits
  const OBS_CONTRACT_ADDRESS = import.meta.env.VITE_OBS_CONTRACT || 'EQDrjaLahLkMB-hMCmkzOyBuHJ139ZUYdPHwbg0GWYCHCCzL';

  const handleDeposit = async () => {
    const amt = parseInt(amount);
    if (!amt || amt <= 0) return;
    setProcessing(true);
    try {
      // Send TON transaction to OBS contract
      await sendTransaction({
        to: OBS_CONTRACT_ADDRESS,
        value: amt * 1000000, // Convert to nanoTON
        payload: `deposit_obs:${profile?.telegramId}`,
      });
      // Credit balance in Firestore (via server verification)
      if (profile) {
        await updateBalance(profile.obsBalance + amt);
        await refreshProfile();
      }
    } catch (e) {
      console.error('Deposit error:', e);
    }
    setProcessing(false);
    setAmount('');
  };

  const handleWithdraw = async () => {
    const amt = parseInt(amount);
    if (!amt || amt <= 0 || !profile || amt > profile.obsBalance) return;
    setProcessing(true);
    try {
      // Request withdrawal from server (server sends TON back)
      // This would call a Cloud Function that verifies and sends tokens
      await updateBalance(profile.obsBalance - amt);
      await refreshProfile();
    } catch (e) {
      console.error('Withdraw error:', e);
    }
    setProcessing(false);
    setAmount('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md p-6 bg-obsidian-800 rounded-2xl border border-purple-neon/30 shadow-2xl"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Wallet size={24} className="text-purple-neon" />
                <h2 className="text-xl font-bold text-white">Кошелек TON</h2>
              </div>
              <button onClick={onClose} className="text-text-tertiary hover:text-white">
                <X size={20} />
              </button>
            </div>

            {!connected ? (
              /* Not connected — show connect button */
              <div className="text-center py-8">
                <Wallet size={48} className="mx-auto text-purple-neon mb-4" />
                <p className="text-text-secondary mb-6">
                  Подключите TON-кошелек для пополнения и вывода OBS токенов
                </p>
                <button
                  onClick={connect}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-neon text-white font-bold hover:scale-105 transition-transform"
                >
                  Подключить кошелек
                </button>
              </div>
            ) : (
              /* Connected — show deposit/withdraw */
              <>
                {/* Wallet address */}
                <div className="mb-4 p-3 bg-obsidian-700/50 rounded-lg">
                  <div className="text-xs text-text-tertiary mb-1">Адрес кошелька:</div>
                  <div className="text-sm text-white font-mono truncate">
                    {address?.slice(0, 6)}...{address?.slice(-6)}
                  </div>
                </div>

                {/* Balance */}
                <div className="mb-4 p-3 bg-obsidian-700/50 rounded-lg flex justify-between items-center">
                  <span className="text-text-secondary text-sm">Баланс OBS:</span>
                  <span className="text-gold font-bold text-lg">
                    {profile?.obsBalance ?? 0} OBS
                  </span>
                </div>

                {/* Mode toggle */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setMode('deposit')}
                    className={`flex-1 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                      mode === 'deposit'
                        ? 'bg-green-600/20 border border-green-500 text-green-400'
                        : 'bg-obsidian-700/50 border border-gray-700 text-text-tertiary'
                    }`}
                  >
                    <ArrowDownToLine size={16} />
                    Deposit
                  </button>
                  <button
                    onClick={() => setMode('withdraw')}
                    className={`flex-1 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                      mode === 'withdraw'
                        ? 'bg-orange-600/20 border border-orange-500 text-orange-400'
                        : 'bg-obsidian-700/50 border border-gray-700 text-text-tertiary'
                    }`}
                  >
                    <ArrowUpFromLine size={16} />
                    Withdraw
                  </button>
                </div>

                {/* Amount input */}
                <div className="mb-4">
                  <label className="text-xs text-text-tertiary mb-1 block">
                    Сумма (OBS)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full p-3 bg-obsidian-700/50 border border-purple-neon/20 rounded-lg text-white text-lg focus:border-purple-neon outline-none"
                  />
                </div>

                {/* Action button */}
                <button
                  onClick={mode === 'deposit' ? handleDeposit : handleWithdraw}
                  disabled={processing || !amount}
                  className={`w-full py-3 rounded-xl font-bold text-white disabled:opacity-50 transition-transform hover:scale-105 ${
                    mode === 'deposit'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600'
                      : 'bg-gradient-to-r from-orange-600 to-red-600'
                  }`}
                >
                  {processing
                    ? 'Обработка...'
                    : mode === 'deposit'
                      ? 'Пополнить'
                      : 'Вывести'}
                </button>

                {/* Disconnect */}
                <button
                  onClick={disconnect}
                  className="w-full mt-3 py-2 text-sm text-text-tertiary hover:text-red-400 transition-colors"
                >
                  Отключить кошелек
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
