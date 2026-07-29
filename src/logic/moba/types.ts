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
