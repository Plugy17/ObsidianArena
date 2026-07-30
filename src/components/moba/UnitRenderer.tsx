// ============================================
// Obsidian Arena — Unit Renderer (LoL: Wild Rift Style)
// ============================================

import type {
  Vector2D,
  ChampionEntity,
  CreepEntity,
  Tower,
  Nexus,
  CombatEntity,
  Skillshot,
} from '../../logic/moba/types';

// --- Color definitions (Wild Rift palette) ---
const COLORS = {
  player: {
    champion: '#8a2be2',
    creep: '#4f9ef7',
    tower: '#5c6bc0',
    nexus: '#7e57c2',
    healthBar: '#4caf50',
  },
  enemy: {
    champion: '#ff5252',
    creep: '#ff9800',
    tower: '#e53935',
    nexus: '#c62828',
    healthBar: '#ff5252',
  },
  neutral: {
    champion: '#ffeb3b',
    creep: '#ffeb3b',
    tower: '#ffeb3b',
    nexus: '#ffeb3b',
    healthBar: '#ffeb3b',
  },
  skillshot: '#00e5ff',
  path: 'rgba(138, 43, 226, 0.25)',
  grid: 'rgba(138, 43, 226, 0.08)',
  lane: 'rgba(218, 165, 32, 0.12)',
};

// --- Draw health bar (Wild Rift style) ---
export const drawHealthBar = (
  ctx: CanvasRenderingContext2D,
  position: Vector2D,
  health: number,
  maxHealth: number,
  width: number = 50,
  team: 'player' | 'enemy' | 'neutral' = 'player'
): void => {
  const height = 7;
  const x = position.x - width / 2;
  const y = position.y - 38;

  const healthPercent = Math.max(0, health / maxHealth);
  const barColor = COLORS[team].healthBar;

  // Background with border
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x, y, width, height);

  // Health fill with gradient
  const gradient = ctx.createLinearGradient(x, y, x + width * healthPercent, y);
  gradient.addColorStop(0, barColor);
  gradient.addColorStop(1, '#000');
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width * healthPercent, height);

  // Highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fillRect(x, y, width * healthPercent, height / 2);
};

// --- Draw champion (Wild Rift style) ---
export const drawChampion = (
  ctx: CanvasRenderingContext2D,
  champion: ChampionEntity,
  isSelected: boolean = false
): void => {
  if (!champion.isAlive) {
    // Draw death indicator
    if (champion.respawnTime > 0) {
      const respawnSec = Math.ceil(champion.respawnTime / 1000);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${respawnSec}s`, champion.position.x, champion.position.y + 5);
    }
    return;
  }

  const pos = champion.position;
  const radius = 18;
  const color = COLORS[champion.team].champion;

  // Drop shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;

  // Body with gradient
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

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Border
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Selection ring
  if (isSelected) {
    const pulse = Math.sin(Date.now() / 500) * 3;
    ctx.strokeStyle = '#daa520';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius + 8 + pulse, 0, Math.PI * 2);
    ctx.stroke();

    // Outer glow
    ctx.shadowColor = '#daa520';
    ctx.shadowBlur = 15;
    ctx.strokeStyle = 'rgba(218, 165, 32, 0.3)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius + 12 + pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Name
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(champion.name, pos.x, pos.y - radius - 22);

  // Level badge
  ctx.fillStyle = '#1a1a2e';
  ctx.strokeStyle = '#daa520';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(pos.x + radius - 6, pos.y - radius + 6, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#daa520';
  ctx.font = 'bold 10px Inter, sans-serif';
  ctx.fillText(String(champion.level), pos.x + radius - 6, pos.y - radius + 9);

  // Health bar
  drawHealthBar(ctx, pos, champion.health, champion.maxHealth, 60, champion.team);
};

// --- Draw creep (Wild Rift style) ---
export const drawCreep = (
  ctx: CanvasRenderingContext2D,
  creep: CreepEntity
): void => {
  if (!creep.isAlive) return;

  const pos = creep.position;
  const radius = creep.creepType === 'siege' ? 14 : 10;
  const color = COLORS[creep.team].creep;

  // Drop shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 3;

  // Body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Border
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Creep type indicator
  if (creep.creepType === 'siege') {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 8px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('S', pos.x, pos.y + 3);
  }

  // Health bar
  drawHealthBar(ctx, pos, creep.health, creep.maxHealth, 30, creep.team);
};

// --- Draw tower (Wild Rift style) ---
export const drawTower = (
  ctx: CanvasRenderingContext2D,
  tower: Tower
): void => {
  if (!tower.isAlive) return;

  const pos = tower.position;
  const size = 24;
  const color = COLORS[tower.team].tower;

  // Drop shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 5;

  // Tower body with gradient
  const gradient = ctx.createLinearGradient(
    pos.x - size / 2,
    pos.y - size / 2,
    pos.x + size / 2,
    pos.y + size / 2
  );
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, '#000');

  ctx.fillStyle = gradient;
  ctx.fillRect(pos.x - size / 2, pos.y - size / 2, size, size);

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Border
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.strokeRect(pos.x - size / 2, pos.y - size / 2, size, size);

  // Tower tier indicator
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`T${tower.tier}`, pos.x, pos.y + 3);

  // Attack range indicator (when targeting)
  if (tower.targetId) {
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, tower.range, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Health bar
  drawHealthBar(ctx, pos, tower.health, tower.maxHealth, 50, tower.team);
};

// --- Draw nexus (Wild Rift style) ---
export const drawNexus = (
  ctx: CanvasRenderingContext2D,
  nexus: Nexus
): void => {
  if (!nexus.isAlive) return;

  const pos = nexus.position;
  const radius = nexus.radius;
  const color = COLORS[nexus.team].nexus;

  // Drop shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 6;

  // Body with gradient
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

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Border
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Name
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    nexus.team === 'player' ? 'Нексус Игрока' : 'Вражеский Нексус',
    pos.x,
    pos.y - radius - 10
  );

  // Health bar
  drawHealthBar(ctx, pos, nexus.health, nexus.maxHealth, 80, nexus.team);
};

// --- Draw skillshot (Wild Rift style) ---
export const drawSkillshot = (
  ctx: CanvasRenderingContext2D,
  skillshot: Skillshot
): void => {
  if (!skillshot.isActive) return;

  const pos = skillshot.position;
  const origin = skillshot.origin;

  // Trail
  ctx.strokeStyle = COLORS.skillshot;
  ctx.lineWidth = skillshot.radius * 2;
  ctx.lineCap = 'round';
  ctx.shadowColor = COLORS.skillshot;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();

  // Glow at tip
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
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  for (const lane of lanes) {
    // Player path
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(lane.playerNexus.x, lane.playerNexus.y);
    for (const point of lane.playerPath) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();

    // Enemy path
    ctx.strokeStyle = 'rgba(218, 165, 32, 0.25)';
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
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 2;
  ctx.setLineDash([3, 3]);
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 5;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.shadowBlur = 0;
};

// --- Draw range indicator ---
export const drawRangeIndicator = (
  ctx: CanvasRenderingContext2D,
  center: Vector2D,
  range: number
): void => {
  ctx.strokeStyle = 'rgba(138, 43, 226, 0.5)';
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 2]);
  ctx.shadowColor = 'rgba(138, 43, 226, 0.3)';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(center.x, center.y, range, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.shadowBlur = 0;
};
