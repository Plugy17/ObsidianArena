// ============================================
// Obsidian Arena — Arena Page (Lobby → Game)
// ============================================

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArenaCanvas } from '../components/game/ArenaCanvas';
import { ArenaLobby } from './ArenaLobby';
import type { Character } from '../config/characters';

type GameMode = 'pve' | 'pvp' | null;
type Phase = 'lobby' | 'game' | 'result';

export const Arena: React.FC = () => {
  const [phase, setPhase] = useState<Phase>('lobby');
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>(null);
  const [matchResult, setMatchResult] = useState<{ won: boolean; kills: number; deaths: number; duration: number } | null>(null);

  const handleStartGame = useCallback((character: Character, mode: GameMode) => {
    setSelectedChar(character);
    setGameMode(mode);
    setPhase('game');
  }, []);

  const handleMatchEnd = useCallback((result: { won: boolean; kills: number; deaths: number; duration: number }) => {
    setMatchResult(result);
    setPhase('result');
  }, []);

  const handleBackToLobby = useCallback(() => {
    setPhase('lobby');
    setSelectedChar(null);
    setGameMode(null);
    setMatchResult(null);
  }, []);

  return (
    <AnimatePresence mode="wait">
      {phase === 'lobby' && (
        <motion.div
          key="lobby"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <ArenaLobby onStartGame={handleStartGame} />
        </motion.div>
      )}

      {phase === 'game' && (
        <motion.div
          key="game"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="w-full h-full relative"
          style={{ minHeight: 'calc(100vh - 140px)' }}
        >
          <ArenaCanvas
            character={selectedChar!}
            gameMode={gameMode!}
            onMatchEnd={handleMatchEnd}
            onBackToLobby={handleBackToLobby}
          />
        </motion.div>
      )}

      {phase === 'result' && matchResult && (
        <motion.div
          key="result"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center justify-center min-h-[calc(100vh-140px)] bg-gradient-to-b from-obsidian-900 via-obsidian-800 to-obsidian-900"
        >
          <div className="text-center bg-obsidian-800/80 rounded-2xl border border-white/10 p-8 max-w-md">
            <div className="text-6xl mb-4">{matchResult.won ? '🏆' : '💀'}</div>
            <h2 className={`text-3xl font-bold mb-2 ${matchResult.won ? 'text-gold' : 'text-red-500'}`}>
              {matchResult.won ? 'VICTORY!' : 'DEFEAT'}
            </h2>
            <div className="flex justify-center gap-6 mb-6 text-sm">
              <span className="text-green-400">⚔️ Kills: {matchResult.kills}</span>
              <span className="text-red-400">💀 Deaths: {matchResult.deaths}</span>
              <span className="text-text-secondary">⏱ {Math.round(matchResult.duration)}s</span>
            </div>
            <button
              onClick={handleBackToLobby}
              className="px-8 py-3 bg-gradient-to-r from-purple-neon to-purple-700 rounded-xl font-bold text-white shadow-lg hover:shadow-purple-neon/30 transition-all"
            >
              BACK TO LOBBY
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};