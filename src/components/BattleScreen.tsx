// ============================================
// Obsidian Arena — Battle Screen Component
// ============================================

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Sword, Zap, Skull, Gem, Trophy, Flame } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import type { Character } from '../types';
import type { BattleLogEntry, BattleResult, Combatant } from '../logic/battleEngine';
import { generateEnemy, ARENA_CONFIG } from '../logic/battleEngine';

// --- Arena Selection Screen ---
const ArenaSelection: React.FC<{ onSelectArena: (arenaId: string) => void }> = ({
  onSelectArena,
}) => {
  const { characters, selectedCharacter, selectCharacter } = useUser();

  const availableArenas = useMemo(() => {
    return Object.keys(ARENA_CONFIG).map((id) => ({
      id,
      name: id === 'fieryArena' ? 'Огненная Арена' : id,
      description: 'Испытай свои силы в жаркой битве!',
    }));
  }, []);

  return (
    <motion.div
      className="p-4 md:p-8 space-y-6 flex flex-col items-center justify-center min-h-[calc(100vh-140px)]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-3xl md:text-4xl font-bold text-gradient-purple mb-4 text-center">
        Выбери свою Арену!
      </h1>

      {/* Character Selection */}
      <Card variant="glass-purple" padding="md" className="w-full max-w-md mx-auto">
        <h2 className="text-xl font-bold text-text-primary mb-4">Твой боец:</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {characters.map((char: Character) => (
            <div
              key={char.id}
              className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                char.id === selectedCharacter?.id
                  ? 'border-gold bg-gold/10'
                  : 'border-obsidian-700 hover:border-purple-neon/50'
              }`}
              onClick={() => selectCharacter(char.id)}
            >
              <img
                src={char.imageUrl}
                alt={char.name}
                className="w-16 h-16 object-cover rounded-full mx-auto mb-2"
              />
              <p className="text-center text-sm font-medium">{char.name}</p>
            </div>
          ))}
        </div>
        {!selectedCharacter && (
          <p className="text-red-400 text-sm mt-4 text-center">
            Пожалуйста, выберите персонажа.
          </p>
        )}
      </Card>

      {/* Arena List */}
      <Card variant="glass-gold" padding="md" className="w-full max-w-md mx-auto">
        <h2 className="text-xl font-bold text-text-primary mb-4">Доступные Арены:</h2>
        <div className="space-y-4">
          {availableArenas.map((arena) => (
            <Button
              key={arena.id}
              variant="primary"
              fullWidth
              onClick={() => onSelectArena(arena.id)}
              disabled={!selectedCharacter}
              icon={<Flame size={18} />}
            >
              {arena.name}
            </Button>
          ))}
        </div>
      </Card>
    </motion.div>
  );
};

// --- Combat Log Entry Component ---
const CombatLogEntry: React.FC<{ entry: BattleLogEntry }> = ({ entry }) => {
  const messageVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.p
      variants={messageVariants}
      className={`text-sm ${entry.isCritical ? 'text-gold' : 'text-text-secondary'}`}
    >
      Ход {entry.turn}: {entry.message}
    </motion.p>
  );
};

// --- Battle Arena Screen ---
const BattleArena: React.FC<{
  playerCharacter: Combatant;
  enemyBot: Combatant;
  onBattleEnd: (result: BattleResult) => void;
  arenaId: string;
}> = ({ playerCharacter: initialPlayer, enemyBot: initialEnemy, onBattleEnd, arenaId }) => {
  const [player, setPlayer] = useState<Combatant>(initialPlayer);
  const [enemy, setEnemy] = useState<Combatant>(initialEnemy);
  const [combatLog, setCombatLog] = useState<BattleLogEntry[]>([]);
  const [isBattleOver, setIsBattleOver] = useState(false);
  const [isAutoBattle, setIsAutoBattle] = useState(false);
  const [actionCooldown, setActionCooldown] = useState(0);

  const updateLog = useCallback((entry: BattleLogEntry) => {
    setCombatLog((prev: BattleLogEntry[]) => [...prev, entry]);
  }, []);

  const handleAttack = useCallback(() => {
    if (isBattleOver || actionCooldown > 0) return;

    const logEntry = performAttack(player, enemy);
    updateLog(logEntry);
    setEnemy((prev: Combatant) => ({ ...prev, currentHealth: logEntry.defenderHealthRemaining }));

    if (logEntry.defenderHealthRemaining <= 0) {
      setIsBattleOver(true);
      return;
    }

    // Enemy's turn
    setTimeout(() => {
      const enemyLogEntry = performAttack(enemy, player);
      updateLog(enemyLogEntry);
      setPlayer((prev: Combatant) => ({ ...prev, currentHealth: enemyLogEntry.defenderHealthRemaining }));

      if (enemyLogEntry.defenderHealthRemaining <= 0) {
        setIsBattleOver(true);
        return;
      }
      setActionCooldown(1);
    }, 1000);
  }, [player, enemy, isBattleOver, updateLog, actionCooldown]);

  // --- Simulate Battle ---
  useEffect(() => {
    if (isBattleOver) {
      const winner = player.currentHealth > 0 ? player : enemy;
      const loser = winner === player ? enemy : player;

      const xpReward = ARENA_CONFIG[arenaId as keyof typeof ARENA_CONFIG]?.xpReward || 0;
      const obsidianReward = ARENA_CONFIG[arenaId as keyof typeof ARENA_CONFIG]?.obsidianReward || 0;

      onBattleEnd({
        winnerId: winner.id,
        loserId: loser.id,
        log: combatLog,
        playerXPGained: winner.id === player.id ? xpReward : 0,
        playerObsidianGained: winner.id === player.id ? obsidianReward : 0,
      });
      return;
    }

    if (isAutoBattle) {
      const battleInterval = setInterval(() => {
        if (player.currentHealth <= 0 || enemy.currentHealth <= 0) {
          clearInterval(battleInterval);
          setIsBattleOver(true);
          return;
        }

        const playerLogEntry = performAttack(player, enemy);
        updateLog(playerLogEntry);
        setEnemy((prev: Combatant) => ({ ...prev, currentHealth: playerLogEntry.defenderHealthRemaining }));

        if (playerLogEntry.defenderHealthRemaining <= 0) {
          clearInterval(battleInterval);
          setIsBattleOver(true);
          return;
        }

        setTimeout(() => {
          if (player.currentHealth <= 0 || enemy.currentHealth <= 0) return;
          const enemyLogEntry = performAttack(enemy, player);
          updateLog(enemyLogEntry);
          setPlayer((prev: Combatant) => ({ ...prev, currentHealth: enemyLogEntry.defenderHealthRemaining }));
        }, 500);
      }, 1500);

      return () => clearInterval(battleInterval);
    }
  }, [player, enemy, isBattleOver, isAutoBattle, updateLog, onBattleEnd, combatLog, arenaId]);

  // Temporary attack function
  const performAttack = (attacker: Combatant, defender: Combatant): BattleLogEntry => {
    const damage = Math.round(Math.random() * 50) + Math.round(attacker.attack / 5);
    return {
      turn: combatLog.length + 1,
      attackerName: attacker.name,
      defenderName: defender.name,
      damageDealt: Math.round(damage),
      isCritical: Math.random() > 0.8,
      message: `${attacker.name} атакует ${defender.name} и наносит ${Math.round(damage)} урона.`,
      defenderHealthRemaining: Math.max(0, defender.currentHealth - Math.round(damage)),
    };
  };

  const playerHealthPercent = (player.currentHealth / player.maxHealth) * 100;
  const enemyHealthPercent = (enemy.currentHealth / enemy.maxHealth) * 100;

  return (
    <motion.div
      className="p-4 md:p-8 space-y-6 min-h-[calc(100vh-140px)] flex flex-col"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      {/* Enemy Card */}
      <Card variant="glass-purple" padding="md" className="flex-shrink-0">
        <div className="flex items-center space-x-4">
          <img
            src={enemy.imageUrl}
            alt={enemy.name}
            className="w-20 h-20 object-cover rounded-full border-2 border-red-500"
          />
          <div className="flex-1">
            <h3 className="text-xl font-bold text-red-400">{enemy.name}</h3>
            <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
              <motion.div
                className="h-2.5 rounded-full"
                style={{
                  width: `${enemyHealthPercent}%`,
                  background:
                    enemyHealthPercent > 30
                      ? 'linear-gradient(to right, #ef4444, #f97316)'
                      : 'linear-gradient(to right, #dc2626, #ef4444)',
                }}
                initial={{ width: 0 }}
                animate={{ width: `${enemyHealthPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-sm text-text-secondary mt-1">
              HP: {enemy.currentHealth} / {enemy.maxHealth}
            </p>
          </div>
        </div>
      </Card>

      {/* Combat Log */}
      <Card variant="glass-gold" padding="md" className="flex-1 overflow-y-auto max-h-64">
        <h3 className="text-lg font-bold text-gold mb-3">Лог Боя</h3>
        <AnimatePresence initial={false}>
          <motion.div layout className="space-y-2">
            {combatLog.map((entry: BattleLogEntry, index: number) => (
              <CombatLogEntry key={index} entry={entry} />
            ))}
          </motion.div>
        </AnimatePresence>
      </Card>

      {/* Player Character Card */}
      <Card variant="glass-gold" padding="md" className="flex-shrink-0">
        <div className="flex items-center space-x-4">
          <img
            src={player.imageUrl}
            alt={player.name}
            className="w-20 h-20 object-cover rounded-full border-2 border-purple-neon"
          />
          <div className="flex-1">
            <h3 className="text-xl font-bold text-purple-neon">{player.name}</h3>
            <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
              <motion.div
                className="h-2.5 rounded-full"
                style={{
                  width: `${playerHealthPercent}%`,
                  background:
                    playerHealthPercent > 30
                      ? 'linear-gradient(to right, #a855f7, #d946ef)'
                      : 'linear-gradient(to right, #ef4444, #f97316)',
                }}
                initial={{ width: 0 }}
                animate={{ width: `${playerHealthPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-sm text-text-secondary mt-1">
              HP: {player.currentHealth} / {player.maxHealth}
            </p>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex justify-around mt-4 space-x-2">
          <Button
            variant="primary"
            icon={<Sword size={18} />}
            onClick={handleAttack}
            disabled={isBattleOver || isAutoBattle || actionCooldown > 0}
          >
            Атаковать
          </Button>
          <Button
            variant="secondary"
            icon={<Zap size={18} />}
            onClick={() => {}}
            disabled={true}
          >
            Суперудар
          </Button>
          <Button
            variant={isAutoBattle ? 'danger' : 'gold'}
            onClick={() => setIsAutoBattle((prev) => !prev)}
            icon={<Trophy size={18} />}
          >
            {isAutoBattle ? 'Стоп Авто' : 'Авто-бой'}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

// --- Victory / Defeat Modal ---
const BattleResultModal: React.FC<{ result: BattleResult; onClose: () => void }> = ({
  result,
  onClose,
}) => {
  const { user, updateUser, updateBalance } = useUser();
  const isVictory = result.winnerId === user?.selectedCharacterId;

  const xpBefore = user?.experience || 0;
  const xpAfter = xpBefore + result.playerXPGained;
  const currentLevel = user?.level || 1;
  const xpToNextLevel = currentLevel * 100;
  const levelUp = xpAfter >= xpToNextLevel;

  useEffect(() => {
    if (isVictory && user) {
      updateBalance(result.playerObsidianGained, 'obsidian');
      let newLevel = currentLevel;
      let newExperience = xpAfter;

      if (levelUp) {
        newLevel++;
        newExperience -= xpToNextLevel;
      }
      updateUser({ experience: newExperience, level: newLevel });
    }
  }, [isVictory, user, result, updateBalance, updateUser, currentLevel, levelUp, xpToNextLevel]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/80"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Card
        variant={isVictory ? 'glass-gold' : 'glass-purple'}
        padding="lg"
        className="w-full max-w-md text-center"
      >
        <h2
          className={`text-3xl font-bold mb-4 ${
            isVictory ? 'text-gradient-gold' : 'text-gradient-purple'
          }`}
        >
          {isVictory ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ!'}
        </h2>

        {isVictory && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Trophy size={48} className="mx-auto text-gold mb-4" />
            <p className="text-lg text-text-primary mb-2">Ты доблестно сражался!</p>
            <p className="text-sm text-text-secondary">Получено наград:</p>
            <div className="flex flex-col items-center mt-3">
              <span className="text-lg font-bold text-purple-neon flex items-center mb-1">
                <Gem size={18} className="mr-2" />
                +{result.playerObsidianGained} OBS
              </span>
              <span className="text-lg font-bold text-gold flex items-center">
                <Trophy size={18} className="mr-2" />
                +{result.playerXPGained} XP
              </span>
            </div>

            {levelUp && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className="mt-4 p-3 bg-green-700/20 border border-green-500/50 rounded-lg"
              >
                <p className="text-green-400 font-bold">УРОВЕНЬ ПОВЫШЕН!</p>
                <p className="text-sm text-text-secondary">
                  Твой персонаж достиг {currentLevel + 1} уровня!
                </p>
              </motion.div>
            )}
          </motion.div>
        )}

        {!isVictory && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Skull size={48} className="mx-auto text-red-400 mb-4" />
            <p className="text-lg text-text-primary mb-2">К сожалению, ты проиграл.</p>
            <p className="text-sm text-text-secondary">
              Не унывай! Попробуй улучшить снаряжение в Маркете.
            </p>
            <Button variant="gold" className="mt-4" onClick={onClose}>
              Перейти в Маркет
            </Button>
          </motion.div>
        )}

        <Button variant="secondary" className="mt-6" onClick={onClose}>
          Закрыть
        </Button>
      </Card>
    </motion.div>
  );
};

// --- Main Battle Screen Container ---
export const BattleScreen: React.FC = () => {
  const { selectedCharacter } = useUser();
  const [battleState, setBattleState] = useState<'selection' | 'fighting' | 'result'>('selection');
  const [currentArena, setCurrentArena] = useState<string>('fieryArena');
  const [enemyBot, setEnemyBot] = useState<Combatant | null>(null);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);

  const handleStartBattle = useCallback(
    (arenaId: string) => {
      if (!selectedCharacter) return;
      const newEnemy = generateEnemy(selectedCharacter, arenaId);
      setEnemyBot(newEnemy);
      setCurrentArena(arenaId);
      setBattleState('fighting');
    },
    [selectedCharacter]
  );

  const handleBattleEnd = useCallback((result: BattleResult) => {
    setBattleResult(result);
    setBattleState('result');
  }, []);

  const handleCloseResult = useCallback(() => {
    setBattleState('selection');
    setBattleResult(null);
  }, []);

  if (!selectedCharacter) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary">Выберите персонажа на Доске, чтобы начать бой.</p>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {battleState === 'selection' && (
        <ArenaSelection key="selection" onSelectArena={handleStartBattle} />
      )}
      {battleState === 'fighting' && enemyBot && (
        <BattleArena
          key="fighting"
          playerCharacter={{
            ...selectedCharacter,
            currentHealth: selectedCharacter.maxHealth,
            cooldowns: {},
          }}
          enemyBot={enemyBot}
          onBattleEnd={handleBattleEnd}
          arenaId={currentArena}
        />
      )}
      {battleState === 'result' && battleResult && (
        <BattleResultModal key="result" result={battleResult} onClose={handleCloseResult} />
      )}
    </AnimatePresence>
  );
};
