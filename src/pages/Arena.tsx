// ============================================
// Obsidian Arena — Arena Page
// ============================================

import { motion } from 'framer-motion';
import {
  Sword,
  Skull,
  Trophy,
  Flame,
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { CharacterCard } from '../components/game/CharacterCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useState } from 'react';

export const Arena: React.FC = () => {
  const { selectedCharacter, gameState, setGameState, characters } = useUser();
  const [matchmakingProgress, setMatchmakingProgress] = useState(0);

  const handleEnterBattle = () => {
    if (!selectedCharacter) return;

    setGameState('loading');
    setMatchmakingProgress(0);

    // Simulate matchmaking
    const interval = setInterval(() => {
      setMatchmakingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setGameState('in_match');
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 300);

    // Auto-complete matchmaking after 3 seconds
    setTimeout(() => {
      clearInterval(interval);
      setMatchmakingProgress(100);
      setGameState('in_match');
    }, 3000);
  };

  const handleCancelMatchmaking = () => {
    setGameState('idle');
    setMatchmakingProgress(0);
  };

  const isLoading = gameState === 'loading' || gameState === 'in_match';

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Arena Header */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gradient-purple mb-2 flex items-center justify-center">
          <Flame size={28} className="mr-2 text-gold animate-pulse" />
          Огненная Арена
        </h1>
        <p className="text-text-secondary">
          Сражайтесь с сильнейшими бойцами и завоёвывайте славу!
        </p>
      </motion.div>

      {/* Matchmaking Status */}
      {gameState === 'loading' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
        >
          <Card variant="glass-gold" padding="lg" className="text-center">
            <motion.div
              className="mb-4"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Skull size={48} className="mx-auto text-gold" />
            </motion.div>
            <h3 className="text-xl font-bold text-gold mb-2">
              Поиск противников...
            </h3>
            <div className="w-full bg-obsidian-700/50 rounded-full h-3 mb-2">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-neon to-gold rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${matchmakingProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-sm text-text-secondary">
              {Math.round(matchmakingProgress)}%
            </p>
            <Button
              variant="danger"
              size="sm"
              className="mt-4"
              onClick={handleCancelMatchmaking}
            >
              Отменить
            </Button>
          </Card>
        </motion.div>
      )}

      {/* In Match Status */}
      {gameState === 'in_match' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card variant="glass-purple" padding="lg" className="text-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Sword size={48} className="mx-auto text-purple-neon mb-4" />
            </motion.div>
            <h3 className="text-xl font-bold text-gradient-purple mb-2">
              Бой начался!
            </h3>
            <p className="text-text-secondary mb-4">
              Используйте способности и победите всех противников!
            </p>
            <Button
              variant="secondary"
              onClick={() => setGameState('idle')}
            >
              Вернуться в лобби
            </Button>
          </Card>
        </motion.div>
      )}

      {/* Idle State - Arena Info */}
      {gameState === 'idle' && (
        <>
          {/* Selected Character */}
          {selectedCharacter && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-xl font-bold text-text-primary mb-3">
                Твой боец
              </h2>
              <div className="max-w-xs mx-auto">
                <CharacterCard
                  character={selectedCharacter}
                  isSelected={true}
                  showStats={true}
                  size="lg"
                />
              </div>
            </motion.div>
          )}

          {/* Arena Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card variant="glass-purple" padding="md">
              <h3 className="text-lg font-bold text-text-primary mb-3 flex items-center">
                <Trophy size={18} className="mr-2 text-gold" />
                Статистика арены
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-purple-neon">12</p>
                  <p className="text-xs text-text-secondary">Побед</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gold">8</p>
                  <p className="text-xs text-text-secondary">Побед подряд</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-400">5</p>
                  <p className="text-xs text-text-secondary">Поражений</p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Enter Battle Button */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 10px rgba(138,43,226,0.3)',
                  '0 0 20px rgba(218,165,32,0.5)',
                  '0 0 10px rgba(138,43,226,0.3)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-block"
            >
              <Button
                variant="gold"
                size="xl"
                icon={<Sword size={24} />}
                onClick={handleEnterBattle}
                disabled={isLoading || !selectedCharacter}
                animate={false}
                className="px-8 py-4 text-2xl font-bold"
              >
                В БОЙ!
              </Button>
            </motion.div>

            {!selectedCharacter && (
              <motion.p
                className="text-red-400 mt-2 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Выберите персонажа на доске!
              </motion.p>
            )}
          </motion.div>

          {/* Available Characters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h3 className="text-lg font-bold text-text-primary mb-3">
              Доступные персонажи
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {characters
                .filter((c) => !c.isSelected)
                .map((character) => (
                  <CharacterCard
                    key={character.id}
                    character={character}
                    isSelected={false}
                    onSelect={() => {}}
                    showStats={true}
                    size="sm"
                  />
                ))}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};
