// ============================================
// Obsidian Arena — Vector Engine (Skillshots)
// ============================================

import type { Vector2D, Skillshot, SkillshotType, CombatEntity } from './types';

// --- Utility: Euclidean distance ---
export const calculateDistance = (a: Vector2D, b: Vector2D): number => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};

// --- Utility: Normalize vector ---
export const normalizeVector = (v: Vector2D): Vector2D => {
  const length = Math.sqrt(v.x * v.x + v.y * v.y);
  if (length === 0) return { x: 0, y: 0 };
  return { x: v.x / length, y: v.y / length };
};

// --- Utility: Vector from origin to target ---
export const vectorToTarget = (origin: Vector2D, target: Vector2D): Vector2D => {
  return { x: target.x - origin.x, y: target.y - origin.y };
};

// --- Calculate skillshot trajectory ---
export const calculateSkillshotTrajectory = (
  origin: Vector2D,
  target: Vector2D,
  speed: number,
  type: SkillshotType = 'line',
  radius: number = 20,
  range: number = 500,
  damage: number = 50,
  casterId: string = ''
): Skillshot => {
  const direction = normalizeVector(vectorToTarget(origin, target));
  const maxLifetime = (range / speed) * 1000; // ms

  return {
    id: `skillshot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    origin: { ...origin },
    position: { ...origin },
    direction,
    speed,
    radius,
    range,
    damage,
    casterId,
    isActive: true,
    lifetime: maxLifetime,
    maxLifetime,
    traveledDistance: 0,
  };
};

// --- Update skillshot position (call each frame) ---
export const updateSkillshotPosition = (
  skillshot: Skillshot,
  deltaTime: number
): Skillshot => {
  if (!skillshot.isActive) return skillshot;

  const deltaSeconds = deltaTime / 1000;
  const step = skillshot.speed * deltaSeconds;

  const newPosition: Vector2D = {
    x: skillshot.position.x + skillshot.direction.x * step,
    y: skillshot.position.y + skillshot.direction.y * step,
  };

  const newTraveled = skillshot.traveledDistance + step;
  const newLifetime = skillshot.lifetime - deltaTime;

  return {
    ...skillshot,
    position: newPosition,
    traveledDistance: newTraveled,
    lifetime: newLifetime,
    isActive: newTraveled < skillshot.range && newLifetime > 0,
  };
};

// --- Check collision between skillshot and entities ---
export const checkSkillshotCollision = (
  skillshot: Skillshot,
  entities: CombatEntity[]
): CombatEntity[] => {
  if (!skillshot.isActive) return [];

  return entities.filter((entity) => {
    if (!entity.isAlive) return false;
    if (entity.id === skillshot.casterId) return false;

    const distance = calculateDistance(skillshot.position, entity.position);
    return distance <= skillshot.radius + 15; // 15 = entity hitbox radius
  });
};

// --- Calculate cone area vertices ---
export const calculateConeArea = (
  origin: Vector2D,
  direction: Vector2D,
  angle: number,
  range: number
): Vector2D[] => {
  const halfAngle = (angle / 2) * (Math.PI / 180);
  const dirAngle = Math.atan2(direction.y, direction.x);

  const leftAngle = dirAngle - halfAngle;
  const rightAngle = dirAngle + halfAngle;

  const leftPoint: Vector2D = {
    x: origin.x + Math.cos(leftAngle) * range,
    y: origin.y + Math.sin(leftAngle) * range,
  };

  const rightPoint: Vector2D = {
    x: origin.x + Math.cos(rightAngle) * range,
    y: origin.y + Math.sin(rightAngle) * range,
  };

  return [origin, leftPoint, rightPoint];
};

// --- Check if point is inside circle ---
export const isPointInCircle = (
  point: Vector2D,
  center: Vector2D,
  radius: number
): boolean => {
  return calculateDistance(point, center) <= radius;
};

// --- Check if point is inside cone ---
export const isPointInCone = (
  point: Vector2D,
  origin: Vector2D,
  direction: Vector2D,
  angle: number,
  range: number
): boolean => {
  const distance = calculateDistance(origin, point);
  if (distance > range) return false;

  const pointDir = normalizeVector(vectorToTarget(origin, point));
  const dot = direction.x * pointDir.x + direction.y * pointDir.y;
  const cosHalfAngle = Math.cos((angle / 2) * (Math.PI / 180));

  return dot >= cosHalfAngle;
};
