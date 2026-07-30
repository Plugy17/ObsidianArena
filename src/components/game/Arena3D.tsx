// ============================================
// Obsidian Arena — 3D Game Engine (Three.js)
// ============================================

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import type { Character } from '../../config/characters';

// --- Constants ---
const ARENA_W = 1280;
const ARENA_H = 720;
const LANE_Y = 0;
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
const MINION_SPD = 60;
const MINION_DMG = 8;
const MINION_GOLD = 25;
const MINION_INTERVAL = 8000;
const WAVE_COUNT = 3;
const COLLISION_RADIUS = 20;

interface Unit {
  mesh: THREE.Group;
  hp: number;
  maxHp: number;
  x: number;
  z: number;
  team: string;
  type: 'hero' | 'tower' | 'nexus' | 'minion';
  radius: number;
}

// ============================================
// 3D Arena Component
// ============================================
export interface Arena3DProps {
  character: Character;
  gameMode: 'pve' | 'pvp';
  onMatchEnd?: (result: { won: boolean; kills: number; deaths: number; duration: number }) => void;
  onBackToLobby?: () => void;
}

export const Arena3D: React.FC<Arena3DProps> = ({ character, gameMode, onMatchEnd }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    player: Unit;
    enemy: Unit;
    towers: Unit[];
    minions: Unit[];
    nexusL: Unit;
    nexusR: Unit;
    projectiles: { mesh: THREE.Mesh; tx: number; tz: number; dmg: number; team: string }[];
    clock: THREE.Clock;
    moveDir: { x: number; z: number };
    playerHp: number;
    enemyHp: number;
    nexusLHp: number;
    nexusRHp: number;
    lastAtk: number;
    s1Cd: number;
    s2Cd: number;
    playerX: number;
    playerZ: number;
    enemyX: number;
    enemyZ: number;
    kills: number;
    deaths: number;
    gold: number;
    respawn: number;
    enemyRespawn: number;
    waveTimer: number;
    startTime: number;
    ended: boolean;
    animPhase: number;
    moving: boolean;
    hpLabels: THREE.Sprite[];
  } | null>(null);

  const [, force] = useState(0);
  const charName = character?.name || 'Champion';
  const modeLabel = gameMode === 'pve' ? 'vs AI' : 'vs Player';

  // Fullscreen + orientation on mount
  useEffect(() => {
    const el = mountRef.current;
    if (el) {
      el.requestFullscreen?.().catch(() => {});
      // Try to lock orientation to landscape
      if (screen.orientation && (screen.orientation as any).lock) {
        (screen.orientation as any).lock('landscape').catch(() => {});
      }
    }
    return () => {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      if (screen.orientation && (screen.orientation as any).unlock) {
        (screen.orientation as any).unlock();
      }
    };
  }, []);

  // Create a text sprite for HP bars
  const makeLabel = (text: string, color: string, size: number): THREE.Sprite => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 8, 128, 16);
    ctx.fillStyle = color;
    ctx.fillRect(2, 10, Math.min(124, (parseFloat(text) / 100) * 124), 12);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(2, 10, 124, 12);
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(size, size * 0.25, 1);
    return sprite;
  };

