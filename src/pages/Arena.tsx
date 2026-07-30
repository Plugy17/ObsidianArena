// ============================================
// Obsidian Arena — Arena Page (Wild Rift Phaser)
// ============================================

import { ArenaCanvas } from '../components/game/ArenaCanvas';

export const Arena: React.FC = () => {
  return (
    <div className="w-full h-full min-h-[calc(100vh-140px)] relative">
      <ArenaCanvas />
    </div>
  );
};
