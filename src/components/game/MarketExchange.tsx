// ============================================
// Obsidian Arena — Market Exchange Component
// ============================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import type { ExchangeRate } from '../../types';
import { TOKENS } from '../../config/constants';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export interface MarketExchangeProps {
  obsidianBalance: number;
  gramBalance: number;
  exchangeRate: ExchangeRate | null;
  onBuyObsidian: (gramAmount: number) => Promise<void>;
  onSellObsidian: (obsidianAmount: number) => Promise<void>;
  isLoading?: boolean;
}

export const MarketExchange: React.FC<MarketExchangeProps> = ({
  obsidianBalance,
  gramBalance,
  exchangeRate,
  onBuyObsidian,
  onSellObsidian,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const handleExchange = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    if (activeTab === 'buy') {
      await onBuyObsidian(numAmount);
    } else {
      await onSellObsidian(numAmount);
    }
    setAmount('');
  };

  const getConvertedAmount = (): number => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return 0;
    if (!exchangeRate) return 0;
    return activeTab === 'buy'
      ? numAmount * exchangeRate.rate
      : numAmount / exchangeRate.rate;
  };

  return (
    <div className="space-y-4">
      {/* Exchange Rate Display */}
      <Card variant="glass-purple" padding="md">
        <div className="flex items-center justify-center space-x-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1">
              <span className="text-2xl">{TOKENS.GRAM.icon}</span>
              <span className="font-bold text-gold">1 GRAM</span>
            </div>
            <p className="text-xs text-text-secondary mt-1">=</p>
          </div>

          <motion.div
            animate={{ rotate: isLoading ? 360 : 0 }}
            transition={{ duration: 1, repeat: isLoading ? Infinity : 0 }}
          >
            <RefreshCw size={20} className="text-purple-neon" />
          </motion.div>

          <div className="text-center">
            <div className="flex items-center justify-center space-x-1">
              <span className="text-2xl">{TOKENS.OBSIDIAN.icon}</span>
              <span className="font-bold text-purple-neon">
                {exchangeRate ? exchangeRate.rate.toFixed(4) : '—'} OBS
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              {exchangeRate
                ? `Обновлено: ${new Date(exchangeRate.timestamp).toLocaleTimeString()}`
                : 'Загрузка...'}
            </p>
          </div>
        </div>
      </Card>

      {/* Buy/Sell Tabs */}
      <div className="flex gap-2">
        <motion.button
          type="button"
          onClick={() => setActiveTab('buy')}
          className={`
            flex-1 py-2.5 rounded-xl font-medium transition-all
            ${
              activeTab === 'buy'
                ? 'bg-gradient-to-r from-green-600 to-green-700 text-white border border-green-600/50'
                : 'bg-obsidian-800/50 text-text-secondary hover:text-text-primary border border-glass-border'
            }
          `}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center justify-center space-x-1">
            <TrendingUp size={16} />
            <span>Купить OBS за GRAM</span>
          </div>
        </motion.button>
        <motion.button
          type="button"
          onClick={() => setActiveTab('sell')}
          className={`
            flex-1 py-2.5 rounded-xl font-medium transition-all
            ${
              activeTab === 'sell'
                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white border border-red-600/50'
                : 'bg-obsidian-800/50 text-text-secondary hover:text-text-primary border border-glass-border'
            }
          `}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center justify-center space-x-1">
            <TrendingDown size={16} />
            <span>Продать OBS за GRAM</span>
          </div>
        </motion.button>
      </div>

      {/* Exchange Form */}
      <Card variant="glass-purple" padding="lg">
        <div className="space-y-4">
          {/* Input Amount */}
          <div>
            <label className="block text-sm text-text-secondary mb-2">
              {activeTab === 'buy' ? 'GRAM' : 'OBS'}
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full px-4 py-3 bg-obsidian-800/50 border border-glass-border rounded-xl text-text-primary placeholder-text-tertiary focus:outline-none focus:border-purple-neon/50 transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary">
                {activeTab === 'buy' ? TOKENS.GRAM.symbol : TOKENS.OBSIDIAN.symbol}
              </span>
            </div>
          </div>

          {/* Converted Amount */}
          <div className="text-center py-3 bg-obsidian-800/30 rounded-xl">
            <p className="text-xs text-text-secondary mb-1">Вы получите</p>
            <p className="text-2xl font-bold text-gradient-purple">
              {getConvertedAmount().toFixed(4)}{' '}
              {activeTab === 'buy' ? TOKENS.OBSIDIAN.symbol : TOKENS.GRAM.symbol}
            </p>
          </div>

          {/* Balances */}
          <div className="flex justify-between text-sm">
            <div className="text-center">
              <p className="text-text-tertiary">Ваш баланс</p>
              <p className="font-bold text-text-primary">
                {activeTab === 'buy'
                  ? `${gramBalance.toFixed(4)} GRAM`
                  : `${obsidianBalance.toFixed(4)} OBS`}
              </p>
            </div>
            <div className="text-center">
              <p className="text-text-tertiary">После обмена</p>
              <p className="font-bold text-text-primary">
                {activeTab === 'buy'
                  ? `${(gramBalance - parseFloat(amount || '0')).toFixed(4)} GRAM`
                  : `${(obsidianBalance - parseFloat(amount || '0')).toFixed(4)} OBS`}
              </p>
            </div>
          </div>

          {/* Exchange Button */}
          <Button
            variant={activeTab === 'buy' ? 'success' : 'danger'}
            size="lg"
            fullWidth
            icon={<ArrowLeftRight size={18} />}
            onClick={handleExchange}
            loading={isLoading}
            disabled={
              isLoading ||
              !amount ||
              parseFloat(amount) <= 0 ||
              (activeTab === 'buy' &&
                parseFloat(amount || '0') > gramBalance) ||
              (activeTab === 'sell' &&
                parseFloat(amount || '0') > obsidianBalance)
            }
          >
            {activeTab === 'buy' ? 'Купить Obsidian' : 'Продать Obsidian'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
