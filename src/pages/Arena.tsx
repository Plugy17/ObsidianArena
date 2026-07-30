// ============================================
// Obsidian Arena — Arena Page (Wild Rift Phaser)
// ============================================

import { ArenaCanvas } from '../components/game/ArenaCanvas';

export const Arena: React.FC = () => {
  return (
    <div className="w-full h-full relative" style={{ minHeight: 'calc(100vh - 140px)' }}>
      <ArenaCanvas />
    </div>
  );
};
