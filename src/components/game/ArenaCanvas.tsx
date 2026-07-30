// ============================================
// Obsidian Arena — Phaser Arena Canvas
// ============================================

import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';

// --- Arena constants ---
const ARENA_WIDTH = 1200;
const ARENA_HEIGHT = 600;
const PLAYER_SPEED = 200;
const SKILL_COOLDOWNS = [5000, 8000]; // ms

// --- Skill cooldown UI state ---
interface SkillState {
  id: number;
  name: string;
  cooldown: number;
  lastUsed: number;
}

// --- GameScene ---
class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private enemy!: Phaser.Physics.Arcade.Sprite;
  private moveTarget: Phaser.GameObjects.Arc | null = null;
  private bushes: Phaser.GameObjects.Rectangle[] = [];
  private skillEffects: Phaser.GameObjects.Arc[] = [];

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // --- Grid background ---
    this.createGridBackground();

    // --- Arena boundaries ---
    this.createBoundaries();

    // --- Bases (left & right edges) ---
    void this.add.rectangle(40, ARENA_HEIGHT / 2, 60, 120, 0x4caf50, 0.6);
    void this.add.rectangle(ARENA_WIDTH - 40, ARENA_HEIGHT / 2, 60, 120, 0xff5252, 0.6);
    this.add.text(40, ARENA_HEIGHT / 2 - 80, 'BASE', { fontSize: '12px', color: '#4caf50' }).setOrigin(0.5);
    this.add.text(ARENA_WIDTH - 40, ARENA_HEIGHT / 2 - 80, 'BASE', { fontSize: '12px', color: '#ff5252' }).setOrigin(0.5);

    // --- Tower in center ---
    void this.add.rectangle(ARENA_WIDTH / 2, ARENA_HEIGHT / 2, 50, 50, 0xffeb3b, 0.7);
    this.add.text(ARENA_WIDTH / 2, ARENA_HEIGHT / 2, 'TOWER', { fontSize: '10px', color: '#fff' }).setOrigin(0.5);

    // --- Bush zones (stealth areas) ---
    this.createBushes();

    // --- Player sprite (left side) ---
    this.player = this.physics.add.sprite(100, ARENA_HEIGHT / 2, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setTint(0x8a2be2);

    // --- Enemy sprite (right side) ---
    this.enemy = this.physics.add.sprite(ARENA_WIDTH - 100, ARENA_HEIGHT / 2, 'player');
    this.enemy.setCollideWorldBounds(true);
    this.enemy.setTint(0xff5252);

    // --- Tap-to-move input ---
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.movePlayerTo(pointer.x, pointer.y);
    });

    // --- Camera follows player ---
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
  }

  private createGridBackground() {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x1a1a2e, 0.3);
    for (let x = 0; x <= ARENA_WIDTH; x += 40) {
      graphics.moveTo(x, 0);
      graphics.lineTo(x, ARENA_HEIGHT);
    }
    for (let y = 0; y <= ARENA_HEIGHT; y += 40) {
      graphics.moveTo(0, y);
      graphics.lineTo(ARENA_WIDTH, y);
    }
    graphics.strokePath();
    this.cameras.main.setBackgroundColor('#0a0a12');
  }

  private createBoundaries() {
    const bounds = this.add.graphics();
    bounds.lineStyle(3, 0x8a2be2, 0.5);
    bounds.strokeRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
    this.physics.world.setBounds(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
  }

  private createBushes() {
    const bushPositions = [
      { x: 300, y: 150, w: 80, h: 60 },
      { x: 300, y: 450, w: 80, h: 60 },
      { x: 900, y: 150, w: 80, h: 60 },
      { x: 900, y: 450, w: 80, h: 60 },
      { x: 600, y: 100, w: 100, h: 50 },
      { x: 600, y: 500, w: 100, h: 50 },
    ];
    for (const b of bushPositions) {
      const bush = this.add.rectangle(b.x, b.y, b.w, b.h, 0x2d5a2d, 0.5);
      this.add.text(b.x, b.y, 'BUSH', { fontSize: '8px', color: '#4caf50' }).setOrigin(0.5);
      this.bushes.push(bush);
    }
  }

  private movePlayerTo(x: number, y: number) {
    // Clamp to arena bounds
    const targetX = Phaser.Math.Clamp(x, 20, ARENA_WIDTH - 20);
    const targetY = Phaser.Math.Clamp(y, 20, ARENA_HEIGHT - 20);

    // Move with physics velocity
    this.physics.moveTo(this.player, targetX, targetY, PLAYER_SPEED);

    // Rotation towards target
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, targetX, targetY);
    this.player.rotation = angle + Math.PI / 2;

    // Click marker animation
    if (this.moveTarget) this.moveTarget.destroy();
    this.moveTarget = this.add.circle(targetX, targetY, 15, 0x00e5ff, 0.6);
    this.tweens.add({
      targets: this.moveTarget,
      scale: 0,
      alpha: 0,
      duration: 600,
      onComplete: () => {
        this.moveTarget?.destroy();
        this.moveTarget = null;
      },
    });

    // Stop when reaching target
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, targetX, targetY);
    this.time.delayedCall((distance / PLAYER_SPEED) * 1000, () => {
      this.player.setVelocity(0, 0);
    });
  }

  // --- Cast skill (called from React UI) ---
  castSkill(skillId: number) {
    const effect = this.add.circle(this.player.x, this.player.y, 40, skillId === 1 ? 0xff6b35 : 0x00e5ff, 0.7);
    this.skillEffects.push(effect);
    this.tweens.add({
      targets: effect,
      scale: 2,
      alpha: 0,
      duration: 500,
      onComplete: () => effect.destroy(),
    });
    // Check hit on enemy
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.enemy.x, this.enemy.y);
    if (dist < 150) {
      this.enemy.setTint(0xff0000);
      this.time.delayedCall(200, () => this.enemy.setTint(0xff5252));
    }
  }

  update() {
    // Update logic (movement handled by physics)
  }
}

// --- ArenaCanvas Component ---
export interface ArenaCanvasProps {
  onSkillCast?: (skillId: number) => void;
}

export const ArenaCanvas: React.FC<ArenaCanvasProps> = ({ onSkillCast }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<GameScene | null>(null);
  const [skills, setSkills] = useState<SkillState[]>([
    { id: 1, name: 'Skill 1', cooldown: SKILL_COOLDOWNS[0], lastUsed: 0 },
    { id: 2, name: 'Skill 2', cooldown: SKILL_COOLDOWNS[1], lastUsed: 0 },
  ]);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    // Create simple texture for player
    const scene = new GameScene();
    sceneRef.current = scene;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: ARENA_WIDTH,
      height: ARENA_HEIGHT,
      physics: {
        default: 'arcade',
        arcade: { debug: false },
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [scene],
    });

    // Generate player texture
    // Create a simple circle texture after preload
    const graphics = new Phaser.GameObjects.Graphics(scene);
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(16, 16, 16);
    graphics.generateTexture('player', 32, 32);
    graphics.destroy();
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(16, 16, 16);
    graphics.generateTexture('player', 32, 32);
    graphics.destroy();

    gameRef.current = game;

    // Cooldown UI tick
    const tickInterval = setInterval(() => forceUpdate((n) => n + 1), 100);

    return () => {
      clearInterval(tickInterval);
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  const handleSkillPress = (skillId: number) => {
    const now = Date.now();
    const skill = skills.find((s) => s.id === skillId);
    if (!skill) return;
    if (now - skill.lastUsed < skill.cooldown) return; // On cooldown

    // Update skill state
    setSkills((prev) =>
      prev.map((s) => (s.id === skillId ? { ...s, lastUsed: now } : s))
    );

    // Cast in Phaser scene
    sceneRef.current?.castSkill(skillId);
    onSkillCast?.(skillId);
  };

  const getCooldownPercent = (skill: SkillState) => {
    const elapsed = Date.now() - skill.lastUsed;
    if (elapsed >= skill.cooldown) return 0;
    return Math.ceil((elapsed / skill.cooldown) * 100);
  };

  const isOnCooldown = (skill: SkillState) => {
    return Date.now() - skill.lastUsed < skill.cooldown;
  };

  return (
    <div className="relative w-full h-full">
      {/* Phaser canvas container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* UI Overlay — Skill buttons */}
      <div className="absolute bottom-4 right-4 flex gap-3 z-10">
        {skills.map((skill) => {
          const cd = isOnCooldown(skill);
          const cdPercent = getCooldownPercent(skill);
          return (
            <button
              key={skill.id}
              onClick={() => handleSkillPress(skill.id)}
              disabled={cd}
              className={`relative w-16 h-16 rounded-full border-2 font-bold text-sm transition-all ${
                cd
                  ? 'border-gray-600 bg-gray-800/80 text-gray-500'
                  : 'border-purple-neon bg-obsidian-700/80 text-white hover:scale-110 active:scale-95'
              }`}
              style={{
                boxShadow: cd ? 'none' : '0 0 15px rgba(138,43,226,0.5)',
              }}
            >
              {skill.name}
              {cd && (
                <div
                  className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center"
                  style={{
                    clipPath: `inset(0 0 ${cdPercent}% 0)`,
                  }}
                >
                  <span className="text-xs text-white">
                    {Math.ceil((skill.cooldown - (Date.now() - skill.lastUsed)) / 1000)}s
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
