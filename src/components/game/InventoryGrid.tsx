// ============================================
// Obsidian Arena — Inventory Grid Component
// ============================================

import { motion, AnimatePresence } from 'framer-motion';
import { Gem, Trash2, Package } from 'lucide-react';
import type { Item } from '../../types';
import { RARITY_CONFIG } from '../../config/constants';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export interface InventoryGridProps {
  items: Item[];
  onItemClick?: (item: Item) => void;
  onEquipItem?: (itemId: string) => void;
  onSellItem?: (itemId: string) => void;
  filter?: string;
  onFilterChange?: (filter: string) => void;
}

const filterOptions = [
  { value: 'all', label: 'Все' },
  { value: 'equipped', label: 'Экипировано' },
  { value: 'nft', label: 'NFT' },
  { value: 'common', label: 'Обычные' },
  { value: 'rare', label: 'Редкие' },
  { value: 'epic', label: 'Эпические' },
  { value: 'legendary', label: 'Легендарные' },
  { value: 'mythic', label: 'Мифические' },
];

export const InventoryGrid: React.FC<InventoryGridProps> = ({
  items,
  onItemClick,
  onEquipItem,
  onSellItem,
  filter = 'all',
  onFilterChange,
}) => {
  const formatStats = (item: Item): string => {
    const stats = item.stats;
    const parts: string[] = [];
    if (stats.attack) parts.push(`Атк +${stats.attack}`);
    if (stats.defense) parts.push(`Защ +${stats.defense}`);
    if (stats.speed) parts.push(`Скор +${stats.speed}`);
    if (stats.health) parts.push(`HP +${stats.health}`);
    if (stats.critChance) parts.push(`Крит +${stats.critChance}%`);
    if (stats.critDamage) parts.push(`Урон +${stats.critDamage}%`);
    return parts.join(', ');
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      {onFilterChange && (
        <motion.div
          className="flex flex-wrap gap-2 p-3 glass-purple rounded-xl"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {filterOptions.map((opt) => {
            const isActive = filter === opt.value;
            return (
              <motion.button
                key={opt.value}
                type="button"
                onClick={() => onFilterChange(opt.value)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${
                    isActive
                      ? 'bg-purple-neon/20 text-purple-neon border border-purple-neon/50'
                      : 'text-text-secondary hover:text-text-primary hover:bg-obsidian-800/50'
                  }
                `}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {opt.label}
              </motion.button>
            );
          })}
        </motion.div>
      )}

      {/* Items Grid */}
      {items.length === 0 ? (
        <div className="text-center py-12 glass-purple rounded-xl">
          <Package size={48} className="mx-auto text-text-tertiary mb-3" />
          <p className="text-text-secondary">Инвентарь пуст</p>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <AnimatePresence>
            {items.map((item, index) => {
              const rarityConfig = RARITY_CONFIG[item.rarity];

              return (
                <motion.div
                  key={item.id}
                  layoutId={item.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    variant={
                      item.isEquipped ? 'glass-gold' : 'glass-purple'
                    }
                    padding="sm"
                    hoverable
                    onClick={() => onItemClick?.(item)}
                    className="relative group"
                  >
                    {/* NFT badge */}
                    {item.isNFT && (
                      <motion.div
                        className="absolute top-1 right-1 z-10 bg-gold rounded-full p-1"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        <Gem size={10} className="text-obsidian-950" />
                      </motion.div>
                    )}

                    {/* Item icon */}
                    <div className="flex justify-center mb-2">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-14 h-14 object-cover rounded-lg border-2"
                        style={{ borderColor: rarityConfig.color }}
                      />
                    </div>

                    {/* Item info */}
                    <h4
                      className="font-bold text-sm text-center mb-1"
                      style={{ color: rarityConfig.color }}
                    >
                      {item.name}
                    </h4>

                    <div
                      className="text-xs px-1.5 py-0.5 rounded-full text-center mb-2"
                      style={{
                        backgroundColor: rarityConfig.bgColor,
                        color: rarityConfig.color,
                      }}
                    >
                      {rarityConfig.label}
                    </div>

                    {/* Stats */}
                    {formatStats(item) && (
                      <p className="text-xs text-text-secondary text-center mb-2">
                        {formatStats(item)}
                      </p>
                    )}

                    {/* Quantity */}
                    {item.quantity > 1 && (
                      <div className="text-center text-xs text-text-tertiary mb-2">
                        x{item.quantity}
                      </div>
                    )}

                    {/* Equipped badge */}
                    {item.isEquipped && (
                      <div className="text-center text-xs text-gold mb-2">
                        Экипировано
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onEquipItem && (
                        <Button
                          size="sm"
                          variant={item.isEquipped ? 'secondary' : 'success'}
                          onClick={(e) => {
                            e?.stopPropagation();
                            onEquipItem(item.id);
                          }}
                          animate={false}
                          className="flex-1 text-xs"
                        >
                          {item.isEquipped ? 'Снять' : 'Экипировать'}
                        </Button>
                      )}
                      {onSellItem && (
                        <Button
                          size="sm"
                          variant="danger"
                          icon={<Trash2 size={12} />}
                          onClick={(e) => {
                            e?.stopPropagation();
                            onSellItem(item.id);
                          }}
                          animate={false}
                          className="flex-1 text-xs"
                        >
                          Продать
                        </Button>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};
