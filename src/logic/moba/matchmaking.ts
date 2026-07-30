// ============================================
// Obsidian Arena — Matchmaking System
// ============================================

import type { MatchMode, MatchConfig } from './types';
import type { CharacterData } from './unitFactory';
import { DEFAULT_MATCH_CONFIG } from './unitFactory';

// --- Matchmaking Queue Entry ---
export interface QueueEntry {
  playerId: string;
  character: CharacterData;
  mode: MatchMode;
  joinTime: number;
  skillRating: number;
}

// --- Match Result ---
export interface MatchResultData {
  matchId: string;
  mode: MatchMode;
  playerId: string;
  playerCharacter: CharacterData;
  enemyCharacter: CharacterData | null;
  config: MatchConfig;
  startTime: number;
}

// --- Matchmaking Event Types ---
export type MatchmakingEvent =
  | { type: 'queued'; playerId: string; position: number; waitTime: number }
  | { type: 'match_found'; match: MatchResultData }
  | { type: 'cancelled'; playerId: string };

// --- Matchmaking Callbacks ---
export interface MatchmakingCallbacks {
  onMatchFound: (match: MatchResultData) => void;
  onQueueUpdate: (position: number, waitTime: number) => void;
  onCancelled: () => void;
}

// --- Matchmaking Queue ---
export class MatchmakingQueue {
  private queue: QueueEntry[] = [];
  private matches: Map<string, MatchResultData> = new Map();
  private callbacks: Map<string, MatchmakingCallbacks> = new Map();
  private searchInterval: number | null = null;
  private readonly SEARCH_INTERVAL = 1000; // ms
  private readonly MAX_WAIT_TIME = 60000; // 60 seconds
  private readonly SKILL_RANGE = 100; // initial skill rating range
  private readonly SKILL_RANGE_GROWTH = 50; // increase per 10 seconds

  constructor() {
    this.startSearch();
  }

  // --- Start matchmaking search loop ---
  private startSearch(): void {
    if (this.searchInterval !== null) return;

    this.searchInterval = window.setInterval(() => {
      this.processQueue();
    }, this.SEARCH_INTERVAL);
  }

  // --- Stop matchmaking search loop ---
  stopSearch(): void {
    if (this.searchInterval !== null) {
      clearInterval(this.searchInterval);
      this.searchInterval = null;
    }
  }

  // --- Join queue ---
  joinQueue(
    playerId: string,
    character: CharacterData,
    mode: MatchMode,
    callbacks: MatchmakingCallbacks,
    skillRating: number = 1000
  ): void {
    // Remove if already in queue
    this.leaveQueue(playerId);

    const entry: QueueEntry = {
      playerId,
      character,
      mode,
      joinTime: Date.now(),
      skillRating,
    };

    this.queue.push(entry);
    this.callbacks.set(playerId, callbacks);

    // Notify immediately
    callbacks.onQueueUpdate(1, 0);
  }

  // --- Leave queue ---
  leaveQueue(playerId: string): void {
    this.queue = this.queue.filter(e => e.playerId !== playerId);
    const callbacks = this.callbacks.get(playerId);
    if (callbacks) {
      callbacks.onCancelled();
      this.callbacks.delete(playerId);
    }
  }

  // --- Process queue and find matches ---
  private processQueue(): void {
    if (this.queue.length === 0) return;

    // Group by mode
    const pveQueue = this.queue.filter(e => e.mode === 'pve');
    const pvpQueue = this.queue.filter(e => e.mode === 'pvp');

    // Process PvP matches
    this.findPvPMatches(pvpQueue);

    // Process PvE matches (always can start)
    this.findPvEMatches(pveQueue);

    // Update queue positions
    this.updateQueuePositions();
  }

  // --- Find PvP matches ---
  private findPvPMatches(queue: QueueEntry[]): void {
    if (queue.length < 2) return;

    // Sort by skill rating
    const sorted = [...queue].sort((a, b) => a.skillRating - b.skillRating);

    // Try to find pairs within skill range
    const matched: string[] = [];

    for (let i = 0; i < sorted.length - 1; i++) {
      if (matched.includes(sorted[i].playerId)) continue;

      const player1 = sorted[i];
      const waitTime = Date.now() - player1.joinTime;
      const currentRange =
        this.SKILL_RANGE + Math.floor(waitTime / 10000) * this.SKILL_RANGE_GROWTH;

      // Find best match
      let bestMatch: QueueEntry | null = null;
      let bestDiff = Infinity;

      for (let j = i + 1; j < sorted.length; j++) {
        if (matched.includes(sorted[j].playerId)) continue;

        const diff = Math.abs(sorted[j].skillRating - player1.skillRating);
        if (diff <= currentRange && diff < bestDiff) {
          bestDiff = diff;
          bestMatch = sorted[j];
        }
      }

      if (bestMatch) {
        matched.push(player1.playerId, bestMatch.playerId);
        this.createMatch(player1, bestMatch, 'pvp');
      }
    }

    // Remove matched players from queue
    this.queue = this.queue.filter(e => !matched.includes(e.playerId));
  }

  // --- Find PvE matches (can start solo) ---
  private findPvEMatches(queue: QueueEntry[]): void {
    for (const entry of queue) {
      // PvE can start immediately
      const enemyCharacter = this.generateEnemyCharacter(entry.character);
      this.createPvEMatch(entry, enemyCharacter);
    }

    // Clear PvE queue
    this.queue = this.queue.filter(e => e.mode !== 'pve');
  }

  // --- Create a match ---
  private createMatch(
    player1: QueueEntry,
    player2: QueueEntry,
    mode: MatchMode
  ): void {
    const matchId = `match-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const match: MatchResultData = {
      matchId,
      mode,
      playerId: player1.playerId,
      playerCharacter: player1.character,
      enemyCharacter: player2.character,
      config: { ...DEFAULT_MATCH_CONFIG, mode },
      startTime: Date.now(),
    };

    this.matches.set(matchId, match);

    // Notify both players
    const callbacks1 = this.callbacks.get(player1.playerId);
    const callbacks2 = this.callbacks.get(player2.playerId);

    if (callbacks1) {
      callbacks1.onMatchFound(match);
      this.callbacks.delete(player1.playerId);
    }
    if (callbacks2) {
      callbacks2.onMatchFound(match);
      this.callbacks.delete(player2.playerId);
    }
  }

  // --- Create a PvE match ---
  private createPvEMatch(
    entry: QueueEntry,
    enemyCharacter: CharacterData
  ): void {
    const matchId = `match-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const match: MatchResultData = {
      matchId,
      mode: 'pve',
      playerId: entry.playerId,
      playerCharacter: entry.character,
      enemyCharacter,
      config: { ...DEFAULT_MATCH_CONFIG, mode: 'pve' },
      startTime: Date.now(),
    };

    this.matches.set(matchId, match);

    const callbacks = this.callbacks.get(entry.playerId);
    if (callbacks) {
      callbacks.onMatchFound(match);
      this.callbacks.delete(entry.playerId);
    }
  }

  // --- Generate enemy character for PvE ---
  private generateEnemyCharacter(playerCharacter: CharacterData): CharacterData {
    // Create a scaled enemy based on player character
    return {
      ...playerCharacter,
      id: `bot-${playerCharacter.id}`,
      name: `${playerCharacter.name} (Бот)`,
      stats: {
        hp: Math.round(playerCharacter.stats.hp * 1.5),
        atk: Math.round(playerCharacter.stats.atk * 1.2),
        def: Math.round(playerCharacter.stats.def * 1.1),
        spd: playerCharacter.stats.spd,
      },
    };
  }

  // --- Update queue positions ---
  private updateQueuePositions(): void {
    const now = Date.now();

    for (let i = 0; i < this.queue.length; i++) {
      const entry = this.queue[i];
      const waitTime = now - entry.joinTime;
      const callbacks = this.callbacks.get(entry.playerId);

      if (callbacks) {
        callbacks.onQueueUpdate(i + 1, waitTime);
      }

      // Auto-cancel if wait time exceeds max
      if (waitTime >= this.MAX_WAIT_TIME) {
        this.leaveQueue(entry.playerId);
      }
    }
  }

  // --- Get queue size ---
  getQueueSize(): number {
    return this.queue.length;
  }

  // --- Get queue position ---
  getQueuePosition(playerId: string): number {
    return this.queue.findIndex(e => e.playerId === playerId) + 1;
  }

  // --- Check if in queue ---
  isInQueue(playerId: string): boolean {
    return this.queue.some(e => e.playerId === playerId);
  }

  // --- Get active matches ---
  getMatches(): MatchResultData[] {
    return Array.from(this.matches.values());
  }
}

// --- Singleton instance ---
let matchmakingInstance: MatchmakingQueue | null = null;

export const getMatchmaking = (): MatchmakingQueue => {
  if (!matchmakingInstance) {
    matchmakingInstance = new MatchmakingQueue();
  }
  return matchmakingInstance;
};

// --- Cleanup ---
export const cleanupMatchmaking = (): void => {
  if (matchmakingInstance) {
    matchmakingInstance.stopSearch();
    matchmakingInstance = null;
  }
};
