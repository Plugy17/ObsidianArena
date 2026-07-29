// ============================================
// Obsidian Arena — Targeting System
// ============================================

import type { Vector2D, CombatEntity, TargetPriority } from './types';
import { calculateDistance } from './vectorEngine';

// --- Select priority target based on priority type ---
export const selectPriorityTarget = (
  entities: CombatEntity[],
  priority: TargetPriority,
  origin?: Vector2D
): CombatEntity | null => {
  const aliveEnemies = entities.filter(
    (e) => e.isAlive && e.team === 'enemy'
  );

  if (aliveEnemies.length === 0) return null;

  switch (priority) {
    case 'low_hp_champion': {
      // Find enemy champion with lowest HP percentage
      const champions = aliveEnemies.filter((e) => e.entityType === 'champion');
      if (champions.length === 0) {
        // Fallback to any enemy
        return findClosestEntity(origin, aliveEnemies);
      }
      return champions.reduce((lowest, current) => {
        const lowestPercent = lowest.health / lowest.maxHealth;
        const currentPercent = current.health / current.maxHealth;
        return currentPercent < lowestPercent ? current : lowest;
      });
    }

    case 'champion': {
      const champions = aliveEnemies.filter((e) => e.entityType === 'champion');
      if (champions.length === 0) {
        return findClosestEntity(origin, aliveEnemies);
      }
      return findClosestEntity(origin, champions);
    }

    case 'creep': {
      const creeps = aliveEnemies.filter((e) => e.entityType === 'creep');
      if (creeps.length === 0) {
        return findClosestEntity(origin, aliveEnemies);
      }
      return findClosestEntity(origin, creeps);
    }

    default:
      return findClosestEntity(origin, aliveEnemies);
  }
};

// --- Get entities within a given range from origin ---
export const getEntitiesInRange = (
  origin: Vector2D,
  entities: CombatEntity[],
  range: number
): CombatEntity[] => {
  return entities.filter((entity) => {
    if (!entity.isAlive) return false;
    const distance = calculateDistance(origin, entity.position);
    return distance <= range;
  });
};

// --- Find closest entity to a point ---
export const findClosestEntity = (
  origin: Vector2D | undefined,
  entities: CombatEntity[]
): CombatEntity | null => {
  if (!origin || entities.length === 0) return entities[0] || null;

  return entities.reduce((closest, current) => {
    const closestDist = calculateDistance(origin, closest.position);
    const currentDist = calculateDistance(origin, current.position);
    return currentDist < closestDist ? current : closest;
  });
};

// --- Get entities in a line (for line skillshots) ---
export const getEntitiesInLine = (
  origin: Vector2D,
  direction: Vector2D,
  entities: CombatEntity[],
  width: number,
  range: number
): CombatEntity[] => {
  return entities.filter((entity) => {
    if (!entity.isAlive) return false;

    // Project entity position onto the line direction
    const toEntity = {
      x: entity.position.x - origin.x,
      y: entity.position.y - origin.y,
    };

    const dot = toEntity.x * direction.x + toEntity.y * direction.y;
    if (dot < 0 || dot > range) return false;

    // Calculate perpendicular distance
    const projX = origin.x + direction.x * dot;
    const projY = origin.y + direction.y * dot;
    const perpDist = calculateDistance(entity.position, { x: projX, y: projY });

    return perpDist <= width / 2;
  });
};
