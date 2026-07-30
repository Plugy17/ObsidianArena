// ============================================
// Obsidian Arena — MOBA Arena Component
// ============================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sword, Skull, RefreshCw } from 'lucide-react';
import { MatchEngine, createMatchEngine } from '../../logic/moba/matchEngine';
import {
  drawChampion,
  drawCreep,
  drawTower,
  drawNexus,
  drawSkillshot,
  drawLanePaths,
  drawTargetingLine,
  drawRangeIndicator,
} from './UnitRenderer';
import { HUD } from './HUD';
import { MobileControls } from './MobileControls';
import { useKeyboardControls } from '../../hooks/useKeyboardControls';
import { useUser } from '../../context/UserContext';
import { useGameStore } from '../../store/gameStore';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import type { InputCommand, MatchMode, AbilityDefinition } from '../../logic/moba/types';
import type { CharacterData } from '../../logic/moba/unitFactory';

// --- Map dimensions ---
const MAP_WIDTH = 1920;
const MAP_HEIGHT = 1080;

// --- Default ability definitions ---
const DEFAULT_ABILITY_DEFS: AbilityDefinition[] = [
  {
    id: 'Q',
    key: 'Q',
    name: 'Удар',
    description: 'Базовая атака с усиленным уроном.',
    damage: 80,
    cooldown: 8000,
    range: 250,
    manaCost: 0,
    targetType: 'enemy',
  },
  {
    id: 'W',
    key: 'W',
    name: 'Щит',
    description: 'Поглощает урон и лечит.',
    damage: 100,
    cooldown: 10000,
    range: 0,
    manaCost: 0,
    targetType: 'self',
  },
  {
    id: 'E',
    key: 'E',
    name: 'Рывок',
    description: 'Быстрый рывок к цели.',
    damage: 60,
    cooldown: 12000,
    range: 500,
    manaCost: 0,
    targetType: 'enemy',
  },
  {
    id: 'R',
    key: 'R',
    name: 'Финиш',
    description: 'Мощный выстрел с льдяной стрелой.',
    damage: 200,
    cooldown: 100000,
    range: 800,
    manaCost: 0,
    targetType: 'skillshot',
    skillshotType: 'line',
    radius: 30,
    speed: 1000,
  },
];

// --- Convert Character to CharacterData ---
const toCharacterData = (char: any): CharacterData => ({
  id: char.id,
  name: char.name,
  role: char.role || 'damage',
  rarity: char.rarity || 'common',
  stats: char.stats || { hp: 1000, atk: 80, def: 50, spd: 70 },
  abilities: char.abilities || [],
  avatar: char.avatar || char.imageUrl || '/logo.svg',
});

// --- Match Setup Screen ---
const MatchSetup: React.FC<{
  onStart: (mode: MatchMode) => void;
}> = ({ onStart }) => {
  const { selectedCharacter } = useUser();

  return (
    <motion.div
      className="p-4 md:p-8 space-y-6 flex flex-col items-center justify-center min-h-[calc(100vh-140px)]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h1 className="text-3xl md:text-4xl font-bold text-gradient-purple mb-4 text-center">
        MOBA Арена
      </h1>

      <Card variant="glass-purple" padding="lg" className="w-full max-w-md mx-auto">
        <h2 className="text-xl font-bold text-text-primary mb-4">Выбери режим:</h2>
        <div className="space-y-4">
          <Button
            variant="primary"
            fullWidth
            icon={<Sword size={18} />}
            onClick={() => onStart('pve')}
            disabled={!selectedCharacter}
          >
            PvE — Против ИИ
          </Button>
          <Button
            variant="gold"
            fullWidth
            icon={<Skull size={18} />}
            onClick={() => onStart('pvp')}
            disabled={!selectedCharacter}
          >
            PvP — Против Игрока
          </Button>
        </div>

        {!selectedCharacter && (
          <p className="text-red-400 text-sm mt-4 text-center">
            Выберите персонажа на Доске.
          </p>
        )}
      </Card>
    </motion.div>
  );
};

// --- Main MOBA Arena Component ---
export const MobaArena: React.FC = () => {
  const { selectedCharacter } = useUser();
  const [matchEngine, setMatchEngine] = useState<MatchEngine | null>(null);
  const [matchState, setMatchState] = useState<any>(null);
  const [gamePhase, setGamePhase] = useState<'setup' | 'playing' | 'result'>('setup');
  const [isPC, setIsPC] = useState(true);
  const [isAutoAttack, setIsAutoAttack] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const engineRef = useRef<MatchEngine | null>(null);

  // --- Detect device type ---
  useEffect(() => {
    const checkDevice = () => {
      setIsPC(window.innerWidth >= 768);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // --- Handle keyboard/mouse input ---
  const handleCommand = useCallback((command: InputCommand) => {
    if (engineRef.current) {
      engineRef.current.submitCommand(command);
    }
  }, []);

  const keyboardControls = useKeyboardControls(handleCommand, canvasRef);

  // --- Start match ---
  const handleStartMatch = useCallback((mode: MatchMode) => {
    if (!selectedCharacter) return;

    const playerData = toCharacterData(selectedCharacter);
    const enemyData = toCharacterData({
      ...selectedCharacter,
      id: 'enemy-bot',
      name: 'Тень Игрока',
      avatar: selectedCharacter.imageUrl,
    });

    const engine = createMatchEngine(
      `match-${Date.now()}`,
      mode,
      playerData,
      mode === 'pve' ? enemyData : enemyData,
      DEFAULT_ABILITY_DEFS
    );

    engine.start();
    engineRef.current = engine;
    setMatchEngine(engine);
    setMatchState(engine.getState());
    setGamePhase('playing');
    lastTimeRef.current = Date.now();
  }, [selectedCharacter]);

  // --- Game loop ---
  useEffect(() => {
    if (!matchEngine || gamePhase !== 'playing') return;

    const gameLoop = (currentTime: number) => {
      if (!engineRef.current) return;

      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      // Update match engine
      engineRef.current.update(deltaTime);

      // Update state
      setMatchState(engineRef.current.getState());

      // Render
      renderCanvas(engineRef.current);

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [matchEngine, gamePhase]);

  // --- Render canvas ---
  const renderCanvas = useCallback((engine: MatchEngine) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = 'rgba(138, 43, 226, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 80) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw lane paths
    const lanes = engine.getLanes();
    drawLanePaths(ctx, lanes.map(l => ({
      playerPath: l.playerPath,
      enemyPath: l.enemyPath,
      playerNexus: l.playerNexus,
      enemyNexus: l.enemyNexus,
    })));

    // Draw nexuses
    const entities = engine.getAllEntities();
    for (const nexus of entities.nexuses) {
      drawNexus(ctx, nexus);
    }

    // Draw towers
    for (const tower of entities.towers) {
      drawTower(ctx, tower);
    }

    // Draw creeps
    for (const creep of entities.creeps) {
      drawCreep(ctx, creep);
    }

    // Draw champions
    for (const champ of entities.champions) {
      drawChampion(ctx, champ, champ.isPlayerControlled);
    }

    // Draw skillshots
    for (const skillshot of entities.skillshots) {
      drawSkillshot(ctx, skillshot);
    }

    // Draw targeting line for player
    if (keyboardControls.mousePosition) {
      const player = engine.getPlayerChampion();
      drawTargetingLine(ctx, player.position, keyboardControls.mousePosition);
    }

    // Draw range indicator for player
    if (keyboardControls.isMouseDown) {
      const player = engine.getPlayerChampion();
      drawRangeIndicator(ctx, player.position, player.attackRange);
    }
  }, [keyboardControls.mousePosition, keyboardControls.isMouseDown]);

  // --- Handle ability press ---
  const handleAbilityPress = useCallback((key: 'Q' | 'W' | 'E' | 'R') => {
    handleCommand({ type: 'ability', abilityKey: key });
  }, [handleCommand]);

  // --- Toggle auto attack ---
  const handleToggleAuto = useCallback(() => {
    setIsAutoAttack(prev => !prev);
  }, []);

  // --- Get cooldown data ---
  const getCooldownData = () => {
    if (!matchEngine || !matchState) {
      return {
        cooldowns: { Q: 0, W: 0, E: 0, R: 0 },
        maxCooldowns: { Q: 8, W: 10, E: 12, R: 100 },
      };
    }

    const player = matchState.playerChampion;
    const cooldowns = { Q: 0, W: 0, E: 0, R: 0 };
    const maxCooldowns = { Q: 8, W: 10, E: 12, R: 100 };

    for (const key of ['Q', 'W', 'E', 'R'] as const) {
      cooldowns[key] = matchEngine.getCooldownProgress(player.id, key) * maxCooldowns[key];
    }

    return { cooldowns, maxCooldowns };
  };

  const cooldownData = getCooldownData();

  // --- Get ability names ---
  const abilityNames = {
    Q: 'Удар',
    W: 'Щит',
    E: 'Рывок',
    R: 'Финиш',
  };

  // --- Handle restart ---
  const handleRestart = useCallback(() => {
    setGamePhase('setup');
    setMatchEngine(null);
    setMatchState(null);
    engineRef.current = null;
  }, []);

  // --- Render setup phase ---
  if (gamePhase === 'setup') {
    return <MatchSetup onStart={handleStartMatch} />;
  }

  // --- Render playing phase ---
  return (
    <div className="relative w-full h-[calc(100vh-140px)] bg-[#0a0a12] overflow-hidden">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        className="w-full h-full object-contain"
        style={{ imageRendering: 'pixelated' }}
      />

      {/* HUD */}
      {matchState && (
        <HUD
          matchState={matchState}
          onAbilityPress={handleAbilityPress}
          abilityNames={abilityNames}
          cooldowns={cooldownData.cooldowns}
          maxCooldowns={cooldownData.maxCooldowns}
          isPC={isPC}
        />
      )}

      {/* Mobile Controls */}
      {!isPC && matchState && (
        <MobileControls
          onCommand={handleCommand}
          abilityNames={abilityNames}
          cooldowns={cooldownData.cooldowns}
          maxCooldowns={cooldownData.maxCooldowns}
          isAutoAttack={isAutoAttack}
          onToggleAuto={handleToggleAuto}
        />
      )}

      {/* Game Over Overlay */}
      {matchState?.matchResult && (
        <motion.div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Card variant="glass-purple" padding="lg" className="text-center max-w-md">
            <h2
              className={`text-4xl font-bold mb-4 ${
                matchState.matchResult === 'player_victory'
                  ? 'text-gradient-gold'
                  : 'text-gradient-purple'
              }`}
            >
              {matchState.matchResult === 'player_victory' ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ!'}
            </h2>
            <p className="text-text-secondary mb-4">
              {matchState.matchResult === 'player_victory'
                ? 'Ты победил!'
                : 'К сожалению, ты проиграл.'}
            </p>
            <div className="flex justify-center gap-4 text-sm text-text-secondary mb-6">
              <span>Убийств: {matchState.playerKills}</span>
              <span>Смертей: {matchState.playerDeaths}</span>
              <span>Золото: {matchState.playerGold}</span>
            </div>
            <Button variant="gold" onClick={handleRestart} icon={<RefreshCw size={18} />}>
              Играть снова
            </Button>
          </Card>
        </motion.div>
      )}
    </div>
  );
};
