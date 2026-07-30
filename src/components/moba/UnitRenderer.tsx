// ============================================
// Obsidian Arena — Unit Renderer
// ============================================

import type {
  Vector2D,
  ChampionEntity,
  CreepEntity,
  Tower,
  Nexus,
  Skillshot,
} from '../../logic/moba/types';

// --- Color definitions ---
const COLORS = {
  player: {
    champion: '#8a2be2',
    creep: '#3b82f6',
    tower: '#4f46e5',
    nexus: '#7c3aed',
    healthBar: '#4ade80',
  },
  enemy: {
    champion: '#ef4444',
    creep: '#f97316',
    tower: '#dc2626',
    nexus: '#b91c1c',
    healthBar: '#f87171',
  },
  neutral: {
    champion: '#f59e0b',
    creep: '#f59e0b',
    tower: '#f59e0b',
    nexus: '#f59e0b',
    healthBar: '#fbbf24',
  },
  skillshot: '#06b6d4',
  path: 'rgba(138, 43, 226, 0.3)',
  grid: 'rgba(138, 43, 226, 0.1)',
  lane: 'rgba(218, 165, 32, 0.15)',
};

// --- Draw health bar ---
export const drawHealthBar = (
  ctx: CanvasRenderingContext2D,
  position: Vector2D,
  health: number,
  maxHealth: number,
  width: number = 50,
  team: 'player' | 'enemy' | 'neutral' = 'player'
): void => {
  const height = 6;
  const x = position.x - width / 2;
  const y = position.y - 35;

  const healthPercent = Math.max(0, health / maxHealth);
  const barColor = COLORS[team].healthBar;

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(x, y, width, height);

  // Health fill
  ctx.fillStyle = barColor;
  ctx.fillRect(x, y, width * healthPercent, height);

  // Border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);
};

// --- Draw champion ---
export const drawChampion = (
  ctx: CanvasRenderingContext2D,
  champion: ChampionEntity,
  isSelected: boolean = false
): void => {
  const pos = champion.position;
  const radius = 16;
  const color = COLORS[champion.team].champion;

  // Draw body
  const gradient = ctx.createRadialGradient(
    pos.x - radius / 3,
    pos.y - radius / 3,
    2,
    pos.x,
    pos.y,
    radius
  );
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, '#000');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Selection ring
  if (isSelected) {
    ctx.strokeStyle = '#daa520';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius + 6, 0, Math.PI * 2);
    ctx.stroke();

    // Pulsing effect
    const pulseSize = radius + 8 + Math.sin(Date.now() / 500) * 3;
    ctx.strokeStyle = 'rgba(218, 165, 32, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, pulseSize, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Draw name
  ctx.fillStyle = '#fff';
  ctx.font = '11px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(champion.name, pos.x, pos.y - radius - 18);

  // Draw level
  ctx.fillStyle = '#daa520';
  ctx.font = '10px Inter, sans-serif';
  ctx.fillText(`Lvl ${champion.level}`, pos.x, pos.y + radius + 12);

  // Health bar
  drawHealthBar(ctx, pos, champion.health, champion.maxHealth, 60, champion.team);

  // Death timer
  if (!champion.isAlive && champion.respawnTime > 0) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(pos.x - 25, pos.y - 10, 50, 16);
    ctx.fillStyle = '#fff';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    const respawnSec = Math.ceil(champion.respawnTime / 1000);
    ctx.fillText(`${respawnSec}s`, pos.x, pos.y + 4);
  }
};

// --- Draw creep ---
export const drawCreep = (
  ctx: CanvasRenderingContext2D,
  creep: CreepEntity
): void => {
  if (!creep.isAlive) return;

  const pos = creep.position;
  const radius = creep.creepType === 'siege' ? 14 : 10;
  const color = COLORS[creep.team].creep;

  // Draw body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Border
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Creep type indicator
  if (creep.creepType === 'siege') {
    ctx.fillStyle = '#fff';
    ctx.font = '8px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('S', pos.x, pos.y + 3);
  }

  // Health bar
  drawHealthBar(ctx, pos, creep.health, creep.maxHealth, 30, creep.team);
};

// --- Draw tower ---
export const drawTower = (
  ctx: CanvasRenderingContext2D,
  tower: Tower
): void => {
  if (!tower.isAlive) return;

  const pos = tower.position;
  const size = 20;
  const color = COLORS[tower.team].tower;

  // Draw tower body
  ctx.fillStyle = color;
  ctx.fillRect(pos.x - size / 2, pos.y - size / 2, size, size);

  // Border
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.strokeRect(pos.x - size / 2, pos.y - size / 2, size, size);

  // Tower tier indicator
  ctx.fillStyle = '#fff';
  ctx.font = '10px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`T${tower.tier}`, pos.x, pos.y + 3);

  // Attack range (if targeting)
  if (tower.targetId) {
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, tower.range, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Health bar
  drawHealthBar(ctx, pos, tower.health, tower.maxHealth, 50, tower.team);
};

// --- Draw nexus ---
export const drawNexus = (
  ctx: CanvasRenderingContext2D,
  nexus: Nexus
): void => {
  if (!nexus.isAlive) return;

  const pos = nexus.position;
  const radius = nexus.radius;
  const color = COLORS[nexus.team].nexus;

  // Draw nexus body
  const gradient = ctx.createRadialGradient(
    pos.x - radius / 3,
    pos.y - radius / 3,
    2,
    pos.x,
    pos.y,
    radius
  );
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, '#000');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Border
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Draw name
  ctx.fillStyle = '#fff';
  ctx.font = '12px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    nexus.team === 'player' ? 'Нексус Игрока' : 'Вражеский Нексус',
    pos.x,
    pos.y - radius - 10
  );

  // Health bar
  drawHealthBar(ctx, pos, nexus.health, nexus.maxHealth, 80, nexus.team);
};

// --- Draw skillshot ---
export const drawSkillshot = (
  ctx: CanvasRenderingContext2D,
  skillshot: Skillshot
): void => {
  if (!skillshot.isActive) return;

  const pos = skillshot.position;
  const origin = skillshot.origin;

  // Draw trail
  ctx.strokeStyle = COLORS.skillshot;
  ctx.lineWidth = skillshot.radius * 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();

  // Draw glow
  ctx.shadowColor = COLORS.skillshot;
  ctx.shadowBlur = 10;
  ctx.fillStyle = COLORS.skillshot;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, skillshot.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
};

// --- Draw lane paths ---
export const drawLanePaths = (
  ctx: CanvasRenderingContext2D,
  lanes: { playerPath: Vector2D[]; enemyPath: Vector2D[]; playerNexus: Vector2D; enemyNexus: Vector2D }[]
): void => {
  ctx.strokeStyle = COLORS.path;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';

  for (const lane of lanes) {
    // Player path
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(lane.playerNexus.x, lane.playerNexus.y);
    for (const point of lane.playerPath) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();

    // Enemy path
    ctx.strokeStyle = 'rgba(218, 165, 32, 0.3)';
    ctx.beginPath();
    ctx.moveTo(lane.enemyNexus.x, lane.enemyNexus.y);
    for (const point of lane.enemyPath) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();
  }

  ctx.setLineDash([]);
};

// --- Draw targeting line ---
export const drawTargetingLine = (
  ctx: CanvasRenderingContext2D,
  from: Vector2D,
  to: Vector2D
): void => {
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 2;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.setLineDash([]);
};

// --- Draw range indicator ---
export const drawRangeIndicator = (
  ctx: CanvasRenderingContext2D,
  center: Vector2D,
  range: number
): void => {
  ctx.strokeStyle = 'rgba(138, 43, 226, 0.4)';
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 2]);
  ctx.beginPath();
  ctx.arc(center.x, center.y, range, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
};
