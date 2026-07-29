// ============================================
// Obsidian Arena — Battle Engine Logic
// ============================================

import type { Character } from '../types';

export interface Combatant extends Character {
  currentHealth: number;
  cooldowns: { [abilityId: string]: number };
}

export interface BattleLogEntry {
  turn: number;
  attackerName: string;
  defenderName: string;
  damageDealt: number;
  isCritical: boolean;
  message: string;
  defenderHealthRemaining: number;
}

export interface BattleResult {
  winnerId: string;
  loserId: string;
  log: BattleLogEntry[];
  playerXPGained: number;
  playerObsidianGained: number;
}

// --- Configuration for enemy generation ---
export const ARENA_CONFIG = {
  // Example Arena: Fiery Arena
  fieryArena: {
    baseLevel: 10,
    levelVariance: 3,
    baseHealthMultiplier: 1.5,
    baseAttackMultiplier: 1.2,
    baseDefenseMultiplier: 1.1,
    baseSpeedMultiplier: 1.0,
    xpReward: 150,
    obsidianReward: 25,
  },
  // Add more arenas here...
};

// --- Generate Enemy Bot ---
export const generateEnemy = (playerCharacter: Character, arenaId: string): Combatant => {
  const config = ARENA_CONFIG[arenaId as keyof typeof ARENA_CONFIG] || ARENA_CONFIG.fieryArena;

  const enemyLevel = Math.max(
    1,
    config.baseLevel + Math.floor(Math.random() * config.levelVariance * 2) - config.levelVariance
  );

  const enemy: Combatant = {
    ...playerCharacter, // Copy structure
    id: `bot-${Date.now()}`,
    name: `Враг (${arenaId})`,
    level: enemyLevel,
    experience: enemyLevel * 100, // Just for display
    currentHealth: Math.round(playerCharacter.maxHealth * config.baseHealthMultiplier),
    maxHealth: Math.round(playerCharacter.maxHealth * config.baseHealthMultiplier),
    attack: Math.round(playerCharacter.attack * config.baseAttackMultiplier),
    defense: Math.round(playerCharacter.defense * config.baseDefenseMultiplier),
    speed: Math.round(playerCharacter.speed * config.baseSpeedMultiplier),
    imageUrl: `https://placehold.co/300x400/800000/ffffff?text=BOT`,
    description: `Опасный противник с ${arenaId}`,
    isSelected: false,
    cooldowns: {},
  };

  return enemy;
};

// --- Combat Logic ---
export const performBattle = (
  playerCharacter: Character,
  enemyBot: Combatant,
  arenaId: string
): BattleResult => {
  const log: BattleLogEntry[] = [];
  let turn = 0;

  let player: Combatant = { ...playerCharacter, currentHealth: playerCharacter.maxHealth, cooldowns: {} };
  let enemy: Combatant = { ...enemyBot };

  const getDamage = (attacker: Combatant, defender: Combatant): { damage: number; isCritical: boolean } => {
    const criticalChance = 0.15; // 15% critical chance
    const criticalMultiplier = 1.5; // 1.5x critical damage

    let rawDamage = attacker.attack;
    let isCritical = Math.random() < criticalChance;

    if (isCritical) {
      rawDamage = Math.round(rawDamage * criticalMultiplier);
    }

    const damage = Math.max(5, Math.round(rawDamage * (100 / (100 + defender.defense))));
    return { damage, isCritical };
  };

  const attack = (attacker: Combatant, defender: Combatant, turn: number): BattleLogEntry => {
    const { damage, isCritical } = getDamage(attacker, defender);
    defender.currentHealth = Math.max(0, defender.currentHealth - damage);

    const message = isCritical
      ? `${attacker.name} наносит КРИТИЧЕСКИЙ удар по ${defender.name} на ${damage} урона!`
      : `${attacker.name} наносит удар по ${defender.name} на ${damage} урона.`;

    return {
      turn,
      attackerName: attacker.name,
      defenderName: defender.name,
      damageDealt: damage,
      isCritical,
      message,
      defenderHealthRemaining: defender.currentHealth,
    };
  };

  // Determine who goes first
  let currentAttacker = player.speed >= enemy.speed ? player : enemy;
  let currentDefender = currentAttacker === player ? enemy : player;

  // Main battle loop
  while (player.currentHealth > 0 && enemy.currentHealth > 0 && turn < 100) { // Max 100 turns to prevent infinite loop
    turn++;

    // Decrement cooldowns
    for (const abilityId in player.cooldowns) {
      if (player.cooldowns[abilityId] > 0) {
        player.cooldowns[abilityId]--;
      }
    }
    for (const abilityId in enemy.cooldowns) {
      if (enemy.cooldowns[abilityId] > 0) {
        enemy.cooldowns[abilityId]--;
      }
    }

    // Attacker's turn
    log.push(attack(currentAttacker, currentDefender, turn));
    if (currentDefender.currentHealth <= 0) break;

    // Swap roles for next turn
    [currentAttacker, currentDefender] = [currentDefender, currentAttacker];
  }

  const winner = player.currentHealth > 0 ? player : enemy;
  const loser = winner === player ? enemy : player;

  const xpReward = ARENA_CONFIG[arenaId as keyof typeof ARENA_CONFIG]?.xpReward || 0;
  const obsidianReward = ARENA_CONFIG[arenaId as keyof typeof ARENA_CONFIG]?.obsidianReward || 0;

  return {
    winnerId: winner.id,
    loserId: loser.id,
    log,
    playerXPGained: winner.id === player.id ? xpReward : 0,
    playerObsidianGained: winner.id === player.id ? obsidianReward : 0,
  };
};
