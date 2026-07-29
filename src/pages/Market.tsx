// ============================================
// Obsidian Arena — Market Page
// ============================================

import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { MarketExchange } from '../components/game/MarketExchange';
import { Card } from '../components/ui/Card';
import { useState, useEffect } from 'react';
import type { ExchangeRate } from '../types';

export const Market: React.FC = () => {
  const { user, updateBalance } = useUser();
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch exchange rate on mount
  useEffect(() => {
    const fetchRate = async () => {
      setIsLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setExchangeRate({
        from: 'gram',
        to: 'obsidian',
        rate: 1.0 + Math.random() * 0.5,
        timestamp: new Date().toISOString(),
      });
      setIsLoading(false);
    };
    fetchRate();
  }, []);

  const handleBuyObsidian = async (gramAmount: number) => {
    if (!user || !exchangeRate) return;
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const obsidianReceived = gramAmount * exchangeRate.rate;
    updateBalance(obsidianReceived, 'obsidian');
    updateBalance(-gramAmount, 'gram');
    setIsLoading(false);
  };

  const handleSellObsidian = async (obsidianAmount: number) => {
    if (!user || !exchangeRate) return;
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const gramReceived = obsidianAmount / exchangeRate.rate;
    updateBalance(-obsidianAmount, 'obsidian');
    updateBalance(gramReceived, 'gram');
    setIsLoading(false);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-neon" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gradient-purple mb-2 flex items-center">
          <ShoppingCart size={28} className="mr-2 text-gold" />
          Торговая Площадка
        </h1>
        <p className="text-text-secondary">
          Обменивайте Obsidian (OBS) и GRAM в реальном времени.
        </p>
      </motion.div>

      {/* Market Exchange */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <MarketExchange
          obsidianBalance={user.obsidianBalance}
          gramBalance={user.gramBalance || 0}
          exchangeRate={exchangeRate}
          onBuyObsidian={handleBuyObsidian}
          onSellObsidian={handleSellObsidian}
          isLoading={isLoading}
        />
      </motion.div>

      {/* Market Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card variant="glass-purple" padding="md">
          <h3 className="text-lg font-bold text-text-primary mb-3">
            Информация о рынке
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">
                Текущий курс обмена
              </span>
              <span className="text-text-primary font-bold">
                {exchangeRate
                  ? `1 GRAM = ${exchangeRate.rate.toFixed(4)} OBS`
                  : 'Загрузка...'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Комиссия</span>
              <span className="text-text-primary">0.5%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Минимальная сумма</span>
              <span className="text-text-primary">0.01 GRAM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Время обновления</span>
              <span className="text-text-primary">Каждые 60 секунд</span>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
