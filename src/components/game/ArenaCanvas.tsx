// ============================================
// Obsidian Arena — Wild Rift Style (Detailed)
// ============================================

import { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import type { Character } from '../../config/characters';

// --- Arena constants ---
const ARENA_WIDTH = 1280;
const ARENA_HEIGHT = 720;
const LANE_Y = 360;
const PLAYER_SPEED = 200;
const ATTACK_RANGE = 90;
const ATTACK_DAMAGE = 15;
const ATTACK_COOLDOWN = 600;
const SKILL1_COOLDOWN = 5000;
const SKILL2_COOLDOWN = 8000;
const SKILL1_DAMAGE = 35;
const SKILL2_DAMAGE = 60;
const SKILL1_RANGE = 130;
const TOWER_HP = 400;
const TOWER_RANGE = 160;
const TOWER_DAMAGE = 25;
const NEXUS_HP = 600;
const PLAYER_HP = 120;
const RESPAWN_TIME = 5000;

// --- Isometric constants ---
const ISO_TILE_W = 64;
const ISO_TILE_H = 32;
const TILES_X = 20;
const TILES_Y = 11;



// Convert cartesian (world) to isometric screen coordinates
function cartToIso(cx: number, cy: number): { x: number; y: number } {
  const tx = cx / ISO_TILE_W;
  const ty = cy / ISO_TILE_H;
  return {
    x: (tx - ty) * (ISO_TILE_W / 2) + ARENA_WIDTH / 2,
    y: (tx + ty) * (ISO_TILE_H / 2) + 60,
  };
}

// Convert isometric tile to cartesian
function isoToCart(tx: number, ty: number): { x: number; y: number } {
  return {
    x: (tx - ty) * (ISO_TILE_W / 2),
    y: (tx + ty) * (ISO_TILE_H / 2),
  };
}

// Depth sort key: higher y = drawn first (behind)
function depthSortKey(worldX: number, worldY: number): number {
  return worldX + worldY;
}

// --- Types ---
interface TowerData { x: number; y: number; team: 'player' | 'enemy'; hp: number; maxHp: number; tier: number; }
interface BushData { x: number; y: number; w: number; h: number; }
interface ProjectileData { x: number; y: number; tx: number; ty: number; damage: number; team: string; big: boolean; }
interface ParticleData { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: number; size: number; }

// --- GameScene ---
class GameScene extends Phaser.Scene {
  public characterData: Character | null = null;
  public gameMode: string = 'pve';
  public onBackToLobby: () => void = () => {};

  private player!: Phaser.GameObjects.Container;
  private playerCartX = 120;
  private playerCartY = LANE_Y;
  private playerHp = PLAYER_HP;
  private playerMaxHp = PLAYER_HP;
  private playerAnimPhase = 0;
  private playerMoving = false;
  private enemy!: Phaser.GameObjects.Container;
  private enemyCartX = ARENA_WIDTH - 120;
  private enemyCartY = LANE_Y;
  private enemyHp = PLAYER_HP;
  private enemyMaxHp = PLAYER_HP;
  private enemyAnimPhase = 0;
  private towers: { container: Phaser.GameObjects.Container; data: TowerData }[] = [];
  private nexusLeft!: Phaser.GameObjects.Container;
  private nexusRight!: Phaser.GameObjects.Container;
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
  private particles: ParticleData[] = [];
  private particleGraphics: Phaser.GameObjects.Arc[] = [];
  private respawnTimer = 0;
  private enemyRespawnTimer = 0;
  private killCount = 0;
  private deathCount = 0;
  private goldCount = 1000;
  private matchStartTime = 0;
  private gameEnded = false;
  private minimap!: Phaser.GameObjects.Graphics;
  private stoneDecorations: { x: number; y: number; r: number }[] = [];

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.matchStartTime = Date.now();
    this.cameras.main.setBackgroundColor('#0a0f0a');

    this.createArenaBackground();
    this.createLane();
    this.createBushes();
    this.createTowers();
    this.createNexuses();
    this.createPlayer();
    this.createEnemy();

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.3);
    this.cameras.main.setBounds(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

    this.minimap = this.add.graphics().setScrollFactor(0).setDepth(100);
    this.time.addEvent({ delay: 16, callback: this.gameTick, callbackScope: this, loop: true });
  }

  // --- Draw knight hero sprite ---
  private drawHero(x: number, y: number, team: 'player' | 'enemy'): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const color = team === 'player' ? 0x8a2be2 : 0xff5252;
    const darkColor = team === 'player' ? 0x4a1a8a : 0x8a1a1a;

    // Isometric shadow (elongated ellipse)
    const shadow = this.add.ellipse(0, 22, 44, 16, 0x000000, 0.35);
    container.add(shadow);

    // Body (armor)
    const body = this.add.graphics();
    body.fillStyle(darkColor, 1);
    body.fillRoundedRect(-12, -8, 24, 24, 4);
    body.lineStyle(2, color, 0.8);
    body.strokeRoundedRect(-12, -8, 24, 24, 4);
    // Armor plates
    body.fillStyle(color, 0.3);
    body.fillRoundedRect(-10, -6, 20, 8, 3);
    container.add(body);

    // Head (helmet)
    const head = this.add.graphics();
    head.fillStyle(0x888888, 1);
    head.fillCircle(0, -14, 10);
    head.lineStyle(2, 0x444444, 1);
    head.strokeCircle(0, -14, 10);
    // Helmet visor
    head.fillStyle(0x222222, 1);
    head.fillRect(-6, -16, 12, 4);
    // Plume
    head.fillStyle(color, 1);
    head.fillTriangle(0, -24, -4, -18, 4, -18);
    container.add(head);

    // Shield (left arm)
    const shield = this.add.graphics();
    shield.fillStyle(color, 0.8);
    shield.fillRoundedRect(-18, -4, 8, 16, 2);
    shield.lineStyle(2, 0xffd700, 0.6);
    shield.strokeRoundedRect(-18, -4, 8, 16, 2);
    // Shield emblem
    shield.fillStyle(0xffd700, 0.5);
    shield.fillCircle(-14, 4, 3);
    container.add(shield);

    // Sword (right arm)
    const sword = this.add.graphics();
    sword.fillStyle(0xcccccc, 1);
    sword.fillRect(14, -12, 3, 20);
    sword.fillStyle(0xffd700, 1);
    sword.fillRect(12, 8, 7, 3);
    container.add(sword);

    // Legs
    const legs = this.add.graphics();
    legs.fillStyle(darkColor, 1);
    legs.fillRoundedRect(-8, 14, 6, 10, 2);
    legs.fillRoundedRect(2, 14, 6, 10, 2);
    container.add(legs);

    return container;
  }

  // --- Draw tower sprite ---
  private drawTower(x: number, y: number, team: 'player' | 'enemy'): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const color = team === 'player' ? 0x4a90d9 : 0xd94a4a;
    const darkColor = team === 'player' ? 0x2a5089 : 0x8a2a2a;

    // Isometric shadow
    const shadow = this.add.ellipse(0, 35, 56, 18, 0x000000, 0.4);
    container.add(shadow);

    // Base (stone)
    const base = this.add.graphics();
    base.fillStyle(0x555555, 1);
    base.fillRoundedRect(-22, 10, 44, 20, 4);
    base.lineStyle(2, 0x333333, 1);
    base.strokeRoundedRect(-22, 10, 44, 20, 4);
    // Stone texture
    base.fillStyle(0x666666, 0.5);
    base.fillRect(-18, 14, 8, 6);
    base.fillRect(-6, 16, 8, 6);
    base.fillRect(6, 14, 8, 6);
    container.add(base);

    // Tower body
    const towerBody = this.add.graphics();
    towerBody.fillStyle(color, 0.9);
    towerBody.fillRoundedRect(-16, -20, 32, 32, 3);
    towerBody.lineStyle(3, darkColor, 1);
    towerBody.strokeRoundedRect(-16, -20, 32, 32, 3);
    // Tower windows
    towerBody.fillStyle(0x222222, 0.8);
    towerBody.fillRect(-10, -14, 6, 8);
    towerBody.fillRect(4, -14, 6, 8);
    container.add(towerBody);

    // Tower top (battlements)
    const top = this.add.graphics();
    top.fillStyle(darkColor, 1);
    top.fillRect(-18, -28, 36, 8);
    // Crenellations
    top.fillRect(-18, -32, 6, 6);
    top.fillRect(-6, -32, 6, 6);
    top.fillRect(6, -32, 6, 6);
    container.add(top);

    // Crystal on top (glowing)
    const crystal = this.add.graphics();
    crystal.fillStyle(color, 0.8);
    crystal.fillTriangle(0, -42, -6, -32, 6, -32);
    crystal.lineStyle(2, 0xffffff, 0.5);
    crystal.strokeTriangle(0, -42, -6, -32, 6, -32);
    container.add(crystal);

    // Range indicator
    const range = this.add.circle(0, 0, TOWER_RANGE, color, 0.04);
    range.setStrokeStyle(1, color, 0.12);
    container.add(range);

    return container;
  }

  // --- Draw nexus building ---
  private drawNexus(x: number, y: number, team: 'player' | 'enemy'): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const color = team === 'player' ? 0x4a90d9 : 0xd94a4a;
    const darkColor = team === 'player' ? 0x2a5089 : 0x8a2a2a;

    // Isometric shadow (large ellipse)
    const shadow = this.add.ellipse(0, 45, 90, 24, 0x000000, 0.5);
    container.add(shadow);

    // Base platform
    const base = this.add.graphics();
    base.fillStyle(0x444444, 1);
    base.fillRoundedRect(-35, 15, 70, 25, 5);
    base.lineStyle(2, 0x222222, 1);
    base.strokeRoundedRect(-35, 15, 70, 25, 5);
    // Stone blocks
    base.fillStyle(0x555555, 0.5);
    base.fillRect(-30, 20, 12, 8);
    base.fillRect(-15, 22, 12, 8);
    base.fillRect(0, 20, 12, 8);
    base.fillRect(15, 22, 12, 8);
    container.add(base);

    // Main building
    const building = this.add.graphics();
    building.fillStyle(color, 0.9);
    building.fillRoundedRect(-28, -15, 56, 35, 4);
    building.lineStyle(3, darkColor, 1);
    building.strokeRoundedRect(-28, -15, 56, 35, 4);
    // Windows
    building.fillStyle(0xffd700, 0.4);
    building.fillRoundedRect(-20, -8, 10, 12, 2);
    building.fillRoundedRect(10, -8, 10, 12, 2);
    // Door
    building.fillStyle(0x222222, 1);
    building.fillRoundedRect(-8, 5, 16, 15, 3);
    container.add(building);

    // Roof / spire
    const roof = this.add.graphics();
    roof.fillStyle(darkColor, 1);
    roof.fillTriangle(0, -45, -30, -15, 30, -15);
    roof.lineStyle(2, color, 0.6);
    roof.strokeTriangle(0, -45, -30, -15, 30, -15);
    container.add(roof);

    // Glowing crystal on top
    const glow = this.add.graphics();
    glow.fillStyle(color, 0.3);
    glow.fillCircle(0, -50, 18);
    glow.fillStyle(color, 0.6);
    glow.fillCircle(0, -50, 10);
    glow.fillStyle(0xffffff, 0.8);
    glow.fillCircle(0, -50, 5);
    container.add(glow);

    // Pulsing animation
    this.tweens.add({
      targets: glow,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    return container;
  }

  private createPlayer() {
    const iso = cartToIso(120, LANE_Y);
    this.player = this.drawHero(iso.x, iso.y, 'player');
    this.player.setDepth(depthSortKey(120, LANE_Y) + 30);
    this.add.text(iso.x, iso.y - 45, 'You', {
      fontSize: '14px', color: '#8a2be2', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(999);
  }

  private createEnemy() {
    const iso = cartToIso(ARENA_WIDTH - 120, LANE_Y);
    this.enemy = this.drawHero(iso.x, iso.y, 'enemy');
    this.enemy.setDepth(depthSortKey(ARENA_WIDTH - 120, LANE_Y) + 30);
    this.add.text(iso.x, iso.y - 45, 'Enemy', {
      fontSize: '14px', color: '#ff5252', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(999);
  }

  private createArenaBackground() {
    const g = this.add.graphics();
    
    // Dark background
    g.fillStyle(0x0a0f0a, 1);
    g.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

    // Draw isometric tiles
    for (let ty = 0; ty < TILES_Y; ty++) {
      for (let tx = 0; tx < TILES_X; tx++) {
        const cart = isoToCart(tx, ty);
        const iso = cartToIso(cart.x, cart.y);
        
        // Determine tile color based on position
        let color = 0x1a3a1a; // default grass
        let alpha = 0.85;
        
        // Lane tiles (dirt path)
        const distToLane = Math.abs(cart.y);
        if (distToLane < 70) {
          color = 0x6b5b3a;
          alpha = 0.7;
        } else if (distToLane < 90) {
          color = 0x5b4b2a;
          alpha = 0.5;
        }
        
        // Random grass variation
        if (color === 0x1a3a1a) {
          const shades = [0x1a3a1a, 0x2d5a2d, 0x3a6a3a, 0x1a4a1a];
          color = shades[Phaser.Math.Between(0, 3)];
        }
        
        this.drawIsoTile(iso.x, iso.y, color, alpha);
      }
    }
    
    // Stone decorations
    for (let i = 0; i < 20; i++) {
      const cx = Phaser.Math.Between(80, ARENA_WIDTH - 80);
      const cy = Phaser.Math.Between(80, ARENA_HEIGHT - 80);
      const iso = cartToIso(cx, cy);
      this.stoneDecorations.push({ x: cx, y: cy, r: Phaser.Math.Between(4, 10) });
      
      // Draw stone shadow
      g.fillStyle(0x000000, 0.3);
      g.fillEllipse(iso.x, iso.y + 4, 12, 6);
      // Draw stone
      g.fillStyle(0x555555, 0.7);
      g.fillEllipse(iso.x, iso.y, 10, 6);
      g.fillStyle(0x666666, 0.5);
      g.fillEllipse(iso.x - 1, iso.y - 1, 7, 4);
    }
  }

  private drawIsoTile(x: number, y: number, color: number, alpha: number) {
    const g = this.add.graphics();
    const hw = ISO_TILE_W / 2;
    const hh = ISO_TILE_H / 2;
    
    // Diamond shape
    g.fillStyle(color, alpha);
    g.beginPath();
    g.moveTo(x, y - hh);
    g.lineTo(x + hw, y);
    g.lineTo(x, y + hh);
    g.lineTo(x - hw, y);
    g.closePath();
    g.fillPath();
    
    // Tile border
    g.lineStyle(1, 0x000000, 0.08);
    g.strokePath();
  }

  private createLane() {
    const g = this.add.graphics();
    // Lane is now handled in tile rendering, but draw the blue line
    g.lineStyle(2, 0x4a90d9, 0.12);
    g.lineBetween(0, LANE_Y, ARENA_WIDTH, LANE_Y);
  }

  private createBushes() {
    const bushData: BushData[] = [
      { x: 300, y: 200, w: 110, h: 75 },
      { x: 300, y: 520, w: 110, h: 75 },
      { x: 640, y: 140, w: 130, h: 65 },
      { x: 640, y: 580, w: 130, h: 65 },
      { x: 980, y: 200, w: 110, h: 75 },
      { x: 980, y: 520, w: 110, h: 75 },
      { x: 640, y: 360, w: 90, h: 90 },
    ];
    for (const b of bushData) {
      const iso = cartToIso(b.x, b.y);
      const bush = this.add.rectangle(iso.x, iso.y, b.w, b.h * 0.6, 0x1a4a1a, 0.4);
      bush.setStrokeStyle(2, 0x2d6a2d, 0.3);
      this.bushes.push(bush);
      // Leaves
      for (let i = 0; i < 10; i++) {
        const lx = iso.x + Phaser.Math.Between(-b.w/2 + 8, b.w/2 - 8);
        const ly = iso.y + Phaser.Math.Between(-b.h/3 + 5, b.h/3 - 5);
        const lr = Phaser.Math.Between(6, 12);
        const leaf = this.add.circle(lx, ly, lr, 0x2d8a2d, 0.4);
        leaf.setDepth(depthSortKey(b.x, b.y) + 5);
      }
    }
  }

  private createTowers() {
    const towerPositions: TowerData[] = [
      { x: 350, y: LANE_Y, team: 'player', hp: TOWER_HP, maxHp: TOWER_HP, tier: 1 },
      { x: 580, y: LANE_Y, team: 'player', hp: TOWER_HP, maxHp: TOWER_HP, tier: 2 },
      { x: 700, y: LANE_Y, team: 'enemy', hp: TOWER_HP, maxHp: TOWER_HP, tier: 2 },
      { x: 930, y: LANE_Y, team: 'enemy', hp: TOWER_HP, maxHp: TOWER_HP, tier: 1 },
    ];
    for (const td of towerPositions) {
      const iso = cartToIso(td.x, td.y);
      td.x = iso.x;
      td.y = iso.y;
      const container = this.drawTower(iso.x, iso.y, td.team);
      container.setDepth(depthSortKey(td.x, td.y) + 10);
      this.towers.push({ container, data: td });
    }
  }

  private createNexuses() {
    const leftIso = cartToIso(60, LANE_Y);
    const rightIso = cartToIso(ARENA_WIDTH - 60, LANE_Y);
    this.nexusLeft = this.drawNexus(leftIso.x, leftIso.y, 'player');
    this.nexusLeft.setDepth(depthSortKey(60, LANE_Y) + 20);
    this.nexusRight = this.drawNexus(rightIso.x, rightIso.y, 'enemy');
    this.nexusRight.setDepth(depthSortKey(ARENA_WIDTH - 60, LANE_Y) + 20);
  }

  setMoveDirection(x: number, y: number) {
    this.moveDir = { x, y };
    this.playerMoving = (x !== 0 || y !== 0);
  }

  attack() {
    const now = Date.now();
    if (now - this.lastAttack < ATTACK_COOLDOWN) return;
    if (this.respawnTimer > 0) return;
    this.lastAttack = now;
    const target = this.findNearestTarget();
    if (target) {
      const iso = cartToIso(this.playerCartX, this.playerCartY);
      this.createProjectile(iso.x + 14, iso.y - 5, target.x, target.y, ATTACK_DAMAGE, 'player', false);
      this.spawnParticles(iso.x + 14, iso.y - 5, 5, 0xffd700, 3, 200);
    }
  }

  skill1() {
    const now = Date.now();
    if (now - this.skill1Cd < SKILL1_COOLDOWN) return;
    if (this.respawnTimer > 0) return;
    this.skill1Cd = now;
    const iso = cartToIso(this.playerCartX, this.playerCartY);
    // AoE effect
    const fx = this.add.circle(iso.x, iso.y, SKILL1_RANGE, 0xff6b35, 0.25);
    fx.setStrokeStyle(3, 0xff6b35, 0.6);
    this.tweens.add({ targets: fx, scale: 1.5, alpha: 0, duration: 500, onComplete: () => fx.destroy() });
    // Spark particles
    this.spawnParticles(iso.x, iso.y, 15, 0xff6b35, 5, 400);
    this.damageInRange(this.playerCartX, this.playerCartY, SKILL1_RANGE, SKILL1_DAMAGE, 'player');
  }

  skill2() {
    const now = Date.now();
    if (now - this.skill2Cd < SKILL2_COOLDOWN) return;
    if (this.respawnTimer > 0) return;
    this.skill2Cd = now;
    const target = this.findNearestTarget();
    if (target) {
      const iso = cartToIso(this.playerCartX, this.playerCartY);
      this.createProjectile(iso.x, iso.y, target.x, target.y, SKILL2_DAMAGE, 'player', true);
      this.spawnParticles(iso.x, iso.y, 10, 0x00e5ff, 4, 300);
    }
  }

  private findNearestTarget(): { x: number; y: number } | null {
    let nearest: { x: number; y: number; dist: number } | null = null as { x: number; y: number; dist: number } | null;
    const px = this.playerCartX, py = this.playerCartY;
    if (this.enemyRespawnTimer <= 0) {
      const d = Phaser.Math.Distance.Between(px, py, this.enemyCartX, this.enemyCartY);
      if (!nearest || d < nearest.dist) nearest = { x: this.enemyCartX, y: this.enemyCartY, dist: d };
    }
    for (const t of this.towers) {
      if (t.data.team === 'enemy' && t.data.hp > 0) {
        const d = Phaser.Math.Distance.Between(px, py, t.data.x, t.data.y);
        if (!nearest || d < nearest.dist) nearest = { x: t.data.x, y: t.data.y, dist: d };
      }
    }
    if (this.nexusRightHp > 0) {
      const d = Phaser.Math.Distance.Between(px, py, this.nexusRight.x, this.nexusRight.y);
      if (!nearest || d < nearest.dist) nearest = { x: this.nexusRight.x, y: this.nexusRight.y, dist: d };
    }
    return nearest ? { x: nearest.x, y: nearest.y } : null;
  }

  private createProjectile(x: number, y: number, tx: number, ty: number, damage: number, team: string, big: boolean) {
    this.projectiles.push({ x, y, tx, ty, damage, team, big });
    const color = team === 'player' ? (big ? 0x00e5ff : 0xffd700) : 0xff5252;
    const p = this.add.circle(x, y, big ? 12 : 7, color, 1);
    p.setStrokeStyle(2, 0xffffff, 0.6);
    // Glow
    p.setBlendMode(Phaser.BlendModes.ADD);
    this.projectileGraphics.push(p);
  }

  private spawnParticles(x: number, y: number, count: number, color: number, size: number, life: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Phaser.Math.Between(1, 4);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life, maxLife: life, color, size: size + Phaser.Math.Between(-1, 1),
      });
      const pg = this.add.circle(x, y, size, color, 0.8);
      pg.setBlendMode(Phaser.BlendModes.ADD);
      this.particleGraphics.push(pg);
    }
  }

  private damageInRange(x: number, y: number, range: number, damage: number, team: string) {
    if (team === 'player') {
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
    const txt = this.add.text(x, y - 25, `-${Math.round(dmg)}`, {
      fontSize: '18px', color: '#ff5252', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);
    this.tweens.add({
      targets: txt, y: y - 60, alpha: 0, duration: 900,
      onComplete: () => txt.destroy(),
    });
  }

  private gameTick() {
    if (this.gameEnded) return;
    const now = Date.now();

    // --- Player movement + run animation ---
    if (this.respawnTimer <= 0) {
      // Store cartesian position for game logic
      if (this.moveDir.x !== 0 || this.moveDir.y !== 0) {
        this.playerCartX += this.moveDir.x * (PLAYER_SPEED / 60);
        this.playerCartY += this.moveDir.y * (PLAYER_SPEED / 60);
        this.playerCartX = Phaser.Math.Clamp(this.playerCartX, 20, ARENA_WIDTH - 20);
        this.playerCartY = Phaser.Math.Clamp(this.playerCartY, 20, ARENA_HEIGHT - 20);
        
        // Convert to isometric screen position
        const iso = cartToIso(this.playerCartX, this.playerCartY);
        this.player.x = iso.x;
        this.player.y = iso.y;
        this.player.setDepth(depthSortKey(this.playerCartX, this.playerCartY) + 30);
      }

      // Run animation (bobbing)
      if (this.playerMoving) {
        this.playerAnimPhase += 0.2;
        this.player.y = this.player.y + Math.sin(this.playerAnimPhase) * 0.5;
        // Dust particles when running
        if (now % 100 < 16) {
          this.spawnParticles(this.player.x, this.player.y + 15, 2, 0x8b7b5a, 3, 300);
        }
      }
    }

    // --- Enemy AI + animation ---
    if (this.enemyRespawnTimer <= 0) {
      const dx = this.playerCartX - this.enemyCartX;
      const dy = this.playerCartY - this.enemyCartY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > ATTACK_RANGE) {
        this.enemyCartX += (dx / dist) * (PLAYER_SPEED * 0.7 / 60);
        this.enemyCartY += (dy / dist) * (PLAYER_SPEED * 0.7 / 60);
        
        // Convert to isometric
        const iso = cartToIso(this.enemyCartX, this.enemyCartY);
        this.enemy.x = iso.x;
        this.enemy.y = iso.y;
        this.enemy.setDepth(depthSortKey(this.enemyCartX, this.enemyCartY) + 30);
        
        // Enemy run animation
        this.enemyAnimPhase += 0.15;
        this.enemy.y = this.enemy.y + Math.sin(this.enemyAnimPhase) * 0.5;
      } else {
        if (now - this.lastAttack > ATTACK_COOLDOWN + 300) {
          this.lastAttack = now;
          const iso = cartToIso(this.enemyCartX, this.enemyCartY);
          const piso = cartToIso(this.playerCartX, this.playerCartY);
          this.createProjectile(iso.x - 14, iso.y - 5, piso.x, piso.y, ATTACK_DAMAGE, 'enemy', false);
          this.spawnParticles(iso.x - 14, iso.y - 5, 3, 0xff5252, 3, 200);
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
      const speed = p.big ? 10 : 8;
      if (dist < speed) {
        this.onProjectileHit(p);
        // Hit particles
        this.spawnParticles(p.x, p.y, 8, p.team === 'player' ? 0xffd700 : 0xff5252, 4, 300);
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

    // --- Update particles ---
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      const pg = this.particleGraphics[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1; // gravity
      p.life -= 16;
      pg.x = p.x;
      pg.y = p.y;
      pg.setAlpha(Math.max(0, p.life / p.maxLife));
      if (p.life <= 0) {
        pg.destroy();
        this.particles.splice(i, 1);
        this.particleGraphics.splice(i, 1);
      }
    }

    // --- Tower attacks ---
    for (const t of this.towers) {
      if (t.data.hp <= 0) continue;
      if (t.data.team === 'enemy' && this.respawnTimer <= 0) {
        const d = Phaser.Math.Distance.Between(t.data.x, t.data.y, this.playerCartX, this.playerCartY);
        if (d < TOWER_RANGE && now % 1200 < 16) {
          const piso = cartToIso(this.playerCartX, this.playerCartY);
          this.createProjectile(t.data.x, t.data.y - 30, piso.x, piso.y, TOWER_DAMAGE, 'enemy', false);
          this.spawnParticles(t.data.x, t.data.y - 30, 3, 0xd94a4a, 3, 200);
        }
      }
    }

    // --- Respawn ---
    if (this.respawnTimer > 0) {
      this.respawnTimer -= 16;
      if (this.respawnTimer <= 0) {
        this.playerHp = this.playerMaxHp;
        this.playerCartX = 120;
        this.playerCartY = LANE_Y;
        const iso = cartToIso(120, LANE_Y);
        this.player.setPosition(iso.x, iso.y);
        this.player.setVisible(true);
      }
    }
    if (this.enemyRespawnTimer > 0) {
      this.enemyRespawnTimer -= 16;
      if (this.enemyRespawnTimer <= 0) {
        this.enemyHp = this.enemyMaxHp;
        this.enemyCartX = ARENA_WIDTH - 120;
        this.enemyCartY = LANE_Y;
        const iso = cartToIso(ARENA_WIDTH - 120, LANE_Y);
        this.enemy.setPosition(iso.x, iso.y);
        this.enemy.setVisible(true);
      }
    }

    // --- Deaths ---
    if (this.playerHp <= 0 && this.respawnTimer <= 0) {
      this.deathCount++;
      this.respawnTimer = RESPAWN_TIME;
      this.player.setVisible(false);
      this.spawnParticles(this.player.x, this.player.y, 20, 0x8a2be2, 5, 600);
    }
    if (this.enemyHp <= 0 && this.enemyRespawnTimer <= 0) {
      this.killCount++;
      this.goldCount += 100;
      this.enemyRespawnTimer = RESPAWN_TIME;
      this.enemy.setVisible(false);
      this.spawnParticles(this.enemy.x, this.enemy.y, 20, 0xff5252, 5, 600);
    }

    // --- Win/lose ---
    if (this.nexusRightHp <= 0 && !this.gameEnded) {
      this.gameEnded = true;
      this.events.emit('match_end', { won: true, kills: this.killCount, deaths: this.deathCount, duration: (Date.now() - this.matchStartTime) / 1000 });
    }
    if (this.nexusLeftHp <= 0 && !this.gameEnded) {
      this.gameEnded = true;
      this.events.emit('match_end', { won: false, kills: this.killCount, deaths: this.deathCount, duration: (Date.now() - this.matchStartTime) / 1000 });
    }

    this.updateHpBars();
    this.updateMinimap();
  }

  private onProjectileHit(p: ProjectileData) {
    if (p.team === 'player') {
      if (this.enemyRespawnTimer <= 0) {
        const d = Phaser.Math.Distance.Between(p.x, p.y, this.enemy.x, this.enemy.y);
        if (d < 35) { this.enemyHp -= p.damage; this.showDamage(this.enemy.x, this.enemy.y, p.damage); return; }
      }
      for (const t of this.towers) {
        if (t.data.team === 'enemy' && t.data.hp > 0) {
          const d = Phaser.Math.Distance.Between(p.x, p.y, t.data.x, t.data.y);
          if (d < 35) { t.data.hp -= p.damage; this.showDamage(t.data.x, t.data.y, p.damage); return; }
        }
      }
      const nd = Phaser.Math.Distance.Between(p.x, p.y, this.nexusRight.x, this.nexusRight.y);
      if (nd < 45) { this.nexusRightHp -= p.damage; this.showDamage(this.nexusRight.x, this.nexusRight.y, p.damage); }
    } else {
      if (this.respawnTimer <= 0) {
        const d = Phaser.Math.Distance.Between(p.x, p.y, this.player.x, this.player.y);
        if (d < 35) { this.playerHp -= p.damage; this.showDamage(this.player.x, this.player.y, p.damage); }
      }
    }
  }

  private updateHpBars() {
    this.drawHpBar(this.player.x, this.player.y - 38, 50, this.playerHp, this.playerMaxHp, 0x4caf50);
    if (this.enemyRespawnTimer <= 0) {
      this.drawHpBar(this.enemy.x, this.enemy.y - 38, 50, this.enemyHp, this.enemyMaxHp, 0xff5252);
    }
    for (const t of this.towers) {
      if (t.data.hp > 0) {
        const color = t.data.team === 'player' ? 0x4a90d9 : 0xd94a4a;
        this.drawHpBar(t.data.x, t.data.y - 45, 45, t.data.hp, t.data.maxHp, color);
      } else {
        t.container.setAlpha(0.3);
      }
    }
    this.drawHpBar(this.nexusLeft.x, this.nexusLeft.y - 60, 70, this.nexusLeftHp, NEXUS_HP, 0x4a90d9);
    this.drawHpBar(this.nexusRight.x, this.nexusRight.y - 60, 70, this.nexusRightHp, NEXUS_HP, 0xd94a4a);
  }

  private drawHpBar(x: number, y: number, width: number, hp: number, maxHp: number, color: number) {
    const key = `hp_${Math.round(x)}_${Math.round(y)}`;
    let bar = this.hpBars.get(key);
    if (!bar) { bar = this.add.graphics(); this.hpBars.set(key, bar); }
    bar.clear();
    const pct = Math.max(0, hp / maxHp);
    bar.fillStyle(0x000000, 0.7);
    bar.fillRoundedRect(x - width/2 - 2, y - 2, width + 4, 9, 2);
    bar.fillStyle(color, 1);
    bar.fillRoundedRect(x - width/2, y, width * pct, 5, 2);
    // Highlight
    bar.fillStyle(0xffffff, 0.3);
    bar.fillRoundedRect(x - width/2, y, width * pct, 2, 1);
  }

  private updateMinimap() {
    const mmW = 130, mmH = 73;
    const mmX = ARENA_WIDTH - mmW - 10;
    const mmY = 10;
    this.minimap.clear();
    this.minimap.fillStyle(0x000000, 0.8);
    this.minimap.fillRoundedRect(mmX, mmY, mmW, mmH, 4);
    this.minimap.lineStyle(2, 0xffffff, 0.3);
    this.minimap.strokeRoundedRect(mmX, mmY, mmW, mmH, 4);
    // Lane line
    this.minimap.lineStyle(1, 0x8b7b5a, 0.4);
    this.minimap.lineBetween(mmX, mmY + mmH/2, mmX + mmW, mmY + mmH/2);
    // Player (use cartesian coords for minimap)
    const sx = mmX + (this.playerCartX / ARENA_WIDTH) * mmW;
    const sy = mmY + (this.playerCartY / ARENA_HEIGHT) * mmH;
    this.minimap.fillStyle(0x8a2be2, 1);
    this.minimap.fillCircle(sx, sy, 4);
    // Enemy
    if (this.enemyRespawnTimer <= 0) {
      const ex = mmX + (this.enemyCartX / ARENA_WIDTH) * mmW;
      const ey = mmY + (this.enemyCartY / ARENA_HEIGHT) * mmH;
      this.minimap.fillStyle(0xff5252, 1);
      this.minimap.fillCircle(ex, ey, 4);
    }
    // Towers
    for (const t of this.towers) {
      if (t.data.hp > 0) {
        const tx = mmX + (t.data.x / ARENA_WIDTH) * mmW;
        const ty = mmY + (t.data.y / ARENA_HEIGHT) * mmH;
        this.minimap.fillStyle(t.data.team === 'player' ? 0x4a90d9 : 0xd94a4a, 1);
        this.minimap.fillRect(tx - 3, ty - 3, 6, 6);
      }
    }
    // Nexuses
    this.minimap.fillStyle(0x4a90d9, 1);
    this.minimap.fillCircle(mmX + 8, mmY + mmH/2, 5);
    this.minimap.fillStyle(0xd94a4a, 1);
    this.minimap.fillCircle(mmX + mmW - 8, mmY + mmH/2, 5);
  }

  // --- UI getters ---
  getAttackCdPercent(): number { return Math.min(100, ((Date.now() - this.lastAttack) / ATTACK_COOLDOWN) * 100); }
  getSkill1CdPercent(): number { return Math.min(100, ((Date.now() - this.skill1Cd) / SKILL1_COOLDOWN) * 100); }
  getSkill2CdPercent(): number { return Math.min(100, ((Date.now() - this.skill2Cd) / SKILL2_COOLDOWN) * 100); }
  getPlayerHpPercent(): number { return Math.max(0, (this.playerHp / this.playerMaxHp) * 100); }
  getEnemyHpPercent(): number { return Math.max(0, (this.enemyHp / this.enemyMaxHp) * 100); }
  getNexusLeftHpPercent(): number { return Math.max(0, (this.nexusLeftHp / NEXUS_HP) * 100); }
  getNexusRightHpPercent(): number { return Math.max(0, (this.nexusRightHp / NEXUS_HP) * 100); }
  isPlayerDead(): boolean { return this.respawnTimer > 0; }
  getRespawnTime(): number { return Math.ceil(this.respawnTimer / 1000); }
  getKills(): number { return this.killCount; }
  getDeaths(): number { return this.deathCount; }
  getGold(): number { return this.goldCount; }
}

// --- Virtual Joystick ---
const VirtualJoystick: React.FC<{ onMove: (x: number, y: number) => void }> = ({ onMove }) => {
  const baseRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const touchId = useRef<number | null>(null);

  const handleStart = useCallback((cx: number, cy: number) => {
    if (!baseRef.current) return;
    const r = baseRef.current.getBoundingClientRect();
    const dx = cx - (r.left + r.width / 2);
    const dy = cy - (r.top + r.height / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = r.width / 2;
    if (dist > maxDist) return;
    setActive(true);
    setKnobPos({ x: dx, y: dy });
    onMove(dx / maxDist, dy / maxDist);
  }, [onMove]);

  const handleMove = useCallback((cx: number, cy: number) => {
    if (!active || !baseRef.current) return;
    const r = baseRef.current.getBoundingClientRect();
    let dx = cx - (r.left + r.width / 2);
    let dy = cy - (r.top + r.height / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = r.width / 2;
    if (dist > maxDist) { dx = (dx / dist) * maxDist; dy = (dy / dist) * maxDist; }
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
      className="relative w-36 h-36 rounded-full bg-gradient-to-br from-obsidian-700/50 to-obsidian-900/50 border-2 border-purple-neon/40 touch-none shadow-lg"
      style={{ boxShadow: '0 4px 20px rgba(138,43,226,0.2), inset 0 2px 10px rgba(0,0,0,0.3)' }}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); touchId.current = e.pointerId; handleStart(e.clientX, e.clientY); }}
      onPointerMove={(e) => { if (touchId.current === e.pointerId) handleMove(e.clientX, e.clientY); }}
      onPointerUp={(e) => { if (touchId.current === e.pointerId) handleEnd(); }}
      onPointerCancel={() => handleEnd()}
    >
      <div
        className="absolute w-16 h-16 rounded-full bg-gradient-to-br from-purple-neon to-purple-800 border-2 border-white/60 pointer-events-none"
        style={{
          left: '50%', top: '50%',
          transform: `translate(calc(-50% + ${knobPos.x}px), calc(-50% + ${knobPos.y}px))`,
          boxShadow: '0 2px 10px rgba(138,43,226,0.5), inset 0 1px 5px rgba(255,255,255,0.3)',
        }}
      />
    </div>
  );
};

// --- Action Button with Icon ---
const ActionButton: React.FC<{
  label: string;
  icon: string;
  color: string;
  glowColor: string;
  cdPercent: number;
  cdTime: number;
  onClick: () => void;
  size?: 'normal' | 'large';
}> = ({ label, icon, color, glowColor, cdPercent, cdTime, onClick, size = 'normal' }) => {
  const onCd = cdPercent < 100;
  const dim = size === 'large' ? 'w-24 h-24' : 'w-18 h-18';
  return (
    <button
      onClick={onClick}
      disabled={onCd}
      className={`relative ${dim} rounded-full border-3 font-bold transition-all touch-none flex items-center justify-center`}
      style={{
        width: size === 'large' ? 88 : 68,
        height: size === 'large' ? 88 : 68,
        borderWidth: 3,
        borderColor: onCd ? '#333' : color,
        background: onCd
          ? 'radial-gradient(circle, rgba(20,20,30,0.9), rgba(10,10,15,0.9))'
          : `radial-gradient(circle, ${color}33, ${color}11)`,
        boxShadow: onCd ? 'inset 0 2px 8px rgba(0,0,0,0.5)' : `0 0 20px ${glowColor}, inset 0 2px 8px rgba(255,255,255,0.1)`,
      }}
    >
      {/* Icon */}
      <span className="text-2xl" style={{ filter: onCd ? 'grayscale(1) opacity(0.4)' : 'none' }}>
        {icon}
      </span>
      {/* Label */}
      <span
        className="absolute -bottom-5 text-xs font-bold"
        style={{ color: onCd ? '#555' : color, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
      >
        {label}
      </span>
      {/* Cooldown overlay */}
      {onCd && (
        <div
          className="absolute inset-0 rounded-full bg-black/70 flex items-center justify-center"
          style={{ clipPath: `inset(0 0 ${cdPercent}% 0)` }}
        >
          <span className="text-white text-sm font-bold">{cdTime}s</span>
        </div>
      )}
    </button>
  );
};

// --- ArenaCanvas Component ---
export interface ArenaCanvasProps {
  character: Character;
  gameMode: 'pve' | 'pvp';
  onMatchEnd?: (result: { won: boolean; kills: number; deaths: number; duration: number }) => void;
  onBackToLobby?: () => void;
}

export const ArenaCanvas: React.FC<ArenaCanvasProps> = ({ character, gameMode, onMatchEnd, onBackToLobby }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  // Use props to prevent TS6133
  const charName = character?.name || 'Champion';
  const modeLabel = gameMode === 'pve' ? 'vs AI' : 'vs Player';
  const backToLobby = onBackToLobby;
  void backToLobby;
  console.log(charName, modeLabel);
  const sceneRef = useRef<GameScene | null>(null);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;
    
    // Delay to ensure container is sized
    const timer = setTimeout(() => {
      const scene = new GameScene();
      sceneRef.current = scene;

      const container = containerRef.current!;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;

      const game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: container,
        width: w,
        height: h,
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
        physics: { default: "arcade", arcade: { debug: false } },
        scene: [scene],
        render: { antialias: true, pixelArt: false },
        backgroundColor: "#0a0f0a",
      });
      gameRef.current = game;

      scene.events.on("match_end", (result: { won: boolean; kills: number; deaths: number; duration: number }) => {
        onMatchEnd?.(result);
      });

      const tick = setInterval(() => forceUpdate((n) => n + 1), 100);
      const handleResize = () => {
        const cw = containerRef.current?.clientWidth || window.innerWidth;
        const ch = containerRef.current?.clientHeight || window.innerHeight;
        game.scale.resize(cw, ch);
      };
      window.addEventListener("resize", handleResize);

      return () => {
        clearInterval(tick);
        window.removeEventListener("resize", handleResize);
        scene.events.off("match_end");
        game.destroy(true);
        gameRef.current = null;
      };
    }, 100);

    return () => clearTimeout(timer);
  }, [onMatchEnd]);

  const handleMove = useCallback((x: number, y: number) => sceneRef.current?.setMoveDirection(x, y), []);
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
  const kills = s?.getKills() ?? 0;
  const deaths = s?.getDeaths() ?? 0;
  const gold = s?.getGold() ?? 1000;

  return (
    <div className="relative w-full h-full bg-obsidian-900 select-none" style={{ zIndex: 0 }}>
      <div ref={containerRef} className="relative w-full h-full" style={{ minHeight: '600px' }} />

      {/* Top HUD — Nexus HP + Stats */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-3 z-30 pointer-events-none">
        <div className="flex items-center gap-2 bg-black/50 rounded-lg px-3 py-1.5 border border-blue-500/30">
          <span className="text-blue-400 text-xs font-bold" style={{ fontFamily: 'monospace' }}>NEXUS</span>
          <div className="w-20 h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/20">
            <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all" style={{ width: `${nexusLPct}%` }} />
          </div>
        </div>
        <span className="text-gold font-bold text-sm" style={{ textShadow: '0 0 10px rgba(218,165,32,0.5)' }}>⚔</span>
        <div className="flex items-center gap-2 bg-black/50 rounded-lg px-3 py-1.5 border border-red-500/30">
          <div className="w-20 h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/20">
            <div className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all" style={{ width: `${nexusRPct}%` }} />
          </div>
          <span className="text-red-400 text-xs font-bold" style={{ fontFamily: 'monospace' }}>NEXUS</span>
        </div>
      </div>

      {/* Player stats (top-left) */}
      <div className="absolute top-12 left-3 z-30 pointer-events-none">
        <div className="flex items-center gap-3 bg-black/50 rounded-xl px-3 py-2 border border-purple-neon/30">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-neon to-purple-900 border-2 border-white/50 flex items-center justify-center text-2xl shadow-lg">
            🛡️
          </div>
          {/* HP + Stats */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <span className="text-red-400 text-sm">❤️</span>
              <div className="w-28 h-3 bg-black/60 rounded-full overflow-hidden border border-white/20">
                <div className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all" style={{ width: `${playerHpPct}%` }} />
              </div>
              <span className="text-white text-xs font-bold">{Math.round(playerHpPct)}%</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-gold flex items-center gap-1">💰 {gold}</span>
              <span className="text-green-400 flex items-center gap-1">⚔️ {kills}</span>
              <span className="text-red-400 flex items-center gap-1">💀 {deaths}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enemy stats (top-right) */}
      <div className="absolute top-12 right-3 z-30 pointer-events-none">
        <div className="flex items-center gap-3 bg-black/50 rounded-xl px-3 py-2 border border-red-500/30">
          <div className="flex flex-col gap-1 items-end">
            <div className="flex items-center gap-1">
              <span className="text-white text-xs font-bold">{Math.round(enemyHpPct)}%</span>
              <div className="w-28 h-3 bg-black/60 rounded-full overflow-hidden border border-white/20">
                <div className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all" style={{ width: `${enemyHpPct}%` }} />
              </div>
              <span className="text-red-400 text-sm">❤️</span>
            </div>
            <span className="text-red-400 text-xs">{gameMode === 'pve' ? 'AI Enemy' : 'Player Enemy'}</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-900 border-2 border-white/50 flex items-center justify-center text-2xl shadow-lg">
            ⚔️
          </div>
        </div>
      </div>

      {/* Death overlay */}
      {isDead && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 pointer-events-none">
          <div className="text-center">
            <div className="text-red-500 text-5xl font-bold mb-2" style={{ textShadow: '0 0 20px rgba(255,0,0,0.5)' }}>YOU DIED</div>
            <div className="text-white text-xl">Respawn in {respawnTime}s</div>
          </div>
        </div>
      )}

      {/* Virtual Joystick (bottom-left) */}
      <div className="absolute bottom-8 left-8 z-30">
        <VirtualJoystick onMove={handleMove} />
      </div>

      {/* Action buttons (bottom-right) */}
      <div className="absolute bottom-8 right-8 z-30 flex items-end gap-4">
        <ActionButton
          label="Dash"
          icon="💨"
          color="#00e5ff"
          glowColor="rgba(0,229,255,0.4)"
          cdPercent={s2Cd}
          cdTime={Math.ceil((SKILL2_COOLDOWN - (Date.now() - (s?.getSkill2CdPercent() === 100 ? Date.now() : 0))) / 1000)}
          onClick={handleSkill2}
        />
        <ActionButton
          label="Shield"
          icon="🔥"
          color="#ff6b35"
          glowColor="rgba(255,107,53,0.4)"
          cdPercent={s1Cd}
          cdTime={Math.ceil((SKILL1_COOLDOWN - (Date.now() - (s?.getSkill1CdPercent() === 100 ? Date.now() : 0))) / 1000)}
          onClick={handleSkill1}
        />
        <ActionButton
          label="Attack"
          icon="⚔️"
          color="#daa520"
          glowColor="rgba(218,165,32,0.5)"
          cdPercent={atkCd}
          cdTime={0}
          onClick={handleAttack}
          size="large"
        />
      </div>
    </div>
  );
};
