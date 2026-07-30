// ============================================
// Obsidian Arena — Unit Factory
// ============================================

import type {
  Vector2D,
  ChampionEntity,
  CreepEntity,
  Tower,
  Nexus,
  Lane,
  LaneType,
  CooldownManager,
  AbilityDefinition,
} from './types';
import { createCooldownManager } from './cooldownManager';

// --- Default Match Config ---
export const DEFAULT_MATCH_CONFIG = {
  mode: 'pve' as const,
  mapName: 'Obsidian Arena',
  gameTimeLimit: 1800000, // 30 minutes
  creepSpawnInterval: 30000, // 30 seconds
  creepWaveSize: 6,
  towerRange: 850,
  towerAttackSpeed: 1.0,
  nexusHealth: 4000,
  towerHealth: 2200,
  startingGold: 1000,
  startingLevel: 1,
  xpPerKill: 100,
  goldPerKill: 300,
  goldPerAssist: 100,
  goldPerMinion: 40,
};

// --- Lane Definitions ---
export const LANE_DEFINITIONS: Lane[] = [
  {
    type: 'top',
    name: 'Верхняя линия',
    playerSpawn: { x: 200, y: 800 },
    enemySpawn: { x: 1700, y: 200 },
    playerTowers: [
      { x: 500, y: 700 },
      { x: 900, y: 550 },
      { x: 1300, y: 400 },
    ],
    enemyTowers: [
      { x: 1400, y: 300 },
      { x: 1000, y: 450 },
      { x: 600, y: 600 },
    ],
    playerNexus: { x: 200, y: 800 },
    enemyNexus: { x: 1700, y: 200 },
    playerPath: [
      { x: 200, y: 800 }, { x: 350, y: 730 }, { x: 500, y: 700 },
      { x: 650, y: 660 }, { x: 800, y: 600 }, { x: 900, y: 550 },
      { x: 1000, y: 500 }, { x: 1100, y: 450 }, { x: 1200, y: 420 },
      { x: 1300, y: 400 }, { x: 1400, y: 370 }, { x: 1500, y: 350 },
      { x: 1600, y: 300 }, { x: 1700, y: 200 },
    ],
    enemyPath: [
      { x: 1700, y: 200 }, { x: 1550, y: 270 }, { x: 1400, y: 300 },
      { x: 1250, y: 340 }, { x: 1100, y: 380 }, { x: 1000, y: 450 },
      { x: 900, y: 500 }, { x: 800, y: 550 }, { x: 700, y: 600 },
      { x: 600, y: 660 }, { x: 500, y: 700 }, { x: 400, y: 730 },
      { x: 300, y: 760 }, { x: 200, y: 800 },
    ],
  },
  {
    type: 'mid',
    name: 'Центральная линия',
    playerSpawn: { x: 200, y: 500 },
    enemySpawn: { x: 1700, y: 500 },
    playerTowers: [
      { x: 500, y: 500 },
      { x: 900, y: 500 },
      { x: 1300, y: 500 },
    ],
    enemyTowers: [
      { x: 1400, y: 500 },
      { x: 1000, y: 500 },
      { x: 600, y: 500 },
    ],
    playerNexus: { x: 200, y: 500 },
    enemyNexus: { x: 1700, y: 500 },
    playerPath: [
      { x: 200, y: 500 }, { x: 350, y: 500 }, { x: 500, y: 500 },
      { x: 650, y: 500 }, { x: 800, y: 500 }, { x: 900, y: 500 },
      { x: 1000, y: 500 }, { x: 1100, y: 500 }, { x: 1200, y: 500 },
      { x: 1300, y: 500 }, { x: 1400, y: 500 }, { x: 1500, y: 500 },
      { x: 1600, y: 500 }, { x: 1700, y: 500 },
    ],
    enemyPath: [
      { x: 1700, y: 500 }, { x: 1550, y: 500 }, { x: 1400, y: 500 },
      { x: 1250, y: 500 }, { x: 1100, y: 500 }, { x: 1000, y: 500 },
      { x: 900, y: 500 }, { x: 800, y: 500 }, { x: 700, y: 500 },
      { x: 600, y: 500 }, { x: 500, y: 500 }, { x: 400, y: 500 },
      { x: 300, y: 500 }, { x: 200, y: 500 },
    ],
  },
  {
    type: 'bot',
    name: 'Нижняя линия',
    playerSpawn: { x: 200, y: 200 },
    enemySpawn: { x: 1700, y: 800 },
    playerTowers: [
      { x: 500, y: 300 },
      { x: 900, y: 450 },
      { x: 1300, y: 600 },
    ],
    enemyTowers: [
      { x: 1400, y: 700 },
      { x: 1000, y: 550 },
      { x: 600, y: 400 },
    ],
    playerNexus: { x: 200, y: 200 },
    enemyNexus: { x: 1700, y: 800 },
    playerPath: [
      { x: 200, y: 200 }, { x: 350, y: 270 }, { x: 500, y: 300 },
      { x: 650, y: 340 }, { x: 800, y: 380 }, { x: 900, y: 450 },
      { x: 1000, y: 500 }, { x: 1100, y: 550 }, { x: 1200, y: 580 },
      { x: 1300, y: 600 }, { x: 1400, y: 630 }, { x: 1500, y: 650 },
      { x: 1600, y: 700 }, { x: 1700, y: 800 },
    ],
    enemyPath: [
      { x: 1700, y: 800 }, { x: 1550, y: 730 }, { x: 1400, y: 700 },
      { x: 1250, y: 660 }, { x: 1100, y: 620 }, { x: 1000, y: 550 },
      { x: 900, y: 500 }, { x: 800, y: 460 }, { x: 700, y: 420 },
      { x: 600, y: 400 }, { x: 500, y: 370 }, { x: 400, y: 340 },
      { x: 300, y: 300 }, { x: 200, y: 200 },
    ],
  },
];

// --- Character to Champion conversion ---
export interface CharacterData {
  id: string;
  name: string;
  role: string;
  rarity: string;
  stats: { hp: number; atk: number; def: number; spd: number };
  abilities: { key: 'Q' | 'W' | 'E' | 'R'; name: string; description: string }[];
  avatar: string;
}

// --- Create Champion Entity ---
export const createChampion = (
  character: CharacterData,
  team: 'player' | 'enemy',
  position: Vector2D,
  isPlayerControlled: boolean,
  level: number = 1,
  gold: number = 0,
  abilityDefs?: AbilityDefinition[]
): ChampionEntity => {
  const baseStats = character.stats;
  const statMultiplier = 0.7 + level * 0.3;

  // Build cooldown manager from ability definitions
  let cooldownManager: CooldownManager;
  if (abilityDefs && abilityDefs.length > 0) {
    cooldownManager = createCooldownManager(
      abilityDefs.map(a => a.id),
      abilityDefs.map(a => a.cooldown)
    );
  } else {
    // Fallback: use character abilities
    cooldownManager = createCooldownManager(
      character.abilities.map(a => a.key),
      [8000, 10000, 12000, 100000] // default cooldowns in ms
    );
  }

  return {
    id: `${character.id}-${team}-${Date.now()}`,
    name: character.name,
    position: { ...position },
    health: Math.round(baseStats.hp * statMultiplier),
    maxHealth: Math.round(baseStats.hp * statMultiplier),
    attack: Math.round(baseStats.atk * statMultiplier),
    defense: Math.round(baseStats.def * statMultiplier),
    speed: baseStats.spd,
    isAlive: true,
    team,
    entityType: 'champion',
    characterId: character.id,
    level,
    experience: 0,
    gold,
    abilityLevels: { Q: 1, W: 0, E: 0, R: 0 },
    moveSpeed: baseStats.spd * 0.8,
    attackRange: 200,
    cooldownManager,
    isPlayerControlled,
    targetId: null,
    lastAttackerId: null,
    respawnTime: 0,
    kills: 0,
    deaths: 0,
    assists: 0,
  };
};

// --- Create Creep Entity ---
export const createCreep = (
  type: 'melee' | 'ranged' | 'siege' | 'super',
  team: 'player' | 'enemy',
  position: Vector2D,
  waveNumber: number
): CreepEntity => {
  const isSuper = type === 'super';
  const isSiege = type === 'siege';
  const isRanged = type === 'ranged';

  // Scale stats with wave number
  const waveBonus = waveNumber * 0.05;
  const statMultiplier = 1 + waveBonus;

  let config: {
    hp: number; atk: number; def: number; spd: number;
    range: number; gold: number; xp: number;
  };

  switch (type) {
    case 'melee':
      config = {
        hp: Math.round((400 + waveNumber * 20) * statMultiplier),
        atk: Math.round((55 + waveNumber * 3) * statMultiplier),
        def: Math.round((20 + waveNumber * 1) * statMultiplier),
        spd: 70,
        range: 120,
        gold: 20 + Math.floor(waveNumber / 3) * 5,
        xp: 30 + Math.floor(waveNumber / 3) * 10,
      };
      break;
    case 'ranged':
      config = {
        hp: Math.round((350 + waveNumber * 18) * statMultiplier),
        atk: Math.round((50 + waveNumber * 2) * statMultiplier),
        def: Math.round((15 + waveNumber * 1) * statMultiplier),
        spd: 75,
        range: 450,
        gold: 25 + Math.floor(waveNumber / 3) * 5,
        xp: 35 + Math.floor(waveNumber / 3) * 10,
      };
      break;
    case 'siege':
      config = {
        hp: Math.round((700 + waveNumber * 40) * statMultiplier),
        atk: Math.round((80 + waveNumber * 5) * statMultiplier),
        def: Math.round((40 + waveNumber * 2) * statMultiplier),
        spd: 55,
        range: 300,
        gold: 40 + Math.floor(waveNumber / 3) * 10,
        xp: 60 + Math.floor(waveNumber / 3) * 15,
      };
      break;
    case 'super':
      config = {
        hp: Math.round((1200 + waveNumber * 60) * statMultiplier),
        atk: Math.round((120 + waveNumber * 8) * statMultiplier),
        def: Math.round((60 + waveNumber * 3) * statMultiplier),
        spd: 85,
        range: 250,
        gold: 60 + Math.floor(waveNumber / 3) * 15,
        xp: 100 + Math.floor(waveNumber / 3) * 20,
      };
      break;
    default:
      config = {
        hp: 400, atk: 55, def: 20, spd: 70,
        range: 120, gold: 20, xp: 30,
      };
  }

  return {
    id: `creep-${type}-${team}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: isSuper ? 'Надсильный крип' : isSiege ? 'Осадный крип' : isRanged ? 'Дальний крип' : 'Ближний крип',
    position: { ...position },
    health: config.hp,
    maxHealth: config.hp,
    attack: config.atk,
    defense: config.def,
    speed: config.spd,
    isAlive: true,
    team,
    entityType: 'creep',
    creepType: type,
    goldValue: config.gold,
    xpValue: config.xp,
    attackRange: config.range,
    moveSpeed: config.spd,
  };
};

// --- Create Wave of Creeps ---
export const createWave = (
  lane: Lane,
  team: 'player' | 'enemy',
  waveNumber: number,
  gameTime: number
): { creeps: CreepEntity[]; nextSpawnTime: number } => {
  const spawnPoint = team === 'player' ? lane.playerSpawn : lane.enemySpawn;
  const creeps: CreepEntity[] = [];

  // Every 3rd wave includes a siege creep (starting wave 3)
  const includeSiege = waveNumber >= 3 && waveNumber % 3 === 0;
  // Super creeps start appearing after wave 10
  const includeSuper = waveNumber >= 10 && waveNumber % 10 === 0;

  // Standard wave composition
  // Melee creeps: 3 per wave
  for (let i = 0; i < 3; i++) {
    const offset = { x: (i - 1) * 30, y: (i - 1) * 20 };
    creeps.push(
      createCreep(
        includeSuper ? 'super' : 'melee',
        team,
        { x: spawnPoint.x + offset.x, y: spawnPoint.y + offset.y },
        waveNumber
      )
    );
  }

  // Ranged creep: 1 per wave
  creeps.push(
    createCreep(
      includeSuper ? 'super' : 'ranged',
      team,
      { x: spawnPoint.x + 50, y: spawnPoint.y + 30 },
      waveNumber
    )
  );

  // Siege creep: 1 every 3rd wave
  if (includeSiege && !includeSuper) {
    creeps.push(
      createCreep(
        'siege',
        team,
        { x: spawnPoint.x + 80, y: spawnPoint.y + 40 },
        waveNumber
      )
    );
  }

  return {
    creeps,
    nextSpawnTime: gameTime + DEFAULT_MATCH_CONFIG.creepSpawnInterval,
  };
};

// --- Create Tower ---
export const createTower = (
  lane: Lane,
  team: 'player' | 'enemy',
  tier: 1 | 2 | 3,
  config?: { health?: number; attack?: number; range?: number; attackSpeed?: number }
): Tower => {
  const towers = team === 'player' ? lane.playerTowers : lane.enemyTowers;
  const position = towers[tier - 1] || towers[0];

  return {
    id: `tower-${team}-${lane.type}-${tier}`,
    position: { ...position },
    health: config?.health || DEFAULT_MATCH_CONFIG.towerHealth,
    maxHealth: config?.health || DEFAULT_MATCH_CONFIG.towerHealth,
    attack: config?.attack || 150,
    defense: 50,
    range: config?.range || DEFAULT_MATCH_CONFIG.towerRange,
    attackSpeed: config?.attackSpeed || DEFAULT_MATCH_CONFIG.towerAttackSpeed,
    team,
    lane: lane.type,
    tier,
    isAlive: true,
    targetId: null,
    lastAttackTime: 0,
    goldValue: 100 * tier,
  };
};

// --- Create Nexus ---
export const createNexus = (
  lane: Lane,
  team: 'player' | 'enemy',
  config?: { health?: number; radius?: number }
): Nexus => {
  const position = team === 'player' ? lane.playerNexus : lane.enemyNexus;

  return {
    id: `nexus-${team}`,
    position: { ...position },
    health: config?.health || DEFAULT_MATCH_CONFIG.nexusHealth,
    maxHealth: config?.health || DEFAULT_MATCH_CONFIG.nexusHealth,
    team,
    isAlive: true,
    radius: config?.radius || 120,
  };
};

// --- Create All Structures ---
export const createAllStructures = (
  lanes: Lane[]
): { towers: Tower[]; nexuses: Nexus[] } => {
  const towers: Tower[] = [];
  const nexuses: Nexus[] = [];

  for (const lane of lanes) {
    // Player towers
    towers.push(createTower(lane, 'player', 1));
    towers.push(createTower(lane, 'player', 2));
    towers.push(createTower(lane, 'player', 3));

    // Enemy towers
    towers.push(createTower(lane, 'enemy', 1));
    towers.push(createTower(lane, 'enemy', 2));
    towers.push(createTower(lane, 'enemy', 3));

    // Nexuses (only create once per team)
  }

  // Create nexuses for each team (use mid lane for nexus positions)
  const midLane = lanes.find(l => l.type === 'mid') || lanes[0];
  nexuses.push(createNexus(midLane, 'player'));
  nexuses.push(createNexus(midLane, 'enemy'));

  return { towers, nexuses };
};

// --- Create Initial Match State ---
export const createInitialMatchState = (
  matchId: string,
  mode: 'pve' | 'pvp',
  playerCharacter: CharacterData,
  enemyCharacter: CharacterData | null,
  abilityDefs?: AbilityDefinition[]
): {
  playerChampion: ChampionEntity;
  enemyChampions: ChampionEntity[];
  towers: Tower[];
  nexuses: Nexus[];
  lanes: Lane[];
} => {
  const lanes = [...LANE_DEFINITIONS];
  const midLane = lanes.find(l => l.type === 'mid')!;

  // Create player champion at mid lane spawn
  const playerChampion = createChampion(
    playerCharacter,
    'player',
    { ...midLane.playerSpawn, x: midLane.playerSpawn.x + 100 },
    true,
    1,
    DEFAULT_MATCH_CONFIG.startingGold,
    abilityDefs
  );

  // Create enemy champion(s)
  const enemyChampions: ChampionEntity[] = [];
  if (mode === 'pvp' && enemyCharacter) {
    enemyChampions.push(
      createChampion(
        enemyCharacter,
        'enemy',
        { ...midLane.enemySpawn, x: midLane.enemySpawn.x - 100 },
        false,
        1,
        DEFAULT_MATCH_CONFIG.startingGold,
        abilityDefs
      )
    );
  } else if (mode === 'pve') {
    // In PvE, create AI-controlled enemy champions that spawn over time
    // For now, create one at the start
    enemyChampions.push(
      createChampion(
        enemyCharacter || playerCharacter,
        'enemy',
        { ...midLane.enemySpawn, x: midLane.enemySpawn.x - 100 },
        false,
        3, // enemy starts at level 3
        0,
        abilityDefs
      )
    );
  }

  // Create structures
  const { towers, nexuses } = createAllStructures(lanes);

  return {
    playerChampion,
    enemyChampions,
    towers,
    nexuses,
    lanes,
  };
};
