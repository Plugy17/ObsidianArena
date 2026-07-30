// ============================================
// Obsidian Arena — MOBA Combat Types
// ============================================

// --- 2D Vector / Position ---
export interface Vector2D {
  x: number;
  y: number;
}

// --- Skillshot Types ---
export type SkillshotType = 'line' | 'circle' | 'cone' | 'target';

// --- Skillshot / Projectile ---
export interface Skillshot {
  id: string;
  type: SkillshotType;
  origin: Vector2D;
  position: Vector2D;
  direction: Vector2D;
  speed: number;          // pixels per second
  radius: number;         // AoE radius
  range: number;          // max travel distance
  damage: number;
  casterId: string;
  isActive: boolean;
  lifetime: number;       // ms remaining
  maxLifetime: number;    // ms total
  traveledDistance: number;
}

// --- Target Priority ---
export type TargetPriority = 'low_hp_champion' | 'champion' | 'creep';

// --- Ability Target ---
export interface AbilityTarget {
  type: 'skillshot' | 'self' | 'ally' | 'enemy' | 'area';
  position?: Vector2D;
  entityId?: string;
}

// --- Cooldown State ---
export interface CooldownState {
  abilityId: string;
  maxCooldown: number;    // ms
  remainingCooldown: number; // ms
  isReady: boolean;
}

// --- Cooldown Manager ---
export interface CooldownManager {
  cooldowns: Map<string, CooldownState>;
}

// --- Combat Entity (player, enemy, creep) ---
export interface CombatEntity {
  id: string;
  name: string;
  position: Vector2D;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  speed: number;
  isAlive: boolean;
  team: 'player' | 'enemy' | 'neutral';
  entityType: 'champion' | 'creep';
}

// --- Champion Entity (extended CombatEntity) ---
export interface ChampionEntity extends CombatEntity {
  entityType: 'champion';
  characterId: string;
  level: number;
  experience: number;
  gold: number;
  abilityLevels: { Q: number; W: number; E: number; R: number };
  moveSpeed: number;
  attackRange: number;
  cooldownManager: CooldownManager;
  isPlayerControlled: boolean;
  targetId: string | null;
  lastAttackerId: string | null;
  respawnTime: number; // ms until respawn (0 = alive)
  kills: number;
  deaths: number;
  assists: number;
}

// --- Creep Entity ---
export interface CreepEntity extends CombatEntity {
  entityType: 'creep';
  creepType: 'melee' | 'ranged' | 'siege' | 'super';
  goldValue: number;
  xpValue: number;
  attackRange: number;
  moveSpeed: number;
}

// --- Tower ---
export interface Tower {
  id: string;
  position: Vector2D;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  range: number;
  attackSpeed: number; // attacks per second
  team: 'player' | 'enemy';
  lane: LaneType;
  tier: 1 | 2 | 3;
  isAlive: boolean;
  targetId: string | null;
  lastAttackTime: number;
  goldValue: number;
}

// --- Nexus ---
export interface Nexus {
  id: string;
  position: Vector2D;
  health: number;
  maxHealth: number;
  team: 'player' | 'enemy';
  isAlive: boolean;
  radius: number;
}

// --- Lane Types ---
export type LaneType = 'top' | 'mid' | 'bot';

// --- Lane Definition ---
export interface Lane {
  type: LaneType;
  name: string;
  // Spawn points for each team
  playerSpawn: Vector2D;
  enemySpawn: Vector2D;
  // Tower positions (tier 1, 2, 3)
  playerTowers: Vector2D[];
  enemyTowers: Vector2D[];
  // Nexus positions
  playerNexus: Vector2D;
  enemyNexus: Vector2D;
  // Path waypoints for creeps
  playerPath: Vector2D[];
  enemyPath: Vector2D[];
}

// --- Wave ---
export interface Wave {
  id: string;
  lane: LaneType;
  team: 'player' | 'enemy';
  creeps: CreepEntity[];
  nextSpawnTime: number; // game time ms
  waveNumber: number;
}

// --- Match Mode ---
export type MatchMode = 'pve' | 'pvp';

// --- Match State ---
export type MatchState = 'waiting' | 'playing' | 'ended';

// --- Match Result ---
export type MatchResult = 'player_victory' | 'enemy_victory' | 'draw';

// --- Ability Definition (for MOBA gameplay) ---
export interface AbilityDefinition {
  id: string;
  key: 'Q' | 'W' | 'E' | 'R';
  name: string;
  description: string;
  damage: number;
  cooldown: number; // ms
  range: number;
  manaCost: number;
  targetType: 'skillshot' | 'self' | 'ally' | 'enemy' | 'area';
  skillshotType?: SkillshotType;
  radius?: number;
  speed?: number;
  castTime?: number; // ms
  isSummonerSpell?: boolean;
}

// --- Match Config ---
export interface MatchConfig {
  mode: MatchMode;
  mapName: string;
  gameTimeLimit: number; // ms
  creepSpawnInterval: number; // ms
  creepWaveSize: number;
  towerRange: number;
  towerAttackSpeed: number;
  nexusHealth: number;
  towerHealth: number;
  startingGold: number;
  startingLevel: number;
  xpPerKill: number;
  goldPerKill: number;
  goldPerAssist: number;
  goldPerMinion: number;
}

// --- Match State (full game state) ---
export interface MatchStateData {
  matchId: string;
  mode: MatchMode;
  state: MatchState;
  gameTime: number; // ms elapsed
  playerChampion: ChampionEntity;
  enemyChampions: ChampionEntity[];
  creeps: CreepEntity[];
  towers: Tower[];
  nexuses: Nexus[];
  lanes: Lane[];
  waves: Wave[];
  skillshots: Skillshot[];
  cooldownManagers: Map<string, CooldownManager>;
  matchResult: MatchResult | null;
  playerKills: number;
  playerDeaths: number;
  playerAssists: number;
  playerGold: number;
  playerLevel: number;
  playerXP: number;
  elapsedTime: number; // seconds
}

// --- Input Command ---
export interface InputCommand {
  type: 'move' | 'attack' | 'ability' | 'stop' | 'hold' | 'recall';
  position?: Vector2D;
  targetId?: string;
  abilityKey?: 'Q' | 'W' | 'E' | 'R';
  isShiftQueue?: boolean;
}

// --- Match Event ---
export interface MatchEvent {
  type: 'champion_kill' | 'tower_destroyed' | 'nexus_destroyed' | 'creep_spawn' | 'level_up' | 'item_purchased';
  timestamp: number;
  data: Record<string, unknown>;
}

