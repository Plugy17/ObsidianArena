// ============================================
// Obsidian Arena — Wild Rift Style (Simple, Working)
// ============================================

import { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import type { Character } from '../../config/characters';

// --- Constants ---
const ARENA_W = 1280;
const ARENA_H = 720;
const LANE_Y = 380;
const SPEED = 200;
const ATK_RANGE = 90;
const ATK_DMG = 15;
const ATK_CD = 600;
const S1_CD = 5000;
const S2_CD = 8000;
const S1_DMG = 35;
const S2_DMG = 60;
const S1_RANGE = 130;
const TOWER_HP = 400;
const TOWER_RANGE = 150;
const TOWER_DMG = 25;
const NEXUS_HP = 600;
const PLAYER_HP = 120;
const RESPAWN = 5000;
const MINION_HP = 60;
const MINION_DMG = 8;
const MINION_SPEED = 60;
const MINION_GOLD = 25;
const MINION_INTERVAL = 8000;
const WAVE_COUNT = 3;

interface Tower { x: number; y: number; team: string; hp: number; maxHp: number; }
interface Minion { x: number; y: number; team: string; hp: number; maxHp: number; target: string; }

// ============================================
// GameScene
// ============================================
class GameScene extends Phaser.Scene {
  characterData: Character | null = null;
  gameMode: string = 'pve';
  onBackToLobby: () => void = () => {};

  private player!: Phaser.GameObjects.Container;
  private playerHp = PLAYER_HP;
  private playerHpMax = PLAYER_HP;
  private px = 120;
  private py = LANE_Y;

  private enemy!: Phaser.GameObjects.Container;
  private enemyHp = PLAYER_HP;
  private enemyHpMax = PLAYER_HP;
  private ex = ARENA_W - 120;
  private ey = LANE_Y;

  private towers: { obj: Phaser.GameObjects.Container; data: Tower }[] = [];
  private minions: { obj: Phaser.GameObjects.Container; data: Minion }[] = [];
  private nexusL!: Phaser.GameObjects.Container;
  private nexusR!: Phaser.GameObjects.Container;
  private nexusLHp = NEXUS_HP;
  private nexusRHp = NEXUS_HP;

  private moveDir = { x: 0, y: 0 };
  private lastAtk = 0;
  private s1Cd = 0;
  private s2Cd = 0;
  private projs: { x: number; y: number; tx: number; ty: number; dmg: number; team: string; g: Phaser.GameObjects.Arc }[] = [];
  private respawn = 0;
  private enemyRespawn = 0;
  private kills = 0;
  private deaths = 0;
  private gold = 1000;
  private startTime = 0;
  private ended = false;
  private waveTimer = 0;
  private animPhase = 0;
  private moving = false;
  private hpBars: Phaser.GameObjects.Graphics[] = [];
  private minimap!: Phaser.GameObjects.Graphics;

  constructor() { super({ key: 'GameScene' }); }

  create() {
    this.startTime = Date.now();
    this.cameras.main.setBackgroundColor('#0a0f0a');

    // Background
    const g = this.add.graphics();
    g.fillStyle(0x1a3a1a, 1);
    g.fillRect(0, 0, ARENA_W, ARENA_H);
    // Grass patches
    for (let i = 0; i < 60; i++) {
      g.fillStyle([0x2d5a2d, 0x3a6a3a, 0x1a4a1a][Phaser.Math.Between(0, 2)], 0.3);
      g.fillCircle(Phaser.Math.Between(0, ARENA_W), Phaser.Math.Between(0, ARENA_H), Phaser.Math.Between(15, 45));
    }

    // Lane
    g.fillStyle(0x6b5b3a, 0.35);
    g.fillRect(0, LANE_Y - 60, ARENA_W, 120);
    g.lineStyle(2, 0xdaa520, 0.15);
    g.lineBetween(0, LANE_Y, ARENA_W, LANE_Y);

    // Bushes
    const bushPositions = [
      [300, 180], [300, 580], [640, 120], [640, 640], [980, 180], [980, 580], [640, 380]
    ];
    for (const [bx, by] of bushPositions) {
      const bush = this.add.rectangle(bx, by, 100, 60, 0x1a4a1a, 0.5);
      bush.setStrokeStyle(2, 0x2d6a2d, 0.3);
      for (let i = 0; i < 8; i++) {
        this.add.circle(bx + Phaser.Math.Between(-40, 40), by + Phaser.Math.Between(-20, 20), Phaser.Math.Between(5, 9), 0x2d8a2d, 0.4);
      }
    }

    // Towers
    for (const td of [
      { x: 350, y: LANE_Y, team: 'player' },
      { x: 600, y: LANE_Y, team: 'player' },
      { x: 680, y: LANE_Y, team: 'enemy' },
      { x: 930, y: LANE_Y, team: 'enemy' },
    ]) {
      const c = this.add.container(td.x, td.y);
      const color = td.team === 'player' ? 0x4a90d9 : 0xd94a4a;
      const dark = td.team === 'player' ? 0x2a5089 : 0x8a2a2a;
      c.add(this.add.ellipse(0, 28, 44, 12, 0x000000, 0.3));
      const body = this.add.graphics();
      body.fillStyle(color, 0.9);
      body.fillRoundedRect(-16, -18, 32, 36, 3);
      body.lineStyle(2, dark, 1);
      body.strokeRoundedRect(-16, -18, 32, 36, 3);
      body.fillStyle(0x222222, 0.8);
      body.fillRect(-10, -12, 6, 8);
      body.fillRect(4, -12, 6, 8);
      c.add(body);
      const top = this.add.graphics();
      top.fillStyle(dark, 1);
      top.fillRect(-18, -26, 36, 8);
      top.fillRect(-18, -30, 6, 6);
      top.fillRect(-6, -30, 6, 6);
      top.fillRect(6, -30, 6, 6);
      c.add(top);
      const crystal = this.add.graphics();
      crystal.fillStyle(color, 0.8);
      crystal.fillTriangle(0, -40, -6, -30, 6, -30);
      c.add(crystal);
      this.towers.push({ obj: c, data: { ...td, hp: TOWER_HP, maxHp: TOWER_HP } });
    }

    // Nexuses
    this.nexusL = this.buildNexus(60, LANE_Y, 0x4a90d9, 0x2a5089);
    this.nexusR = this.buildNexus(ARENA_W - 60, LANE_Y, 0xd94a4a, 0x8a2a2a);

    // Player
    this.player = this.buildHero(120, LANE_Y, 0x8a2be2, 0x4a1a8a, 'You');
    // Enemy
    this.enemy = this.buildHero(ARENA_W - 120, LANE_Y, 0xff5252, 0x8a1a1a, 'Enemy');

    // Camera
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.3);
    this.cameras.main.setBounds(0, 0, ARENA_W, ARENA_H);

    // Minimap
    this.minimap = this.add.graphics().setScrollFactor(0).setDepth(100);

    // Game loop
    this.time.addEvent({ delay: 16, callback: () => this.tick(), callbackScope: this, loop: true });
  }

  private buildNexus(x: number, y: number, color: number, dark: number): Phaser.GameObjects.Container {
    const c = this.add.container(x, y);
    c.add(this.add.ellipse(0, 38, 70, 18, 0x000000, 0.4));
    const base = this.add.graphics();
    base.fillStyle(0x444444, 1);
    base.fillRoundedRect(-30, 12, 60, 22, 4);
    base.lineStyle(2, 0x222222, 1);
    base.strokeRoundedRect(-30, 12, 60, 22, 4);
    c.add(base);
    const bldg = this.add.graphics();
    bldg.fillStyle(color, 0.9);
    bldg.fillRoundedRect(-24, -14, 48, 30, 3);
    bldg.lineStyle(2, dark, 1);
    bldg.strokeRoundedRect(-24, -14, 48, 30, 3);
    bldg.fillStyle(0xffd700, 0.3);
    bldg.fillRoundedRect(-16, -8, 10, 10, 2);
    bldg.fillRoundedRect(6, -8, 10, 10, 2);
    c.add(bldg);
    const roof = this.add.graphics();
    roof.fillStyle(dark, 1);
    roof.fillTriangle(0, -42, -26, -14, 26, -14);
    c.add(roof);
    const glow = this.add.graphics();
    glow.fillStyle(color, 0.3);
    glow.fillCircle(0, -46, 16);
    glow.fillStyle(0xffffff, 0.6);
    glow.fillCircle(0, -46, 5);
    c.add(glow);
    this.tweens.add({ targets: glow, scale: 1.2, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return c;
  }

  private buildHero(x: number, y: number, color: number, dark: number, label: string): Phaser.GameObjects.Container {
    const c = this.add.container(x, y);
    c.add(this.add.ellipse(0, 18, 34, 10, 0x000000, 0.35));
    const body = this.add.graphics();
    body.fillStyle(dark, 1);
    body.fillRoundedRect(-11, -6, 22, 22, 4);
    body.lineStyle(2, color, 0.8);
    body.strokeRoundedRect(-11, -6, 22, 22, 4);
    body.fillStyle(color, 0.3);
    body.fillRoundedRect(-9, -4, 18, 7, 3);
    c.add(body);
    const head = this.add.graphics();
    head.fillStyle(0x888888, 1);
    head.fillCircle(0, -12, 9);
    head.lineStyle(2, 0x444444, 1);
    head.strokeCircle(0, -12, 9);
    head.fillStyle(0x222222, 1);
    head.fillRect(-5, -14, 10, 3);
    head.fillStyle(color, 1);
    head.fillTriangle(0, -22, -3, -16, 3, -16);
    c.add(head);
    const shield = this.add.graphics();
    shield.fillStyle(color, 0.8);
    shield.fillRoundedRect(-16, -2, 7, 14, 2);
    shield.lineStyle(2, 0xffd700, 0.5);
    shield.strokeRoundedRect(-16, -2, 7, 14, 2);
    c.add(shield);
    const sword = this.add.graphics();
    sword.fillStyle(0xcccccc, 1);
    sword.fillRect(12, -10, 3, 18);
    sword.fillStyle(0xffd700, 1);
    sword.fillRect(10, 8, 7, 3);
    c.add(sword);
    const legs = this.add.graphics();
    legs.fillStyle(dark, 1);
    legs.fillRoundedRect(-7, 14, 5, 8, 2);
    legs.fillRoundedRect(2, 14, 5, 8, 2);
    c.add(legs);
    this.add.text(x, y - 35, label, { fontSize: '12px', color: '#' + color.toString(16).padStart(6, '0'), fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);
    return c;
  }

  setMoveDir(x: number, y: number) { this.moveDir = { x, y }; this.moving = x !== 0 || y !== 0; }

  attack() {
    const now = Date.now();
    if (now - this.lastAtk < ATK_CD || this.respawn > 0) return;
    this.lastAtk = now;
    const t = this.findTarget();
    if (t) this.fire(this.px + 14, this.py - 5, t.x, t.y, ATK_DMG, 'player');
  }
  skill1() {
    const now = Date.now();
    if (now - this.s1Cd < S1_CD || this.respawn > 0) return;
    this.s1Cd = now;
    const fx = this.add.circle(this.px, this.py, S1_RANGE, 0xff6b35, 0.25);
    this.tweens.add({ targets: fx, scale: 1.5, alpha: 0, duration: 500, onComplete: () => fx.destroy() });
    this.dmgRange(this.px, this.py, S1_RANGE, S1_DMG, 'player');
  }
  skill2() {
    const now = Date.now();
    if (now - this.s2Cd < S2_CD || this.respawn > 0) return;
    this.s2Cd = now;
    const t = this.findTarget();
    if (t) this.fire(this.px, this.py, t.x, t.y, S2_DMG, 'player', true);
  }

  private findTarget(): { x: number; y: number } | null {
    let best: { x: number; y: number; dist: number } | null = null;
    const cx = this.px, cy = this.py;
    // Check minions first
    for (const m of this.minions) {
      if (m.data.team !== 'enemy' || m.data.hp <= 0) continue;
      const d = Phaser.Math.Distance.Between(cx, cy, m.data.x, m.data.y);
      if (!best || d < best.dist) best = { x: m.data.x, y: m.data.y, dist: d };
    }
    // Check enemy
    if (this.enemyRespawn <= 0) {
      const d = Phaser.Math.Distance.Between(cx, cy, this.ex, this.ey);
      if (!best || d < best.dist) best = { x: this.ex, y: this.ey, dist: d };
    }
    // Check towers
    for (const t of this.towers) {
      if (t.data.team !== 'enemy' || t.data.hp <= 0) continue;
      const d = Phaser.Math.Distance.Between(cx, cy, t.data.x, t.data.y);
      if (!best || d < best.dist) best = { x: t.data.x, y: t.data.y, dist: d };
    }
    // Check nexus
    if (this.nexusRHp > 0) {
      const d = Phaser.Math.Distance.Between(cx, cy, this.nexusR.x, this.nexusR.y);
      if (!best || d < best.dist) best = { x: this.nexusR.x, y: this.nexusR.y, dist: d };
    }
    return best ? { x: best.x, y: best.y } : null;
  }

  private fire(x: number, y: number, tx: number, ty: number, dmg: number, team: string, big = false) {
    const color = team === 'player' ? (big ? 0x00e5ff : 0xffd700) : 0xff5252;
    const g = this.add.circle(x, y, big ? 10 : 6, color, 1);
    g.setStrokeStyle(2, 0xffffff, 0.5);
    this.projs.push({ x, y, tx, ty, dmg, team, g });
  }

  private dmgRange(x: number, y: number, range: number, dmg: number, team: string) {
    if (team === 'player') {
      if (this.enemyRespawn <= 0 && Phaser.Math.Distance.Between(x, y, this.ex, this.ey) < range) {
        this.enemyHp -= dmg; this.showDmg(this.ex, this.ey, dmg);
      }
      for (const t of this.towers) {
        if (t.data.team === 'enemy' && t.data.hp > 0 && Phaser.Math.Distance.Between(x, y, t.data.x, t.data.y) < range) {
          t.data.hp -= dmg; this.showDmg(t.data.x, t.data.y, dmg);
        }
      }
      if (Phaser.Math.Distance.Between(x, y, this.nexusR.x, this.nexusR.y) < range) {
        this.nexusRHp -= dmg; this.showDmg(this.nexusR.x, this.nexusR.y, dmg);
      }
      for (const m of this.minions) {
        if (m.data.team === 'enemy' && m.data.hp > 0 && Phaser.Math.Distance.Between(x, y, m.data.x, m.data.y) < range) {
          m.data.hp -= dmg; this.showDmg(m.data.x, m.data.y, dmg);
        }
      }
    }
  }

  private showDmg(x: number, y: number, dmg: number) {
    const t = this.add.text(x, y - 20, `-${Math.round(dmg)}`, { fontSize: '16px', color: '#ff5252', fontStyle: 'bold', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);
    this.tweens.add({ targets: t, y: y - 50, alpha: 0, duration: 800, onComplete: () => t.destroy() });
  }

  private spawnMinionWave(team: string) {
    const startX = team === 'player' ? 150 : ARENA_W - 150;
    const startY = LANE_Y + Phaser.Math.Between(-20, 20);
    for (let i = 0; i < WAVE_COUNT; i++) {
      const m = { x: startX + i * 30, y: startY + i * 10, team, hp: MINION_HP, maxHp: MINION_HP, target: 'nexus' };
      const c = this.add.container(m.x, m.y);
      c.add(this.add.ellipse(0, 8, 20, 6, 0x000000, 0.3));
      const body = this.add.graphics();
      const color = team === 'player' ? 0x4a90d9 : 0xd94a4a;
      body.fillStyle(color, 0.8);
      body.fillCircle(0, 0, 8);
      body.lineStyle(2, 0xffffff, 0.5);
      body.strokeCircle(0, 0, 8);
      c.add(body);
      this.minions.push({ obj: c, data: m });
    }
  }

  private tick() {
    if (this.ended) return;
    const now = Date.now();

    // Player movement
    if (this.respawn <= 0) {
      const spd = SPEED / 60;
      this.px += this.moveDir.x * spd;
      this.py += this.moveDir.y * spd;
      this.px = Phaser.Math.Clamp(this.px, 20, ARENA_W - 20);
      this.py = Phaser.Math.Clamp(this.py, 20, ARENA_H - 20);
      this.player.x = this.px;
      this.player.y = this.py + (this.moving ? Math.sin(this.animPhase += 0.2) * 0.5 : 0);
    }

    // Enemy AI
    if (this.enemyRespawn <= 0) {
      const dx = this.px - this.ex, dy = this.py - this.ey;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > ATK_RANGE) {
        this.ex += (dx / dist) * (SPEED * 0.7 / 60);
        this.ey += (dy / dist) * (SPEED * 0.7 / 60);
        this.enemy.x = this.ex;
        this.enemy.y = this.ey + Math.sin(this.animPhase) * 0.5;
      } else if (now - this.lastAtk > ATK_CD + 500) {
        this.lastAtk = now;
        this.fire(this.ex - 14, this.ey - 5, this.px, this.py, ATK_DMG, 'enemy');
      }
    }

    // Minion AI
    for (const m of this.minions) {
      if (m.data.hp <= 0) continue;
      const targetX = m.data.team === 'player' ? ARENA_W : 0;
      const dx = targetX - m.data.x, dy = 0;
      const dist = Math.abs(dx);
      if (dist > 10) {
        m.data.x += (dx / dist) * (MINION_SPEED / 60);
        m.obj.x = m.data.x;
        m.obj.y = m.data.y;
      }
      // Minions attack towers/enemy/nexus in range
      for (const t of this.towers) {
        if (t.data.team !== m.data.team && t.data.hp > 0) {
          const d = Phaser.Math.Distance.Between(m.data.x, m.data.y, t.data.x, t.data.y);
          if (d < 50) { t.data.hp -= MINION_DMG / 10; this.showDmg(t.data.x, t.data.y, MINION_DMG / 10); }
        }
      }
      if (m.data.team === 'enemy') {
        const d = Phaser.Math.Distance.Between(m.data.x, m.data.y, this.px, this.py);
        if (d < 50) { this.playerHp -= MINION_DMG / 10; }
      }
    }

    // Projectiles
    for (let i = this.projs.length - 1; i >= 0; i--) {
      const p = this.projs[i];
      const dx = p.tx - p.x, dy = p.ty - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 8) {
        this.hit(p);
        p.g.destroy();
        this.projs.splice(i, 1);
      } else {
        p.x += (dx / dist) * 8;
        p.y += (dy / dist) * 8;
        p.g.x = p.x; p.g.y = p.y;
      }
    }

    // Tower attacks
    for (const t of this.towers) {
      if (t.data.hp <= 0 || t.data.team !== 'enemy' || this.respawn > 0) continue;
      const d = Phaser.Math.Distance.Between(t.data.x, t.data.y, this.px, this.py);
      if (d < TOWER_RANGE && now % 1200 < 16) {
        this.fire(t.data.x, t.data.y - 20, this.px, this.py, TOWER_DMG, 'enemy');
      }
    }

    // Respawn
    if (this.respawn > 0) { this.respawn -= 16; if (this.respawn <= 0) { this.playerHp = this.playerHpMax; this.px = 120; this.py = LANE_Y; this.player.setVisible(true); } }
    if (this.enemyRespawn > 0) { this.enemyRespawn -= 16; if (this.enemyRespawn <= 0) { this.enemyHp = this.enemyHpMax; this.ex = ARENA_W - 120; this.ey = LANE_Y; this.enemy.setVisible(true); } }

    // Deaths
    if (this.playerHp <= 0 && this.respawn <= 0) { this.deaths++; this.respawn = RESPAWN; this.player.setVisible(false); }
    if (this.enemyHp <= 0 && this.enemyRespawn <= 0) { this.kills++; this.gold += 100; this.enemyRespawn = RESPAWN; this.enemy.setVisible(false); }

    // Minion deaths
    for (let i = this.minions.length - 1; i >= 0; i--) {
      if (this.minions[i].data.hp <= 0) {
        this.gold += MINION_GOLD;
        this.minions[i].obj.destroy();
        this.minions.splice(i, 1);
      }
    }

    // Wave spawner
    this.waveTimer += 16;
    if (this.waveTimer >= MINION_INTERVAL) {
      this.waveTimer = 0;
      this.spawnMinionWave('player');
      this.spawnMinionWave('enemy');
    }

    // Win/lose
    if (this.nexusRHp <= 0 && !this.ended) { this.ended = true; this.events.emit('match_end', { won: true, kills: this.kills, deaths: this.deaths, duration: (Date.now() - this.startTime) / 1000 }); }
    if (this.nexusLHp <= 0 && !this.ended) { this.ended = true; this.events.emit('match_end', { won: false, kills: this.kills, deaths: this.deaths, duration: (Date.now() - this.startTime) / 1000 }); }

    this.drawHpBars();
    this.drawMinimap();
  }

  private hit(p: { x: number; y: number; dmg: number; team: string }) {
    if (p.team === 'player') {
      for (const m of this.minions) {
        if (m.data.team === 'enemy' && m.data.hp > 0 && Phaser.Math.Distance.Between(p.x, p.y, m.data.x, m.data.y) < 25) {
          m.data.hp -= p.dmg; this.showDmg(m.data.x, m.data.y, p.dmg); return;
        }
      }
      if (this.enemyRespawn <= 0 && Phaser.Math.Distance.Between(p.x, p.y, this.ex, this.ey) < 30) {
        this.enemyHp -= p.dmg; this.showDmg(this.ex, this.ey, p.dmg); return;
      }
      for (const t of this.towers) {
        if (t.data.team === 'enemy' && t.data.hp > 0 && Phaser.Math.Distance.Between(p.x, p.y, t.data.x, t.data.y) < 30) {
          t.data.hp -= p.dmg; this.showDmg(t.data.x, t.data.y, p.dmg); return;
        }
      }
      if (Phaser.Math.Distance.Between(p.x, p.y, this.nexusR.x, this.nexusR.y) < 40) {
        this.nexusRHp -= p.dmg; this.showDmg(this.nexusR.x, this.nexusR.y, p.dmg);
      }
    } else {
      if (this.respawn <= 0 && Phaser.Math.Distance.Between(p.x, p.y, this.px, this.py) < 30) {
        this.playerHp -= p.dmg; this.showDmg(this.px, this.py, p.dmg);
      }
    }
  }

  private drawHpBars() {
    for (const b of this.hpBars) b.destroy();
    this.hpBars = [];
    this.drawBar(this.px, this.py - 30, 50, this.playerHp, this.playerHpMax, 0x4caf50);
    if (this.enemyRespawn <= 0) this.drawBar(this.ex, this.ey - 30, 50, this.enemyHp, this.enemyHpMax, 0xff5252);
    for (const t of this.towers) {
      if (t.data.hp > 0) {
        this.drawBar(t.data.x, t.data.y - 35, 40, t.data.hp, t.data.maxHp, t.data.team === 'player' ? 0x4a90d9 : 0xd94a4a);
      } else {
        t.obj.setAlpha(0.3);
      }
    }
    for (const m of this.minions) {
      if (m.data.hp > 0) this.drawBar(m.data.x, m.data.y - 15, 25, m.data.hp, m.data.maxHp, m.data.team === 'player' ? 0x4a90d9 : 0xd94a4a);
    }
    this.drawBar(this.nexusL.x, this.nexusL.y - 50, 60, this.nexusLHp, NEXUS_HP, 0x4a90d9);
    this.drawBar(this.nexusR.x, this.nexusR.y - 50, 60, this.nexusRHp, NEXUS_HP, 0xd94a4a);
  }

  private drawBar(x: number, y: number, w: number, hp: number, max: number, color: number) {
    const g = this.add.graphics();
    const pct = Math.max(0, hp / max);
    g.fillStyle(0x000000, 0.7);
    g.fillRoundedRect(x - w / 2 - 1, y - 1, w + 2, 7, 2);
    g.fillStyle(color, 1);
    g.fillRoundedRect(x - w / 2, y, w * pct, 5, 2);
    this.hpBars.push(g);
  }

  private drawMinimap() {
    const mmW = 120, mmH = 68, mmX = ARENA_W - mmW - 10, mmY = 10;
    this.minimap.clear();
    this.minimap.fillStyle(0x000000, 0.7);
    this.minimap.fillRoundedRect(mmX, mmY, mmW, mmH, 4);
    this.minimap.lineStyle(1, 0xffffff, 0.2);
    this.minimap.strokeRoundedRect(mmX, mmY, mmW, mmH, 4);
    this.minimap.lineStyle(1, 0x8b7b5a, 0.3);
    this.minimap.lineBetween(mmX, mmY + mmH / 2, mmX + mmW, mmY + mmH / 2);
    const sx = mmX + (this.px / ARENA_W) * mmW, sy = mmY + (this.py / ARENA_H) * mmH;
    this.minimap.fillStyle(0x8a2be2, 1);
    this.minimap.fillCircle(sx, sy, 3);
    if (this.enemyRespawn <= 0) {
      this.minimap.fillStyle(0xff5252, 1);
      this.minimap.fillCircle(mmX + (this.ex / ARENA_W) * mmW, mmY + (this.ey / ARENA_H) * mmH, 3);
    }
    for (const t of this.towers) {
      if (t.data.hp > 0) {
        this.minimap.fillStyle(t.data.team === 'player' ? 0x4a90d9 : 0xd94a4a, 1);
        this.minimap.fillRect(mmX + (t.data.x / ARENA_W) * mmW - 2, mmY + (t.data.y / ARENA_H) * mmH - 2, 4, 4);
      }
    }
    for (const m of this.minions) {
      if (m.data.hp > 0) {
        this.minimap.fillStyle(m.data.team === 'player' ? 0x4a90d9 : 0xd94a4a, 0.5);
        this.minimap.fillCircle(mmX + (m.data.x / ARENA_W) * mmW, mmY + (m.data.y / ARENA_H) * mmH, 1.5);
      }
    }
    this.minimap.fillStyle(0x4a90d9, 1);
    this.minimap.fillCircle(mmX + 8, mmY + mmH / 2, 4);
    this.minimap.fillStyle(0xd94a4a, 1);
    this.minimap.fillCircle(mmX + mmW - 8, mmY + mmH / 2, 4);
  }

  getPlayerHpPct() { return Math.max(0, (this.playerHp / this.playerHpMax) * 100); }
  getEnemyHpPct() { return Math.max(0, (this.enemyHp / this.enemyHpMax) * 100); }
  getNexusLPct() { return Math.max(0, (this.nexusLHp / NEXUS_HP) * 100); }
  getNexusRPct() { return Math.max(0, (this.nexusRHp / NEXUS_HP) * 100); }
  getAtkCdPct() { return Math.min(100, ((Date.now() - this.lastAtk) / ATK_CD) * 100); }
  getS1CdPct() { return Math.min(100, ((Date.now() - this.s1Cd) / S1_CD) * 100); }
  getS2CdPct() { return Math.min(100, ((Date.now() - this.s2Cd) / S2_CD) * 100); }
  isDead() { return this.respawn > 0; }
  getRespawn() { return Math.ceil(this.respawn / 1000); }
  getKills() { return this.kills; }
  getDeaths() { return this.deaths; }
  getGold() { return this.gold; }
}

// ============================================
// Virtual Joystick
// ============================================
const Joystick: React.FC<{ onMove: (x: number, y: number) => void }> = ({ onMove }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const tid = useRef<number | null>(null);

  const hStart = useCallback((cx: number, cy: number) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const dx = cx - (r.left + r.width / 2), dy = cy - (r.top + r.height / 2);
    const max = r.width / 2;
    if (Math.sqrt(dx * dx + dy * dy) > max) return;
    setActive(true); setKnob({ x: dx, y: dy });
    onMove(dx / max, dy / max);
  }, [onMove]);

  const hMove = useCallback((cx: number, cy: number) => {
    if (!active || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    let dx = cx - (r.left + r.width / 2), dy = cy - (r.top + r.height / 2);
    const max = r.width / 2, dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > max) { dx = (dx / dist) * max; dy = (dy / dist) * max; }
    setKnob({ x: dx, y: dy }); onMove(dx / max, dy / max);
  }, [active, onMove]);

  const hEnd = useCallback(() => { setActive(false); setKnob({ x: 0, y: 0 }); onMove(0, 0); tid.current = null; }, [onMove]);

  return (
    <div ref={ref} className="relative w-32 h-32 rounded-full bg-obsidian-700/40 border-2 border-purple-neon/30 touch-none"
      onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); tid.current = e.pointerId; hStart(e.clientX, e.clientY); }}
      onPointerMove={e => { if (tid.current === e.pointerId) hMove(e.clientX, e.clientY); }}
      onPointerUp={e => { if (tid.current === e.pointerId) hEnd(); }}
      onPointerCancel={() => hEnd()}
    >
      <div className="absolute w-14 h-14 rounded-full bg-purple-neon/60 border-2 border-white/50 pointer-events-none"
        style={{ left: '50%', top: '50%', transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
      />
    </div>
  );
};

// ============================================
// Action Button
// ============================================
const ActionBtn: React.FC<{ label: string; icon: string; color: string; cd: number; onClick: () => void; big?: boolean }> = ({ label, icon, color, cd, onClick, big }) => {
  const onCd = cd < 100;
  const sz = big ? 88 : 68;
  return (
    <button onClick={onClick} disabled={onCd} className="relative rounded-full border-3 font-bold transition-all touch-none flex items-center justify-center"
      style={{ width: sz, height: sz, borderColor: onCd ? '#333' : color, background: onCd ? 'rgba(20,20,30,0.9)' : `${color}22`, boxShadow: onCd ? 'none' : `0 0 15px ${color}44` }}>
      <span className="text-2xl" style={{ filter: onCd ? 'grayscale(1) opacity(0.4)' : 'none' }}>{icon}</span>
      <span className="absolute -bottom-4 text-[10px] font-bold" style={{ color: onCd ? '#555' : color }}>{label}</span>
      {onCd && <div className="absolute inset-0 rounded-full bg-black/70 flex items-center justify-center" style={{ clipPath: `inset(0 0 ${cd}% 0)` }}>
        <span className="text-white text-xs font-bold">{Math.ceil((1 - cd / 100) * (label === 'ATK' ? 0.6 : label === 'S1' ? 5 : 8))}s</span>
      </div>}
    </button>
  );
};

// ============================================
// ArenaCanvas Component
// ============================================
export interface ArenaCanvasProps {
  character: Character;
  gameMode: 'pve' | 'pvp';
  onMatchEnd?: (result: { won: boolean; kills: number; deaths: number; duration: number }) => void;
  onBackToLobby?: () => void;
}

export const ArenaCanvas: React.FC<ArenaCanvasProps> = ({ character, gameMode, onMatchEnd }) => {
  const contRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<GameScene | null>(null);
  const [, force] = useState(0);
  const charName = character?.name || 'Champion';
  const modeLabel = gameMode === 'pve' ? 'vs AI' : 'vs Player';

  useEffect(() => {
    if (!contRef.current || gameRef.current) return;
    const timer = setTimeout(() => {
      const scene = new GameScene();
      scene.characterData = character;
      scene.gameMode = gameMode;
      sceneRef.current = scene;
      const c = contRef.current!;
      const game = new Phaser.Game({
        type: Phaser.AUTO, parent: c,
        width: c.clientWidth || window.innerWidth,
        height: c.clientHeight || window.innerHeight,
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
        scene: [scene],
        backgroundColor: '#0a0f0a',
      });
      gameRef.current = game;
      scene.events.on('match_end', (r: any) => onMatchEnd?.(r));
      const tick = setInterval(() => force(n => n + 1), 100);
      const resize = () => game.scale.resize(c.clientWidth || window.innerWidth, c.clientHeight || window.innerHeight);
      window.addEventListener('resize', resize);
      return () => { clearInterval(tick); window.removeEventListener('resize', resize); scene.events.off('match_end'); game.destroy(true); gameRef.current = null; };
    }, 100);
    return () => clearTimeout(timer);
  }, [character, gameMode, onMatchEnd]);

  const s = sceneRef.current;
  const hpPct = s?.getPlayerHpPct() ?? 100;
  const ehpPct = s?.getEnemyHpPct() ?? 100;
  const nlp = s?.getNexusLPct() ?? 100;
  const nrp = s?.getNexusRPct() ?? 100;
  const atk = s?.getAtkCdPct() ?? 100;
  const s1 = s?.getS1CdPct() ?? 100;
  const s2 = s?.getS2CdPct() ?? 100;
  const dead = s?.isDead() ?? false;
  const rt = s?.getRespawn() ?? 0;
  const kills = s?.getKills() ?? 0;
  const deaths = s?.getDeaths() ?? 0;
  const gold = s?.getGold() ?? 1000;

  return (
    <div className="relative w-full h-full bg-obsidian-900 select-none" style={{ zIndex: 0 }}>
      <div ref={contRef} className="relative w-full h-full" style={{ minHeight: '600px' }} />

      {/* Nexus HP */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-3 z-30 pointer-events-none">
        <div className="flex items-center gap-1 bg-black/50 rounded-lg px-2 py-1 border border-blue-500/30">
          <span className="text-blue-400 text-[10px] font-bold">NEXUS</span>
          <div className="w-16 h-2 bg-black/60 rounded-full overflow-hidden border border-white/20">
            <div className="h-full bg-blue-500 transition-all" style={{ width: `${nlp}%` }} />
          </div>
        </div>
        <span className="text-gold text-xs font-bold">VS</span>
        <div className="flex items-center gap-1 bg-black/50 rounded-lg px-2 py-1 border border-red-500/30">
          <div className="w-16 h-2 bg-black/60 rounded-full overflow-hidden border border-white/20">
            <div className="h-full bg-red-500 transition-all" style={{ width: `${nrp}%` }} />
          </div>
          <span className="text-red-400 text-[10px] font-bold">NEXUS</span>
        </div>
      </div>

      {/* Player info */}
      <div className="absolute top-10 left-2 z-30 pointer-events-none">
        <div className="flex items-center gap-2 bg-black/50 rounded-lg px-2 py-1.5 border border-purple-neon/30">
          <div className="w-8 h-8 rounded-full bg-purple-neon/60 border-2 border-white/40 flex items-center justify-center text-sm">🛡️</div>
          <div className="flex flex-col gap-0.5">
            <div className="text-[10px] text-purple-neon font-bold">{charName} ({modeLabel})</div>
            <div className="flex items-center gap-1">
              <span className="text-red-400 text-xs">❤️</span>
              <div className="w-20 h-2 bg-black/60 rounded-full overflow-hidden border border-white/20">
                <div className="h-full bg-green-500 transition-all" style={{ width: `${hpPct}%` }} />
              </div>
              <span className="text-white text-[10px] font-bold">{Math.round(hpPct)}%</span>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-gold">💰 {gold}</span>
              <span className="text-green-400">⚔️ {kills}</span>
              <span className="text-red-400">💀 {deaths}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enemy info */}
      <div className="absolute top-10 right-2 z-30 pointer-events-none">
        <div className="flex items-center gap-2 bg-black/50 rounded-lg px-2 py-1.5 border border-red-500/30">
          <div className="flex flex-col gap-0.5 items-end">
            <div className="flex items-center gap-1">
              <span className="text-white text-[10px] font-bold">{Math.round(ehpPct)}%</span>
              <div className="w-20 h-2 bg-black/60 rounded-full overflow-hidden border border-white/20">
                <div className="h-full bg-red-500 transition-all" style={{ width: `${ehpPct}%` }} />
              </div>
              <span className="text-red-400 text-xs">❤️</span>
            </div>
            <span className="text-red-400 text-[10px]">Enemy</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-red-500/60 border-2 border-white/40 flex items-center justify-center text-sm">⚔️</div>
        </div>
      </div>

      {/* Death overlay */}
      {dead && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 pointer-events-none">
          <div className="text-center">
            <div className="text-red-500 text-4xl font-bold mb-1">YOU DIED</div>
            <div className="text-white text-lg">Respawn in {rt}s</div>
          </div>
        </div>
      )}

      {/* Joystick */}
      <div className="absolute bottom-6 left-6 z-30">
        <Joystick onMove={useCallback((x: number, y: number) => sceneRef.current?.setMoveDir(x, y), [])} />
      </div>

      {/* Action buttons */}
      <div className="absolute bottom-6 right-6 z-30 flex items-end gap-3">
        <ActionBtn label="S2" icon="💨" color="#00e5ff" cd={s2} onClick={() => sceneRef.current?.skill2()} />
        <ActionBtn label="S1" icon="🔥" color="#ff6b35" cd={s1} onClick={() => sceneRef.current?.skill1()} />
        <ActionBtn label="ATK" icon="⚔️" color="#daa520" cd={atk} onClick={() => sceneRef.current?.attack()} big />
      </div>
    </div>
  );
};