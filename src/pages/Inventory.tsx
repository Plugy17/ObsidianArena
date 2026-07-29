// ============================================
// Obsidian Arena — Inventory Page
// ============================================

import { motion } from 'framer-motion';
import { Package } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { InventoryGrid } from '../components/game/InventoryGrid';
import { Card } from '../components/ui/Card';

export const Inventory: React.FC = () => {
  const {
    inventory,
    filteredInventory,
    inventoryFilter,
    setInventoryFilter,
    equipItem,
    sellItem,
    user,
  } = useUser();

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
          <Package size={28} className="mr-2 text-gold" />
          Инвентарь
        </h1>
        <p className="text-text-secondary">
          Управляйте экипировкой и расходуемыми предметами.
        </p>
      </motion.div>

      {/* Inventory Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card variant="glass-purple" padding="md">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-text-secondary">Всего предметов</p>
              <p className="text-2xl font-bold text-text-primary">
                {inventory.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Экипировано</p>
              <p className="text-2xl font-bold text-gold">
                {inventory.filter((i) => i.isEquipped).length}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">NFT</p>
              <p className="text-2xl font-bold text-purple-neon">
                {inventory.filter((i) => i.isNFT).length}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Inventory Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <InventoryGrid
          items={filteredInventory}
          onEquipItem={equipItem}
          onSellItem={sellItem}
          filter={inventoryFilter}
          onFilterChange={setInventoryFilter}
        />
      </motion.div>
    </div>
  );
};
