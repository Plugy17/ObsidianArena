// ============================================
// Obsidian Arena — Game Server (Socket.io)
// ============================================

import { createServer } from 'http';
import { Server } from 'socket.io';
import { RoomManager } from './RoomManager';
import { GameLoop } from './GameLoop';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

const roomManager = new RoomManager(io);

// --- Matchmaking queue ---
const queue: string[] = [];

io.on('connection', (socket) => {
  console.log(`[Server] Player connected: ${socket.id}`);

  // --- Join matchmaking queue ---
  socket.on('join_queue', (data: { telegramId: number; stakedAmount: number }) => {
    console.log(`[Queue] ${socket.id} joined with stake ${data.stakedAmount} OBS`);
    queue.push(socket.id);
    socket.data.telegramId = data.telegramId;
    socket.data.stakedAmount = data.stakedAmount;

    // Match 2 players
    if (queue.length >= 2) {
      const p1 = queue.shift()!;
      const p2 = queue.shift()!;
      const s1 = io.sockets.sockets.get(p1);
      const s2 = io.sockets.sockets.get(p2);
      if (s1 && s2) {
        const room = roomManager.createRoom(s1, s2);
        s1.join(room.id);
        s2.join(room.id);
        // Send match_start with spawn positions
        io.to(room.id).emit('match_start', {
          roomId: room.id,
          stakedPool: room.stakedPool,
          players: {
            player1: { id: s1.id, x: 100, y: 300, side: 'left' },
            player2: { id: s2.id, x: 1100, y: 300, side: 'right' },
          },
        });
        console.log(`[Match] Room ${room.id} created — match starting`);
      }
    }
  });

  // --- Player input (move) ---
  socket.on('move_to', (data: { x: number; y: number }) => {
    roomManager.handleInput(socket.id, { type: 'move_to', x: data.x, y: data.y });
  });

  // --- Player input (skill) ---
  socket.on('cast_skill', (data: { skillId: number }) => {
    roomManager.handleInput(socket.id, { type: 'cast_skill', skillId: data.skillId });
  });

  // --- Disconnect ---
  socket.on('disconnect', () => {
    console.log(`[Server] Player disconnected: ${socket.id}`);
    const idx = queue.indexOf(socket.id);
    if (idx !== -1) queue.splice(idx, 1);
    roomManager.handleDisconnect(socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`[Server] Obsidian Arena running on port ${PORT}`);
});

export { io, GameLoop };
