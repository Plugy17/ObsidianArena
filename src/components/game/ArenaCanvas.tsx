// ============================================
// Obsidian Arena — Wild Rift Style Phaser Arena
// ============================================

import { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';

// --- Arena constants ---
const ARENA_WIDTH = 1280;
const ARENA_HEIGHT = 720;
const LANE_Y = 360;
const PLAYER_SPEED = 180;
const ATTACK_RANGE = 80;
const ATTACK_DAMAGE = 12;
const ATTACK_COOLDOWN = 800;
const SKILL1_COOLDOWN = 5000;
const SKILL2_COOLDOWN = 8000;
const SKILL1_DAMAGE = 30;
const SKILL2_DAMAGE = 50;
const SKILL1_RANGE = 120;
const TOWER_HP = 300;
const TOWER_RANGE = 150;
const TOWER_DAMAGE = 20;
const NEXUS_HP = 500;
const PLAYER_HP = 100;
const RESPAWN_TIME = 5000;

// --- Types ---
interface TowerData { x: number; y: number; team: 'player' | 'enemy'; hp: number; maxHp: number; }
interface BushData { x: number; y: number; w: number; h: number; }
interface ProjectileData { x: number; y: number; tx: number; ty: number; damage: number; team: string; }

// --- GameScene ---
class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Arc;
  private playerHp = PLAYER_HP;
  private playerMaxHp = PLAYER_HP;
  private enemy!: Phaser.GameObjects.Arc;
  private enemyHp = PLAYER_HP;
  private enemyMaxHp = PLAYER_HP;
  private towers: { body: Phaser.GameObjects.Rectangle; data: TowerData }[] = [];
  private nexusLeft!: Phaser.GameObjects.Arc;
  private nexusRight!: Phaser.GameObjects.Arc;
  private nexusLeftHp = NEXUS_HP;
  private nexusRightHp = NEXUS_HP;
  private bushes: Phaser.GameObjects.Rectangle[] = [];
  private hpBars: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private moveDir = { x: 0, y: 0 };
  private lastAttack = 0;
  private skill1Cd = 0;
  private skill2Cd = 0;
  private projectiles: ProjectileData[] = [];
  private projectileGraphics: Phaser.GameObjects.Arc[] = [];
  private respawnTimer = 0;
  private enemyRespawnTimer = 0;
  private killCount = 0;
  private deathCount = 0;
  private matchStartTime = 0;
  private gameEnded = false;
  private minimap!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.matchStartTime = Date.now();
    this.cameras.main.setBackgroundColor('#0d1117');

    // --- Draw arena background with grass texture ---
    this.createArenaBackground();

    // --- Draw lane path ---
    this.createLane();

    // --- Create bushes ---
    this.createBushes();

    // --- Create towers (2 per side) ---
    this.createTowers();

    // --- Create nexuses ---
    this.createNexuses();

    // --- Create player (left side) ---
    this.player = this.add.circle(120, LANE_Y, 22, 0x8a2be2, 1);
    this.player.setStrokeStyle(3, 0xffffff, 0.8);
    this.add.text(120, LANE_Y - 35, 'You', { fontSize: '14px', color: '#8a2be2', fontStyle: 'bold' }).setOrigin(0.5);

    // --- Create enemy (right side) ---
    this.enemy = this.add.circle(ARENA_WIDTH - 120, LANE_Y, 22, 0xff5252, 1);
    this.enemy.setStrokeStyle(3, 0xffffff, 0.8);
    this.add.text(ARENA_WIDTH - 120, LANE_Y - 35, 'Enemy', { fontSize: '14px', color: '#ff5252', fontStyle: 'bold' }).setOrigin(0.5);

    // --- Camera follows player ---
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.2);
    this.cameras.main.setBounds(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

    // --- Minimap (top-right corner) ---
    this.minimap = this.add.graphics().setScrollFactor(0).setDepth(100);

    // --- Start game loop ---
    this.time.addEvent({ delay: 16, callback: this.gameTick, callbackScope: this, loop: true });
  }

  private createArenaBackground() {
    const g = this.add.graphics();
    // Dark grass base
    g.fillStyle(0x1a3a1a, 1);
    g.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
    // Lighter grass patches
    g.fillStyle(0x2d5a2d, 0.3);
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, ARENA_WIDTH);
      const y = Phaser.Math.Between(0, ARENA_HEIGHT);
      g.fillCircle(x, y, Phaser.Math.Between(20, 60));
    }
    // Grid lines
    g.lineStyle(1, 0x0d1117, 0.2);
    for (let x = 0; x <= ARENA_WIDTH; x += 64) {
      g.moveTo(x, 0); g.lineTo(x, ARENA_HEIGHT);
    }
    for (let y = 0; y <= ARENA_HEIGHT; y += 64) {
      g.moveTo(0, y); g.lineTo(ARENA_WIDTH, y);
    }
    g.strokePath();
  }

  private createLane() {
    const g = this.add.graphics();
    // Lane path (golden road)
    g.fillStyle(0x8b7355, 0.4);
    g.fillRect(0, LANE_Y - 60, ARENA_WIDTH, 120);
    // Lane borders
    g.lineStyle(3, 0xdaa520, 0.3);
    g.strokeRect(0, LANE_Y - 60, ARENA_WIDTH, 120);
    // Center line
    g.lineStyle(2, 0xdaa520, 0.15);
    g.lineBetween(0, LANE_Y, ARENA_WIDTH, LANE_Y);
  }

  private createBushes() {
    const bushData: BushData[] = [
      { x: 300, y: 200, w: 100, h: 70 },
      { x: 300, y: 520, w: 100, h: 70 },
      { x: 640, y: 150, w: 120, h: 60 },
      { x: 640, y: 570, w: 120, h: 60 },
      { x: 980, y: 200, w: 100, h: 70 },
      { x: 980, y: 520, w: 100, h: 70 },
      { x: 640, y: 360, w: 80, h: 80 },
    ];
    for (const b of bushData) {
      const bush = this.add.rectangle(b.x, b.y, b.w, b.h, 0x1a4a1a, 0.6);
      bush.setStrokeStyle(2, 0x2d6a2d, 0.5);
      // Bush texture dots
      for (let i = 0; i < 8; i++) {
        this.add.circle(
          b.x + Phaser.Math.Between(-b.w/2 + 10, b.w/2 - 10),
          b.y + Phaser.Math.Between(-b.h/2 + 10, b.h/2 - 10),
          Phaser.Math.Between(4, 8), 0x2d8a2d, 0.4
        );
      }
      this.bushes.push(bush);
    }
  }

  private createTowers() {
    const towerPositions: TowerData[] = [
      { x: 350, y: LANE_Y, team: 'player', hp: TOWER_HP, maxHp: TOWER_HP },
      { x: 600, y: LANE_Y, team: 'player', hp: TOWER_HP, maxHp: TOWER_HP },
      { x: 680, y: LANE_Y, team: 'enemy', hp: TOWER_HP, maxHp: TOWER_HP },
      { x: 930, y: LANE_Y, team: 'enemy', hp: TOWER_HP, maxHp: TOWER_HP },
    ];
    for (const td of towerPositions) {
      const color = td.team === 'player' ? 0x4a90d9 : 0xd94a4a;
      const tower = this.add.rectangle(td.x, td.y, 40, 60, color, 0.85);
      tower.setStrokeStyle(3, 0xffffff, 0.6);
      // Tower top
      this.add.rectangle(td.x, td.y - 35, 30, 15, color, 0.9).setStrokeStyle(2, 0xffffff, 0.4);
      // Range indicator
      this.add.circle(td.x, td.y, TOWER_RANGE, color, 0.05).setStrokeStyle(1, color, 0.15);
      this.towers.push({ body: tower, data: td });
    }
  }

  private createNexuses() {
    // Left nexus (player)
    this.nexusLeft = this.add.circle(60, LANE_Y, 35, 0x4a90d9, 0.9);
    this.nexusLeft.setStrokeStyle(4, 0xffffff, 0.7);
    this.add.text(60, LANE_Y - 55, 'NEXUS', { fontSize: '12px', color: '#4a90d9', fontStyle: 'bold' }).setOrigin(0.5);
    // Glow
    this.add.circle(60, LANE_Y, 50, 0x4a90d9, 0.1);

    // Right nexus (enemy)
    this.nexusRight = this.add.circle(ARENA_WIDTH - 60, LANE_Y, 35, 0xd94a4a, 0.9);
    this.nexusRight.setStrokeStyle(4, 0xffffff, 0.7);
    this.add.text(ARENA_WIDTH - 60, LANE_Y - 55, 'NEXUS', { fontSize: '12px', color: '#d94a4a', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.circle(ARENA_WIDTH - 60, LANE_Y, 50, 0xd94a4a, 0.1);
  }

  // --- Set movement direction from joystick ---
  setMoveDirection(x: number, y: number) {
    this.moveDir = { x, y };
  }

  // --- Attack button pressed ---
  attack() {
    const now = Date.now();
    if (now - this.lastAttack < ATTACK_COOLDOWN) return;
    if (this.respawnTimer > 0) return;
    this.lastAttack = now;
    // Find nearest enemy target
    const target = this.findNearestTarget();
    if (target) {
      this.createProjectile(this.player.x, this.player.y, target.x, target.y, ATTACK_DAMAGE, 'player');
    }
  }

  // --- Skill 1 ---
  skill1() {
    const now = Date.now();
    if (now - this.skill1Cd < SKILL1_COOLDOWN) return;
    if (this.respawnTimer > 0) return;
    this.skill1Cd = now;
    const target = this.findNearestTarget();
    if (target) {
      // AoE effect
      const fx = this.add.circle(this.player.x, this.player.y, SKILL1_RANGE, 0xff6b35, 0.3);
      this.tweens.add({ targets: fx, scale: 1.5, alpha: 0, duration: 400, onComplete: () => fx.destroy() });
      // Damage all enemies in range
      this.damageInRange(this.player.x, this.player.y, SKILL1_RANGE, SKILL1_DAMAGE, 'player');
    }
  }

  // --- Skill 2 ---
  skill2() {
    const now = Date.now();
    if (now - this.skill2Cd < SKILL2_COOLDOWN) return;
    if (this.respawnTimer > 0) return;
    this.skill2Cd = now;
    const target = this.findNearestTarget();
    if (target) {
      // Long range projectile
      this.createProjectile(this.player.x, this.player.y, target.x, target.y, SKILL2_DAMAGE, 'player', true);
    }
  }

  private findNearestTarget(): { x: number; y: number } | null {
    let nearest: { x: number; y: number; dist: number } | null = null as { x: number; y: number; dist: number } | null;
    const px = this.player.x, py = this.player.y;
    // Check enemy champion
    if (this.enemyRespawnTimer <= 0) {
      const d = Phaser.Math.Distance.Between(px, py, this.enemy.x, this.enemy.y);
      if (!nearest || d < nearest.dist) nearest = { x: this.enemy.x, y: this.enemy.y, dist: d };
    }
    // Check enemy towers
    for (const t of this.towers) {
      if (t.data.team === 'enemy' && t.data.hp > 0) {
        const d = Phaser.Math.Distance.Between(px, py, t.data.x, t.data.y);
        if (!nearest || d < nearest.dist) nearest = { x: t.data.x, y: t.data.y, dist: d };
      }
    }
    // Check enemy nexus
    if (this.nexusRightHp > 0) {
      const d = Phaser.Math.Distance.Between(px, py, this.nexusRight.x, this.nexusRight.y);
      if (!nearest || d < nearest.dist) nearest = { x: this.nexusRight.x, y: this.nexusRight.y, dist: d };
    }
    return nearest ? { x: nearest.x, y: nearest.y } : null;
  }

  private createProjectile(x: number, y: number, tx: number, ty: number, damage: number, team: string, big = false) {
    this.projectiles.push({ x, y, tx, ty, damage, team });
    const color = team === 'player' ? (big ? 0x00e5ff : 0xffeb3b) : 0xff5252;
    const p = this.add.circle(x, y, big ? 10 : 6, color, 1);
    p.setStrokeStyle(2, 0xffffff, 0.5);
    this.projectileGraphics.push(p);
  }

  private damageInRange(x: number, y: number, range: number, damage: number, team: string) {
    if (team === 'player') {
      // Damage enemy
      if (this.enemyRespawnTimer <= 0) {
        const d = Phaser.Math.Distance.Between(x, y, this.enemy.x, this.enemy.y);
        if (d < range) { this.enemyHp -= damage; this.showDamage(this.enemy.x, this.enemy.y, damage); }
      }
      for (const t of this.towers) {
        if (t.data.team === 'enemy' && t.data.hp > 0) {
          const d = Phaser.Math.Distance.Between(x, y, t.data.x, t.data.y);
          if (d < range) { t.data.hp -= damage; this.showDamage(t.data.x, t.data.y, damage); }
        }
      }
      const nd = Phaser.Math.Distance.Between(x, y, this.nexusRight.x, this.nexusRight.y);
      if (nd < range) { this.nexusRightHp -= damage; this.showDamage(this.nexusRight.x, this.nexusRight.y, damage); }
    }
  }

  private showDamage(x: number, y: number, dmg: number) {
    const txt = this.add.text(x, y - 20, `-${Math.round(dmg)}`, {
      fontSize: '16px', color: '#ff5252', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.tweens.add({
      targets: txt, y: y - 50, alpha: 0, duration: 800,
      onComplete: () => txt.destroy(),
    });
  }

  private gameTick() {
    if (this.gameEnded) return;
    const now = Date.now();

    // --- Player movement ---
    if (this.respawnTimer <= 0) {
      const speed = PLAYER_SPEED / 60;
      this.player.x += this.moveDir.x * speed;
      this.player.y += this.moveDir.y * speed;
      // Clamp to arena
      this.player.x = Phaser.Math.Clamp(this.player.x, 20, ARENA_WIDTH - 20);
      this.player.y = Phaser.Math.Clamp(this.player.y, 20, ARENA_HEIGHT - 20);
    }

    // --- Enemy AI (simple: move towards player, attack) ---
    if (this.enemyRespawnTimer <= 0) {
      const dx = this.player.x - this.enemy.x;
      const dy = this.player.y - this.enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > ATTACK_RANGE) {
        this.enemy.x += (dx / dist) * (PLAYER_SPEED * 0.7 / 60);
        this.enemy.y += (dy / dist) * (PLAYER_SPEED * 0.7 / 60);
      } else {
        // Enemy attacks
        if (now - this.lastAttack > ATTACK_COOLDOWN + 200) {
          this.lastAttack = now; // Reuse for simplicity
          this.createProjectile(this.enemy.x, this.enemy.y, this.player.x, this.player.y, ATTACK_DAMAGE, 'enemy');
        }
      }
    }

    // --- Update projectiles ---
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const pg = this.projectileGraphics[i];
      const dx = p.tx - p.x;
      const dy = p.ty - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const speed = 8;
      if (dist < speed) {
        // Hit
        this.onProjectileHit(p);
        pg.destroy();
        this.projectiles.splice(i, 1);
        this.projectileGraphics.splice(i, 1);
      } else {
        p.x += (dx / dist) * speed;
        p.y += (dy / dist) * speed;
        pg.x = p.x;
        pg.y = p.y;
      }
    }

    // --- Tower attacks ---
    for (const t of this.towers) {
      if (t.data.hp <= 0) continue;
      // Check if player in range
      if (t.data.team === 'enemy' && this.respawnTimer <= 0) {
        const d = Phaser.Math.Distance.Between(t.data.x, t.data.y, this.player.x, this.player.y);
        if (d < TOWER_RANGE && now % 1000 < 16) {
          this.createProjectile(t.data.x, t.data.y - 20, this.player.x, this.player.y, TOWER_DAMAGE, 'enemy');
        }
      }
    }

    // --- Respawn handling ---
    if (this.respawnTimer > 0) {
      this.respawnTimer -= 16;
      if (this.respawnTimer <= 0) {
        this.playerHp = this.playerMaxHp;
        this.player.setPosition(120, LANE_Y);
        this.player.setVisible(true);
      }
    }
    if (this.enemyRespawnTimer > 0) {
      this.enemyRespawnTimer -= 16;
      if (this.enemyRespawnTimer <= 0) {
        this.enemyHp = this.enemyMaxHp;
        this.enemy.setPosition(ARENA_WIDTH - 120, LANE_Y);
        this.enemy.setVisible(true);
      }
    }

    // --- Check deaths ---
    if (this.playerHp <= 0 && this.respawnTimer <= 0) {
      this.deathCount++;
      this.respawnTimer = RESPAWN_TIME;
      this.player.setVisible(false);
    }
    if (this.enemyHp <= 0 && this.enemyRespawnTimer <= 0) {
      this.killCount++;
      this.enemyRespawnTimer = RESPAWN_TIME;
      this.enemy.setVisible(false);
    }

    // --- Check win/lose ---
    if (this.nexusRightHp <= 0 && !this.gameEnded) {
      this.gameEnded = true;
      this.events.emit('match_end', { won: true, kills: this.killCount, deaths: this.deathCount, duration: (Date.now() - this.matchStartTime) / 1000 });
    }
    if (this.nexusLeftHp <= 0 && !this.gameEnded) {
      this.gameEnded = true;
      this.events.emit('match_end', { won: false, kills: this.killCount, deaths: this.deathCount, duration: (Date.now() - this.matchStartTime) / 1000 });
    }

    // --- Update HP bars and minimap ---
    this.updateHpBars();
    this.updateMinimap();
  }

  private onProjectileHit(p: ProjectileData) {
    if (p.team === 'player') {
      // Check enemy hit
      if (this.enemyRespawnTimer <= 0) {
        const d = Phaser.Math.Distance.Between(p.x, p.y, this.enemy.x, this.enemy.y);
        if (d < 30) { this.enemyHp -= p.damage; this.showDamage(this.enemy.x, this.enemy.y, p.damage); return; }
      }
      // Check tower hit
      for (const t of this.towers) {
        if (t.data.team === 'enemy' && t.data.hp > 0) {
          const d = Phaser.Math.Distance.Between(p.x, p.y, t.data.x, t.data.y);
          if (d < 30) { t.data.hp -= p.damage; this.showDamage(t.data.x, t.data.y, p.damage); return; }
        }
      }
      // Check nexus hit
      const nd = Phaser.Math.Distance.Between(p.x, p.y, this.nexusRight.x, this.nexusRight.y);
      if (nd < 40) { this.nexusRightHp -= p.damage; this.showDamage(this.nexusRight.x, this.nexusRight.y, p.damage); }
    } else {
      // Enemy projectile hits player
      if (this.respawnTimer <= 0) {
        const d = Phaser.Math.Distance.Between(p.x, p.y, this.player.x, this.player.y);
        if (d < 30) { this.playerHp -= p.damage; this.showDamage(this.player.x, this.player.y, p.damage); }
      }
    }
  }

  private updateHpBars() {
    // Player HP bar
    this.drawHpBar(this.player.x, this.player.y - 35, 50, this.playerHp, this.playerMaxHp, 0x4caf50);
    // Enemy HP bar
    if (this.enemyRespawnTimer <= 0) {
      this.drawHpBar(this.enemy.x, this.enemy.y - 35, 50, this.enemyHp, this.enemyMaxHp, 0xff5252);
    }
    // Tower HP bars
    for (const t of this.towers) {
      if (t.data.hp > 0) {
        const color = t.data.team === 'player' ? 0x4a90d9 : 0xd94a4a;
        this.drawHpBar(t.data.x, t.data.y - 40, 45, t.data.hp, t.data.maxHp, color);
      } else {
        t.body.setFillStyle(0x333333, 0.3);
      }
    }
    // Nexus HP bars
    this.drawHpBar(this.nexusLeft.x, this.nexusLeft.y - 50, 70, this.nexusLeftHp, NEXUS_HP, 0x4a90d9);
    this.drawHpBar(this.nexusRight.x, this.nexusRight.y - 50, 70, this.nexusRightHp, NEXUS_HP, 0xd94a4a);
  }

  private drawHpBar(x: number, y: number, width: number, hp: number, maxHp: number, color: number) {
    const key = `hp_${Math.round(x)}_${Math.round(y)}`;
    let bar = this.hpBars.get(key);
    if (!bar) {
      bar = this.add.graphics();
      this.hpBars.set(key, bar);
    }
    bar.clear();
    const pct = Math.max(0, hp / maxHp);
    // Background
    bar.fillStyle(0x000000, 0.6);
    bar.fillRect(x - width/2 - 1, y - 1, width + 2, 7);
    // Fill
    bar.fillStyle(color, 1);
    bar.fillRect(x - width/2, y, width * pct, 5);
  }

  private updateMinimap() {
    const mmW = 120, mmH = 68;
    const mmX = ARENA_WIDTH - mmW - 10;
    const mmY = 10;
    this.minimap.clear();
    this.minimap.fillStyle(0x000000, 0.7);
    this.minimap.fillRect(mmX, mmY, mmW, mmH);
    this.minimap.lineStyle(1, 0xffffff, 0.3);
    this.minimap.strokeRect(mmX, mmY, mmW, mmH);
    // Player dot
    const sx = mmX + (this.player.x / ARENA_WIDTH) * mmW;
    const sy = mmY + (this.player.y / ARENA_HEIGHT) * mmH;
    this.minimap.fillStyle(0x8a2be2, 1);
    this.minimap.fillCircle(sx, sy, 3);
    // Enemy dot
    if (this.enemyRespawnTimer <= 0) {
      const ex = mmX + (this.enemy.x / ARENA_WIDTH) * mmW;
      const ey = mmY + (this.enemy.y / ARENA_HEIGHT) * mmH;
      this.minimap.fillStyle(0xff5252, 1);
      this.minimap.fillCircle(ex, ey, 3);
    }
    // Towers
    for (const t of this.towers) {
      if (t.data.hp > 0) {
        const tx = mmX + (t.data.x / ARENA_WIDTH) * mmW;
        const ty = mmY + (t.data.y / ARENA_HEIGHT) * mmH;
        this.minimap.fillStyle(t.data.team === 'player' ? 0x4a90d9 : 0xd94a4a, 1);
        this.minimap.fillRect(tx - 2, ty - 2, 4, 4);
      }
    }
  }

  // --- Get cooldown percents for UI ---
  getAttackCdPercent(): number {
    const elapsed = Date.now() - this.lastAttack;
    return Math.min(100, (elapsed / ATTACK_COOLDOWN) * 100);
  }
  getSkill1CdPercent(): number {
    const elapsed = Date.now() - this.skill1Cd;
    return Math.min(100, (elapsed / SKILL1_COOLDOWN) * 100);
  }
  getSkill2CdPercent(): number {
    const elapsed = Date.now() - this.skill2Cd;
    return Math.min(100, (elapsed / SKILL2_COOLDOWN) * 100);
  }
  getPlayerHpPercent(): number {
    return Math.max(0, (this.playerHp / this.playerMaxHp) * 100);
  }
  getEnemyHpPercent(): number {
    return Math.max(0, (this.enemyHp / this.enemyMaxHp) * 100);
  }
  getNexusLeftHpPercent(): number {
    return Math.max(0, (this.nexusLeftHp / NEXUS_HP) * 100);
  }
  getNexusRightHpPercent(): number {
    return Math.max(0, (this.nexusRightHp / NEXUS_HP) * 100);
  }
  isPlayerDead(): boolean { return this.respawnTimer > 0; }
  getRespawnTime(): number { return Math.ceil(this.respawnTimer / 1000); }
}

// --- Virtual Joystick Component ---
const VirtualJoystick: React.FC<{
  onMove: (x: number, y: number) => void;
}> = ({ onMove }) => {
  const baseRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const touchId = useRef<number | null>(null);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (!baseRef.current) return;
    const rect = baseRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = rect.width / 2;
    if (dist > maxDist) return;
    setActive(true);
    setKnobPos({ x: dx, y: dy });
    onMove(dx / maxDist, dy / maxDist);
  }, [onMove]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!active || !baseRef.current) return;
    const rect = baseRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = rect.width / 2;
    if (dist > maxDist) {
      dx = (dx / dist) * maxDist;
      dy = (dy / dist) * maxDist;
    }
    setKnobPos({ x: dx, y: dy });
    onMove(dx / maxDist, dy / maxDist);
  }, [active, onMove]);

  const handleEnd = useCallback(() => {
    setActive(false);
    setKnobPos({ x: 0, y: 0 });
    onMove(0, 0);
    touchId.current = null;
  }, [onMove]);

  return (
    <div
      ref={baseRef}
      className="relative w-32 h-32 rounded-full bg-obsidian-700/40 border-2 border-purple-neon/30 touch-none"
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); touchId.current = e.pointerId; handleStart(e.clientX, e.clientY); }}
      onPointerMove={(e) => { if (touchId.current === e.pointerId) handleMove(e.clientX, e.clientY); }}
      onPointerUp={(e) => { if (touchId.current === e.pointerId) handleEnd(); }}
      onPointerCancel={() => handleEnd()}
    >
      {/* Knob */}
      <div
        className="absolute w-14 h-14 rounded-full bg-purple-neon/60 border-2 border-white/50 pointer-events-none transition-transform"
        style={{
          left: '50%',
          top: '50%',
          transform: `translate(calc(-50% + ${knobPos.x}px), calc(-50% + ${knobPos.y}px))`,
        }}
      />
    </div>
  );
};

// --- ArenaCanvas Component ---
export interface ArenaCanvasProps {
  onMatchEnd?: (result: { won: boolean; kills: number; deaths: number; duration: number }) => void;
}

export const ArenaCanvas: React.FC<ArenaCanvasProps> = ({ onMatchEnd }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<GameScene | null>(null);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const scene = new GameScene();
    sceneRef.current = scene;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: window.innerWidth,
      height: window.innerHeight,
      scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
      physics: { default: 'arcade', arcade: { debug: false } },
      scene: [scene],
      render: { antialias: true, pixelArt: false },
    });

    gameRef.current = game;

    // Listen for match end
    scene.events.on('match_end', (result: { won: boolean; kills: number; deaths: number; duration: number }) => {
      onMatchEnd?.(result);
    });

    // UI tick
    const tick = setInterval(() => forceUpdate((n) => n + 1), 100);

    // Resize handler
    const handleResize = () => {
      game.scale.resize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(tick);
      window.removeEventListener('resize', handleResize);
      scene.events.off('match_end');
      game.destroy(true);
      gameRef.current = null;
    };
  }, [onMatchEnd]);

  const handleMove = useCallback((x: number, y: number) => {
    sceneRef.current?.setMoveDirection(x, y);
  }, []);

  const handleAttack = useCallback(() => sceneRef.current?.attack(), []);
  const handleSkill1 = useCallback(() => sceneRef.current?.skill1(), []);
  const handleSkill2 = useCallback(() => sceneRef.current?.skill2(), []);

  const s = sceneRef.current;
  const playerHpPct = s?.getPlayerHpPercent() ?? 100;
  const enemyHpPct = s?.getEnemyHpPercent() ?? 100;
  const nexusLPct = s?.getNexusLeftHpPercent() ?? 100;
  const nexusRPct = s?.getNexusRightHpPercent() ?? 100;
  const atkCd = s?.getAttackCdPercent() ?? 100;
  const s1Cd = s?.getSkill1CdPercent() ?? 100;
  const s2Cd = s?.getSkill2CdPercent() ?? 100;
  const isDead = s?.isPlayerDead() ?? false;
  const respawnTime = s?.getRespawnTime() ?? 0;

  return (
    <div className="relative w-full h-full overflow-hidden bg-obsidian-900">
      {/* Phaser canvas */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Top HUD — Nexus HP bars */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-4 z-20 pointer-events-none">
        {/* Player nexus */}
        <div className="flex items-center gap-2">
          <span className="text-blue-400 text-xs font-bold">YOUR NEXUS</span>
          <div className="w-24 h-3 bg-black/60 rounded-full overflow-hidden border border-white/20">
            <div className="h-full bg-blue-500 transition-all" style={{ width: `${nexusLPct}%` }} />
          </div>
        </div>
        {/* VS */}
        <span className="text-gold font-bold text-sm">VS</span>
        {/* Enemy nexus */}
        <div className="flex items-center gap-2">
          <div className="w-24 h-3 bg-black/60 rounded-full overflow-hidden border border-white/20">
            <div className="h-full bg-red-500 transition-all" style={{ width: `${nexusRPct}%` }} />
          </div>
          <span className="text-red-400 text-xs font-bold">ENEMY NEXUS</span>
        </div>
      </div>

      {/* Player HP bar (top-left) */}
      <div className="absolute top-12 left-3 z-20 pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-purple-neon/60 border-2 border-white/40" />
          <div>
            <div className="text-white text-xs font-bold mb-1">HP {Math.round(playerHpPct)}%</div>
            <div className="w-32 h-3 bg-black/60 rounded-full overflow-hidden border border-white/20">
              <div className="h-full bg-green-500 transition-all" style={{ width: `${playerHpPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Enemy HP bar (top-right) */}
      <div className="absolute top-12 right-3 z-20 pointer-events-none">
        <div className="flex items-center gap-2 flex-row-reverse">
          <div className="w-10 h-10 rounded-full bg-red-500/60 border-2 border-white/40" />
          <div className="text-right">
            <div className="text-white text-xs font-bold mb-1">HP {Math.round(enemyHpPct)}%</div>
            <div className="w-32 h-3 bg-black/60 rounded-full overflow-hidden border border-white/20 ml-auto">
              <div className="h-full bg-red-500 transition-all" style={{ width: `${enemyHpPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Death overlay */}
      {isDead && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 pointer-events-none">
          <div className="text-center">
            <div className="text-red-500 text-4xl font-bold mb-2">YOU DIED</div>
            <div className="text-white text-lg">Respawn in {respawnTime}s</div>
          </div>
        </div>
      )}

      {/* Bottom-left: Virtual Joystick */}
      <div className="absolute bottom-6 left-6 z-20">
        <VirtualJoystick onMove={handleMove} />
      </div>

      {/* Bottom-right: Attack + Skill buttons */}
      <div className="absolute bottom-6 right-6 z-20 flex items-end gap-3">
        {/* Skill 2 */}
        <button
          onClick={handleSkill2}
          disabled={s2Cd < 100}
          className="relative w-16 h-16 rounded-full border-2 font-bold text-xs transition-all touch-none"
          style={{
            borderColor: s2Cd < 100 ? '#444' : '#00e5ff',
            background: s2Cd < 100 ? 'rgba(20,20,30,0.8)' : 'rgba(0,229,255,0.2)',
            boxShadow: s2Cd < 100 ? 'none' : '0 0 15px rgba(0,229,255,0.4)',
          }}
        >
          S2
          {s2Cd < 100 && (
            <div className="absolute inset-0 rounded-full bg-black/70 flex items-center justify-center" style={{ clipPath: `inset(0 0 ${s2Cd}% 0)` }}>
              <span className="text-white text-xs">{Math.ceil((SKILL2_COOLDOWN - (Date.now() - (sceneRef.current as any)?.skill2Cd || 0)) / 1000)}s</span>
            </div>
          )}
        </button>

        {/* Skill 1 */}
        <button
          onClick={handleSkill1}
          disabled={s1Cd < 100}
          className="relative w-16 h-16 rounded-full border-2 font-bold text-xs transition-all touch-none"
          style={{
            borderColor: s1Cd < 100 ? '#444' : '#ff6b35',
            background: s1Cd < 100 ? 'rgba(20,20,30,0.8)' : 'rgba(255,107,53,0.2)',
            boxShadow: s1Cd < 100 ? 'none' : '0 0 15px rgba(255,107,53,0.4)',
          }}
        >
          S1
          {s1Cd < 100 && (
            <div className="absolute inset-0 rounded-full bg-black/70 flex items-center justify-center" style={{ clipPath: `inset(0 0 ${s1Cd}% 0)` }}>
              <span className="text-white text-xs">{Math.ceil((SKILL1_COOLDOWN - (Date.now() - (sceneRef.current as any)?.skill1Cd || 0)) / 1000)}s</span>
            </div>
          )}
        </button>

        {/* Attack button (biggest) */}
        <button
          onClick={handleAttack}
          disabled={atkCd < 100}
          className="relative w-20 h-20 rounded-full border-2 font-bold text-sm transition-all touch-none"
          style={{
            borderColor: atkCd < 100 ? '#444' : '#daa520',
            background: atkCd < 100 ? 'rgba(20,20,30,0.8)' : 'rgba(218,165,32,0.2)',
            boxShadow: atkCd < 100 ? 'none' : '0 0 20px rgba(218,165,32,0.5)',
          }}
        >
          ATK
        </button>
      </div>
    </div>
  );
};
