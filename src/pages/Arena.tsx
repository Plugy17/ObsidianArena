// ============================================
// Obsidian Arena — Arena Page (Wild Rift Phaser)
// ============================================

import { ArenaCanvas } from '../components/game/ArenaCanvas';

export const Arena: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 bg-obsidian-900">
      <ArenaCanvas />
    </div>
  );
};
