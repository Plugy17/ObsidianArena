// ============================================
// Obsidian Arena — Cooldown Manager
// ============================================

import type { CooldownManager, CooldownState } from './types';

// --- Create a new CooldownManager from ability list ---
export const createCooldownManager = (
  abilityIds: string[],
  cooldowns: number[] // ms per ability, same order as abilityIds
): CooldownManager => {
  const cooldownMap = new Map<string, CooldownState>();

  abilityIds.forEach((id, index) => {
    cooldownMap.set(id, {
      abilityId: id,
      maxCooldown: cooldowns[index] || 0,
      remainingCooldown: 0,
      isReady: true,
    });
  });

  return { cooldowns: cooldownMap };
};

// --- Try to use an ability. Returns true if successful. ---
export const useAbility = (
  manager: CooldownManager,
  abilityId: string
): boolean => {
  const state = manager.cooldowns.get(abilityId);
  if (!state) return false;
  if (!state.isReady) return false;

  state.remainingCooldown = state.maxCooldown;
  state.isReady = false;

  return true;
};

// --- Tick all cooldowns (call each frame) ---
export const tickCooldowns = (
  manager: CooldownManager,
  deltaTime: number
): CooldownManager => {
  const newCooldowns = new Map<string, CooldownState>();

  manager.cooldowns.forEach((state, abilityId) => {
    if (state.isReady) {
      newCooldowns.set(abilityId, { ...state });
      return;
    }

    const newRemaining = Math.max(0, state.remainingCooldown - deltaTime);
    const isReady = newRemaining <= 0;

    newCooldowns.set(abilityId, {
      ...state,
      remainingCooldown: newRemaining,
      isReady,
    });
  });

  return { cooldowns: newCooldowns };
};

// --- Get cooldown state for a specific ability ---
export const getCooldownState = (
  manager: CooldownManager,
  abilityId: string
): CooldownState | null => {
  return manager.cooldowns.get(abilityId) || null;
};

// --- Check if an ability is ready ---
export const isAbilityReady = (
  manager: CooldownManager,
  abilityId: string
): boolean => {
  const state = manager.cooldowns.get(abilityId);
  return state?.isReady ?? false;
};

// --- Get cooldown progress (0..1) for UI display ---
export const getCooldownProgress = (
  manager: CooldownManager,
  abilityId: string
): number => {
  const state = manager.cooldowns.get(abilityId);
  if (!state || state.isReady) return 0;
  return state.remainingCooldown / state.maxCooldown;
};

// --- Get remaining cooldown in seconds for display ---
export const getCooldownRemainingSeconds = (
  manager: CooldownManager,
  abilityId: string
): number => {
  const state = manager.cooldowns.get(abilityId);
  if (!state || state.isReady) return 0;
  return Math.ceil(state.remainingCooldown / 1000);
};

// --- Reset all cooldowns ---
export const resetCooldowns = (manager: CooldownManager): CooldownManager => {
  const newCooldowns = new Map<string, CooldownState>();

  manager.cooldowns.forEach((state, abilityId) => {
    newCooldowns.set(abilityId, {
      ...state,
      remainingCooldown: 0,
      isReady: true,
    });
  });

  return { cooldowns: newCooldowns };
};
