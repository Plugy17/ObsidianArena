// ============================================
// Obsidian Arena — Arena Lobby (Character Select)
// ============================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { characters } from '../config/characters';
import type { Character } from '../config/characters';

type GameMode = 'pve' | 'pvp' | null;

interface ArenaLobbyProps {
  onStartGame: (character: Character, mode: GameMode) => void;
}

const roleColors: Record<string, string> = {
  Tank: '#4a90d9',
  Fighter: '#ff6b35',
  Assassin: '#d94a4a',
  Mage: '#9b59b6',
  Marksman: '#2ecc71',
  Support: '#f1c40f',
};

const rarityColors: Record<string, string> = {
  Common: '#95a5a6',
  Rare: '#3498db',
  Epic: '#9b59b6',
  Legendary: '#f39c12',
};

const roleEmojis: Record<string, string> = {
  Tank: '🛡️',
  Fighter: '⚔️',
  Assassin: '🗡️',
  Mage: '🔮',
  Marksman: '🏹',
  Support: '💖',
};

const charEmojis: Record<string, string> = {
  knight: '🛡️',
  zara: '🗡️',
  broneboi: '🔨',
  luna: '🌙',
  pyromancer: '🔥',
  hunter: '🏹',
  potroshitel: '🩸',
  'storm-caller': '⚡',
  berserker: '💢',
  'frost-weaver': '❄️',
  lightbringer: '✨',
  'void-reaper': '🌑',
  'thunder-guard': '⛈️',
};

export const ArenaLobby: React.FC<ArenaLobbyProps> = ({ onStartGame }) => {
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>(null);

  const handleStart = () => {
    if (selectedChar && gameMode) {
      onStartGame(selectedChar, gameMode);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] bg-gradient-to-b from-obsidian-900 via-obsidian-800 to-obsidian-900 p-4 md:p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-neon to-gold bg-clip-text text-transparent">
          ⚔️ ARENA LOBBY ⚔️
        </h1>
        <p className="text-text-secondary mt-1 text-sm">Choose your champion and prepare for battle</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto">
        {/* Left: Character Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {characters.map((char) => {
              const isSelected = selectedChar?.id === char.id;
              return (
                <motion.button
                  key={char.id}
                  layout
                  onClick={() => { setSelectedChar(char); setGameMode(null); }}
                  className={`relative rounded-xl p-3 border-2 transition-all text-left ${
                    isSelected
                      ? 'border-purple-neon bg-purple-neon/15 shadow-lg shadow-purple-neon/20'
                      : 'border-white/10 bg-obsidian-800/50 hover:border-white/30 hover:bg-obsidian-700/50'
                  }`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {/* Rarity badge */}
                  <div
                    className="absolute top-1 right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: rarityColors[char.rarity] + '33', color: rarityColors[char.rarity] }}
                  >
                    {char.rarity}
                  </div>

                  {/* Emoji avatar */}
                  <div className="text-4xl text-center mb-2">
                    {charEmojis[char.id] || '🧙'}
                  </div>

                  {/* Name */}
                  <div className="text-white text-xs font-bold truncate mb-1">
                    {char.name}
                  </div>

                  {/* Role badge */}
                  <div className="flex items-center gap-1">
                    <span className="text-xs">{roleEmojis[char.role]}</span>
                    <span className="text-[10px]" style={{ color: roleColors[char.role] }}>
                      {char.role}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Character Preview */}
        <div className="lg:w-80 xl:w-96">
          <AnimatePresence mode="wait">
            {selectedChar ? (
              <motion.div
                key={selectedChar.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-obsidian-800/80 rounded-2xl border border-white/10 p-5"
              >
                {/* Character preview */}
                <div className="text-center mb-4">
                  <div className="text-6xl mb-2">{charEmojis[selectedChar.id] || '🧙'}</div>
                  <h2 className="text-xl font-bold text-white">{selectedChar.name}</h2>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="text-xs" style={{ color: roleColors[selectedChar.role] }}>
                      {roleEmojis[selectedChar.role]} {selectedChar.role}
                    </span>
                    <span className="text-xs" style={{ color: rarityColors[selectedChar.rarity] }}>
                      {selectedChar.rarity}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    { label: '❤️ HP', value: selectedChar.stats.hp, color: '#4caf50' },
                    { label: '⚔️ ATK', value: selectedChar.stats.atk, color: '#ff5252' },
                    { label: '🛡️ DEF', value: selectedChar.stats.def, color: '#4a90d9' },
                    { label: '💨 SPD', value: selectedChar.stats.spd, color: '#00e5ff' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-obsidian-900/60 rounded-lg p-2">
                      <div className="text-xs text-text-secondary">{stat.label}</div>
                      <div className="text-lg font-bold" style={{ color: stat.color }}>{stat.value}</div>
                    </div>
                  ))}
                </div>

                {/* Abilities */}
                <div className="mb-4">
                  <h3 className="text-xs font-bold text-text-secondary uppercase mb-2">Abilities</h3>
                  {selectedChar.abilities.map((ability) => (
                    <div key={ability.key} className="flex items-center gap-2 mb-1.5 bg-obsidian-900/40 rounded-lg p-1.5">
                      <span className="w-5 h-5 rounded bg-purple-neon/30 text-purple-neon text-xs font-bold flex items-center justify-center">
                        {ability.key}
                      </span>
                      <div className="flex-1">
                        <div className="text-white text-xs font-bold">{ability.name}</div>
                        <div className="text-text-secondary text-[10px]">{ability.description}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Game Mode Select */}
                <div className="mb-4">
                  <h3 className="text-xs font-bold text-text-secondary uppercase mb-2">Game Mode</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setGameMode('pve')}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all border-2 ${
                        gameMode === 'pve'
                          ? 'border-green-500 bg-green-500/20 text-green-400'
                          : 'border-white/10 bg-obsidian-900/60 text-text-secondary hover:border-white/30'
                      }`}
                    >
                      🤖 PvE
                    </button>
                    <button
                      onClick={() => setGameMode('pvp')}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all border-2 ${
                        gameMode === 'pvp'
                          ? 'border-red-500 bg-red-500/20 text-red-400'
                          : 'border-white/10 bg-obsidian-900/60 text-text-secondary hover:border-white/30'
                      }`}
                    >
                      👥 PvP
                    </button>
                  </div>
                </div>

                {/* Start Battle */}
                <button
                  onClick={handleStart}
                  disabled={!gameMode}
                  className={`w-full py-3 rounded-xl font-bold text-lg transition-all ${
                    gameMode
                      ? 'bg-gradient-to-r from-purple-neon to-purple-700 text-white shadow-lg shadow-purple-neon/30 hover:shadow-purple-neon/50'
                      : 'bg-obsidian-700 text-text-secondary cursor-not-allowed'
                  }`}
                >
                  {gameMode === 'pve' ? '⚔️ START PvE BATTLE' : gameMode === 'pvp' ? '⚔️ FIND PvP MATCH' : 'SELECT MODE'}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="no-selection"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-obsidian-800/50 rounded-2xl border border-white/5 p-8 text-center"
              >
                <div className="text-6xl mb-4 opacity-30">⚔️</div>
                <p className="text-text-secondary">Select a champion to view details</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};