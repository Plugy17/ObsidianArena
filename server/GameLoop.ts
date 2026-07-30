// ============================================
// Obsidian Arena — Game Loop (30 FPS server tick)
// ============================================

import type { Server } from 'socket.io';
import type { PlayerInfo, InputCommand } from './RoomManager';

const TICK_RATE = 30; // FPS
const TICK_INTERVAL = 1000 / TICK_RATE;
const PLAYER_SPEED = 200; // px per second
const ATTACK_RANGE = 60;
const ATTACK_DAMAGE = 10;
const SKILL_DAMAGE = 25;
const SKILL_RANGE = 150;
const SKILL_COOLDOWNS: Record<number, number> = { 1: 5000, 2: 8000 };

export class GameLoop {
  private intervalId: NodeJS.Timeout | null = null;
  private inputs: Map<string, InputCommand[]> = new Map();
  private cooldowns: Map<string, Record<number, number>> = new Map();
  private lastTickTime = 0;
  private winner: string | null = null;

  constructor(
    private roomId: string,
    private players: Map<string, PlayerInfo>,
    private io: Server
  ) {}

  start() {
    this.lastTickTime = Date.now();
    this.intervalId = setInterval(() => this.tick(), TICK_INTERVAL);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  processInput(socketId: string, command: InputCommand) {
    if (!this.inputs.has(socketId)) this.inputs.set(socketId, []);
    this.inputs.get(socketId)!.push(command);
  }

  private tick() {
    const now = Date.now();
    const dt = (now - this.lastTickTime) / 1000; // seconds
    this.lastTickTime = now;

    // Process inputs
    for (const [socketId, commands] of this.inputs) {
      const player = this.players.get(socketId);
      if (!player) continue;
      for (const cmd of commands) {
        if (cmd.type === 'move_to' && cmd.x !== undefined && cmd.y !== undefined) {
          // Move towards target
          const dx = cmd.x - player.x;
          const dy = cmd.y - player.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 5) {
            const moveDist = Math.min(dist, PLAYER_SPEED * dt);
            player.x += (dx / dist) * moveDist;
            player.y += (dy / dist) * moveDist;
            // Clamp to arena
            player.x = Math.max(20, Math.min(1180, player.x));
            player.y = Math.max(20, Math.min(580, player.y));
          }
        } else if (cmd.type === 'cast_skill' && cmd.skillId !== undefined) {
          // Check cooldown
          if (!this.cooldowns.has(socketId)) this.cooldowns.set(socketId, {});
          const cds = this.cooldowns.get(socketId)!;
          const lastUsed = cds[cmd.skillId] || 0;
          if (now - lastUsed >= SKILL_COOLDOWNS[cmd.skillId]) {
            cds[cmd.skillId] = now;
            // Find enemy and check hit
            for (const [enemyId, enemy] of this.players) {
              if (enemyId === socketId) continue;
              const edist = Math.sqrt(
                Math.pow(enemy.x - player.x, 2) + Math.pow(enemy.y - player.y, 2)
              );
              if (edist < SKILL_RANGE) {
                enemy.hp -= SKILL_DAMAGE;
              }
            }
          }
        }
      }
    }
    this.inputs.clear();

    // Auto-attack check
    const playerList = Array.from(this.players.values());
    if (playerList.length === 2) {
      const p1 = playerList[0];
      const p2 = playerList[1];
      const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
      if (dist < ATTACK_RANGE) {
        // Both take damage (simplified)
        p2.hp -= ATTACK_DAMAGE * dt;
        p1.hp -= ATTACK_DAMAGE * dt;
      }
    }

    // Check win condition
    for (const [socketId, player] of this.players) {
      if (player.hp <= 0 && !this.winner) {
        player.hp = 0;
        const winner = Array.from(this.players.values()).find(p => p.socketId !== socketId);
        if (winner) {
          this.winner = winner.socketId;
          this.io.to(this.roomId).emit('match_end', {
            winner: winner.socketId,
            reason: 'hp_zero',
          });
          this.stop();
          return;
        }
      }
    }

    // Broadcast game state (compressed)
    const state = {
      players: Array.from(this.players.values()).map(p => ({
        id: p.socketId,
        x: Math.round(p.x),
        y: Math.round(p.y),
        hp: Math.round(p.hp),
        maxHp: p.maxHp,
      })),
      timestamp: now,
    };
    this.io.to(this.roomId).emit('game_state', state);
  }
}
