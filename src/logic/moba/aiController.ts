// ============================================
// Obsidian Arena — AI Controller
// ============================================

import type {
  ChampionEntity,
  CreepEntity,
  Tower,
  Nexus,
  CombatEntity,
  InputCommand,
} from './types';
import { calculateDistance } from './vectorEngine';

// --- AI Difficulty Levels ---
export type AIDifficulty = 'easy' | 'normal' | 'hard';

// --- AI State ---
export interface AIState {
  targetId: string | null;
  lastActionTime: number;
  actionCooldown: number; // ms between actions
  pathIndex: number;
  mode: 'aggressive' | 'defensive' | 'farming';
}

// --- AI Config ---
export interface AIConfig {
  difficulty: AIDifficulty;
  reactionTime: number; // ms delay before acting
  actionInterval: number; // ms between actions
  aggression: number; // 0..1, higher = more aggressive
  farming: number; // 0..1, higher = more likely to farm
}

// --- Default AI Configs ---
export const AI_CONFIGS: Record<AIDifficulty, AIConfig> = {
  easy: {
    difficulty: 'easy',
    reactionTime: 800,
    actionInterval: 2000,
    aggression: 0.3,
    farming: 0.7,
  },
  normal: {
    difficulty: 'normal',
    reactionTime: 400,
    actionInterval: 1000,
    aggression: 0.5,
    farming: 0.5,
  },
  hard: {
    difficulty: 'hard',
    reactionTime: 100,
    actionInterval: 500,
    aggression: 0.8,
    farming: 0.2,
  },
};

// --- AI Controller Class ---
export class AIController {
  private champion: ChampionEntity;
  private config: AIConfig;
  private state: AIState;
  private allChampions: ChampionEntity[];
  private allCreeps: CreepEntity[];
  private allTowers: Tower[];
  private allNexuses: Nexus[];

  constructor(
    champion: ChampionEntity,
    config: AIConfig,
    champions: ChampionEntity[],
    creeps: CreepEntity[],
    towers: Tower[],
    nexuses: Nexus[]
  ) {
    this.champion = champion;
    this.config = config;
    this.allChampions = champions;
    this.allCreeps = creeps;
    this.allTowers = towers;
    this.allNexuses = nexuses;

    this.state = {
      targetId: null,
      lastActionTime: 0,
      actionCooldown: 0,
      pathIndex: 0,
      mode: 'farming',
    };
  }

  // --- Update AI state ---
  update(gameTime: number, deltaTime: number): InputCommand | null {
    if (!this.champion.isAlive) return null;

    this.state.actionCooldown -= deltaTime;
    if (this.state.actionCooldown > 0) return null;

    this.state.actionCooldown = this.config.actionInterval;
    this.state.lastActionTime = gameTime;

    // Determine mode based on aggression
    if (Math.random() < this.config.aggression) {
      this.state.mode = 'aggressive';
    } else {
      this.state.mode = Math.random() < this.config.farming ? 'farming' : 'defensive';
    }

    // Find target based on mode
    const target = this.findTarget();
    if (target) {
      this.state.targetId = target.id;

      const dist = calculateDistance(this.champion.position, target.position);

      if (dist > this.champion.attackRange) {
        // Move towards target
        return {
          type: 'move',
          position: target.position,
        };
      } else {
        // Attack target
        return {
          type: 'attack',
          targetId: target.id,
        };
      }
    }

    // If no target, farm or move to lane
    return this.farmOrMoveToLane();
  }

  // --- Find target based on AI mode ---
  private findTarget(): CombatEntity | null {
    switch (this.state.mode) {
      case 'aggressive':
        return this.findAggressiveTarget();
      case 'defensive':
        return this.findDefensiveTarget();
      case 'farming':
        return this.findFarmTarget();
      default:
        return this.findAggressiveTarget();
    }
  }

  // --- Find aggressive target (prioritize player champion) ---
  private findAggressiveTarget(): CombatEntity | null {
    // Priority: player champion > enemy creeps > enemy structures
    const player = this.allChampions.find(
      c => c.team !== this.champion.team && c.isAlive && c.isPlayerControlled
    );
    if (player) {
      const dist = calculateDistance(this.champion.position, player.position);
      if (dist < 1200) return player;
    }

    // Find nearest enemy creep
    const nearestCreep = this.findNearestEnemyCreep();
    if (nearestCreep) return nearestCreep;

    // Find nearest enemy structure
    const nearestStructure = this.findNearestEnemyStructure();
    if (nearestStructure) return nearestStructure;

    return null;
  }

  // --- Find defensive target (prioritize creeps and towers) ---
  private findDefensiveTarget(): CombatEntity | null {
    // Priority: enemy creeps > enemy towers > player champion
    const nearestCreep = this.findNearestEnemyCreep();
    if (nearestCreep) return nearestCreep;

    const nearestTower = this.findNearestEnemyTower();
    if (nearestTower) return nearestTower;

    const player = this.allChampions.find(
      c => c.team !== this.champion.team && c.isAlive && c.isPlayerControlled
    );
    if (player) {
      const dist = calculateDistance(this.champion.position, player.position);
      if (dist < 800) return player;
    }

    return null;
  }

  // --- Find farming target (prioritize creeps near death) ---
  private findFarmTarget(): CombatEntity | null {
    // Find enemy creep with lowest HP percentage
    let lowest: { entity: CreepEntity; percent: number } | null = null;

    for (const creep of this.allCreeps) {
      if (creep.team !== this.champion.team && creep.isAlive) {
        const percent = creep.health / creep.maxHealth;
        if (!lowest || percent < lowest.percent) {
          lowest = { entity: creep, percent };
        }
      }
    }

    if (lowest && lowest.percent < 0.5) return lowest.entity;

    // If no low-HP creep, find nearest enemy creep
    return this.findNearestEnemyCreep();
  }

  // --- Find nearest enemy creep ---
  private findNearestEnemyCreep(): CreepEntity | null {
    let nearest: { entity: CreepEntity; dist: number } | null = null;

    for (const creep of this.allCreeps) {
      if (creep.team !== this.champion.team && creep.isAlive) {
        const dist = calculateDistance(this.champion.position, creep.position);
        if (!nearest || dist < nearest.dist) {
          nearest = { entity: creep, dist };
        }
      }
    }

    return nearest ? nearest.entity : null;
  }

  // --- Find nearest enemy tower ---
  private findNearestEnemyTower(): CombatEntity | null {
    let nearest: { entity: Tower; dist: number } | null = null;

    for (const tower of this.allTowers) {
      if (tower.team !== this.champion.team && tower.isAlive) {
        const dist = calculateDistance(this.champion.position, tower.position);
        if (!nearest || dist < nearest.dist) {
          nearest = { entity: tower, dist };
        }
      }
    }

    return nearest ? (nearest.entity as unknown as CombatEntity) : null;
  }

  // --- Find nearest enemy structure (tower or nexus) ---
  private findNearestEnemyStructure(): CombatEntity | null {
    let nearest: { entity: CombatEntity; dist: number } | null = null;

    for (const tower of this.allTowers) {
      if (tower.team !== this.champion.team && tower.isAlive) {
        const dist = calculateDistance(this.champion.position, tower.position);
        if (!nearest || dist < nearest.dist) {
          nearest = { entity: tower as unknown as CombatEntity, dist };
        }
      }
    }

    for (const nexus of this.allNexuses) {
      if (nexus.team !== this.champion.team && nexus.isAlive) {
        const dist = calculateDistance(this.champion.position, nexus.position);
        if (!nearest || dist < nearest.dist) {
          nearest = { entity: nexus as unknown as CombatEntity, dist };
        }
      }
    }

    return nearest ? nearest.entity : null;
  }

  // --- Farm or move to lane ---
  private farmOrMoveToLane(): InputCommand | null {
    // Move towards nearest lane (simplified: move towards enemy structures)
    const nearestStructure = this.findNearestEnemyStructure();
    if (nearestStructure) {
      return {
        type: 'move',
        position: nearestStructure.position,
      };
    }

    return null;
  }

  // --- Update entity lists (call each frame) ---
  updateEntities(
    champions: ChampionEntity[],
    creeps: CreepEntity[],
    towers: Tower[],
    nexuses: Nexus[]
  ): void {
    this.allChampions = champions;
    this.allCreeps = creeps;
    this.allTowers = towers;
    this.allNexuses = nexuses;
  }

  // --- Get AI state ---
  getState(): AIState {
    return { ...this.state };
  }

  // --- Set AI mode ---
  setMode(mode: 'aggressive' | 'defensive' | 'farming'): void {
    this.state.mode = mode;
  }
}

// --- Create AI controller for a champion ---
export const createAIController = (
  champion: ChampionEntity,
  difficulty: AIDifficulty,
  champions: ChampionEntity[],
  creeps: CreepEntity[],
  towers: Tower[],
  nexuses: Nexus[]
): AIController => {
  return new AIController(
    champion,
    AI_CONFIGS[difficulty],
    champions,
    creeps,
    towers,
    nexuses
  );
};

// --- Tower AI: find target for tower ---
export const getTowerTarget = (
  tower: Tower,
  champions: ChampionEntity[],
  creeps: CreepEntity[]
): string | null => {
  // Priority: enemy creeps > enemy champions
  let nearest: { id: string; dist: number } | null = null;

  // Check creeps
  for (const creep of creeps) {
    if (creep.team !== tower.team && creep.isAlive) {
      const dist = calculateDistance(tower.position, creep.position);
      if (dist <= tower.range) {
        if (!nearest || dist < nearest.dist) {
          nearest = { id: creep.id, dist };
        }
      }
    }
  }

  // Check champions
  for (const champ of champions) {
    if (champ.team !== tower.team && champ.isAlive) {
      const dist = calculateDistance(tower.position, champ.position);
      if (dist <= tower.range) {
        if (!nearest || dist < nearest.dist) {
          nearest = { id: champ.id, dist };
        }
      }
    }
  }

  return nearest ? nearest.id : null;
};

// --- Creep AI: find target for creep ---
export const getCreepTarget = (
  creep: CreepEntity,
  champions: ChampionEntity[],
  creeps: CreepEntity[],
  towers: Tower[],
  nexuses: Nexus[]
): string | null => {
  // Priority: nearest enemy (any type)
  let nearest: { id: string; dist: number } | null = null;

  // Check champions
  for (const champ of champions) {
    if (champ.team !== creep.team && champ.isAlive) {
      const dist = calculateDistance(creep.position, champ.position);
      if (!nearest || dist < nearest.dist) {
        nearest = { id: champ.id, dist };
      }
    }
  }

  // Check other creeps
  for (const other of creeps) {
    if (other.team !== creep.team && other.isAlive) {
      const dist = calculateDistance(creep.position, other.position);
      if (!nearest || dist < nearest.dist) {
        nearest = { id: other.id, dist };
      }
    }
  }

  // Check towers
  for (const tower of towers) {
    if (tower.team !== creep.team && tower.isAlive) {
      const dist = calculateDistance(creep.position, tower.position);
      if (!nearest || dist < nearest.dist) {
        nearest = { id: tower.id, dist };
      }
    }
  }

  // Check nexuses
  for (const nexus of nexuses) {
    if (nexus.team !== creep.team && nexus.isAlive) {
      const dist = calculateDistance(creep.position, nexus.position);
      if (!nearest || dist < nearest.dist) {
        nearest = { id: nexus.id, dist };
      }
    }
  }

  return nearest ? nearest.id : null;
};
