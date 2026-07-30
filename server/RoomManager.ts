// ============================================
// Obsidian Arena — Room Manager
// ============================================

import type { Server, Socket } from 'socket.io';
import { GameLoop } from './GameLoop';

export interface PlayerInfo {
  socketId: string;
  telegramId: number;
  stakedAmount: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
}

export interface Room {
  id: string;
  players: Map<string, PlayerInfo>;
  gameLoop: GameLoop;
  stakedPool: number;
  isActive: boolean;
}

export interface InputCommand {
  type: 'move_to' | 'cast_skill';
  x?: number;
  y?: number;
  skillId?: number;
}

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private socketToRoom: Map<string, string> = new Map();

  constructor(private io: Server) {}

  createRoom(s1: Socket, s2: Socket): Room {
    const roomId = `room_${Date.now()}`;
    const stakedPool = (s1.data.stakedAmount || 0) + (s2.data.stakedAmount || 0);

    const players = new Map<string, PlayerInfo>();
    players.set(s1.id, {
      socketId: s1.id,
      telegramId: s1.data.telegramId,
      stakedAmount: s1.data.stakedAmount,
      x: 100, y: 300, hp: 100, maxHp: 100,
    });
    players.set(s2.id, {
      socketId: s2.id,
      telegramId: s2.data.telegramId,
      stakedAmount: s2.data.stakedAmount,
      x: 1100, y: 300, hp: 100, maxHp: 100,
    });

    const gameLoop = new GameLoop(roomId, players, this.io);
    const room: Room = { id: roomId, players, gameLoop, stakedPool, isActive: true };
    this.rooms.set(roomId, room);
    this.socketToRoom.set(s1.id, roomId);
    this.socketToRoom.set(s2.id, roomId);
    gameLoop.start();
    return room;
  }

  handleInput(socketId: string, command: InputCommand) {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return;
    const room = this.rooms.get(roomId);
    if (!room || !room.isActive) return;
    room.gameLoop.processInput(socketId, command);
  }

  handleDisconnect(socketId: string) {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return;
    const room = this.rooms.get(roomId);
    if (!room) return;
    // Opponent wins by default
    const winner = Array.from(room.players.values()).find(p => p.socketId !== socketId);
    if (winner) {
      this.io.to(roomId).emit('match_end', {
        winner: winner.socketId,
        reason: 'opponent_disconnected',
        prize: room.stakedPool * 0.95,
      });
    }
    room.gameLoop.stop();
    room.isActive = false;
    this.rooms.delete(roomId);
    this.socketToRoom.delete(socketId);
  }

  endRoom(roomId: string, winnerId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const prize = Math.floor(room.stakedPool * 0.95); // 5% commission
    this.io.to(roomId).emit('match_end', {
      winner: winnerId,
      reason: 'hp_zero',
      prize,
      commission: room.stakedPool - prize,
    });
    room.gameLoop.stop();
    room.isActive = false;
    this.rooms.delete(roomId);
    for (const sid of room.players.keys()) {
      this.socketToRoom.delete(sid);
    }
  }
}
