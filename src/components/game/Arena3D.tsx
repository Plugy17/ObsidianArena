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

  // Check collision between two units
  const checkCollision = (a: Unit, b: Unit): boolean => {
    const dx = a.x - b.x;
    const dz = a.z - b.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    return dist < (a.radius + b.radius);
  };

  // Resolve collision between two units
  const resolveCollision = (a: Unit, b: Unit) => {
    const dx = a.x - b.x;
    const dz = a.z - b.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist === 0) return;
    const minDist = a.radius + b.radius;
    const overlap = minDist - dist;
    const nx = dx / dist;
    const nz = dz / dist;
    a.x += nx * overlap * 0.5;
    a.z += nz * overlap * 0.5;
    b.x -= nx * overlap * 0.5;
    b.z -= nz * overlap * 0.5;
  };

  // Build a hero mesh with better details
  const buildHero = (color: number): THREE.Group => {
    const g = new THREE.Group();
    
    // Body armor
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(14, 22, 10),
      new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6, metalness: 0.3 })
    );
    body.position.y = 12;
    g.add(body);
    
    // Armor plates
    const armor = new THREE.Mesh(
      new THREE.BoxGeometry(16, 18, 2),
      new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.4 })
    );
    armor.position.set(0, 12, 5);
    g.add(armor);
    
    // Head
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(7, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.4, metalness: 0.2 })
    );
    head.position.y = 24;
    g.add(head);
    
    // Helmet
    const helmet = new THREE.Mesh(
      new THREE.SphereGeometry(7.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.5 })
    );
    helmet.position.y = 24;
    g.add(helmet);
    
    // Shield
    const shield = new THREE.Mesh(
      new THREE.CylinderGeometry(6, 6, 2, 8),
      new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.3, metalness: 0.7 })
    );
    shield.rotation.z = Math.PI / 2;
    shield.position.set(-12, 10, 0);
    g.add(shield);
    
    // Sword
    const sword = new THREE.Mesh(
      new THREE.BoxGeometry(2, 20, 2),
      new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.2, metalness: 0.9 })
    );
    sword.position.set(12, 10, 0);
    g.add(sword);
    
    // Sword handle
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 4, 6),
      new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.8 })
    );
    handle.position.set(12, 2, 0);
    g.add(handle);
    
    // Legs
    const leg1 = new THREE.Mesh(
      new THREE.BoxGeometry(5, 10, 6),
      new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7 })
    );
    leg1.position.set(-4, 4, 0);
    g.add(leg1);
    const leg2 = new THREE.Mesh(
      new THREE.BoxGeometry(5, 10, 6),
      new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7 })
    );
    leg2.position.set(4, 4, 0);
    g.add(leg2);
    
    // Shadow
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(14, 16),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.5;
    g.add(shadow);
    
    return g;
  };

  // Build a tower mesh with better details
  const buildTower = (color: number): THREE.Group => {
    const g = new THREE.Group();
    
    // Base platform
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(20, 24, 8, 12),
      new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9 })
    );
    base.position.y = 4;
    g.add(base);
    
    // Main tower body
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(14, 18, 35, 12),
      new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.3 })
    );
    body.position.y = 24;
    g.add(body);
    
    // Battlements
    for (let i = 0; i < 8; i++) {
      const battlement = new THREE.Mesh(
        new THREE.BoxGeometry(4, 6, 4),
        new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 })
      );
      const angle = (i / 8) * Math.PI * 2;
      battlement.position.set(Math.cos(angle) * 16, 42, Math.sin(angle) * 16);
      g.add(battlement);
    }
    
    // Crystal top
    const top = new THREE.Mesh(
      new THREE.OctahedronGeometry(6, 0),
      new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.2, metalness: 0.8, emissive: color, emissiveIntensity: 0.5 })
    );
    top.position.y = 50;
    g.add(top);
    
    return g;
  };

  // Build a nexus mesh with better details
  const buildNexus = (color: number): THREE.Group => {
    const g = new THREE.Group();
    
    // Base platform
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(35, 40, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.9 })
    );
    base.position.y = 6;
    g.add(base);
    
    // Main building
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(50, 35, 50),
      new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.3 })
    );
    body.position.y = 24;
    g.add(body);
    
    // Windows
    for (let i = 0; i < 4; i++) {
      const window = new THREE.Mesh(
        new THREE.BoxGeometry(8, 10, 2),
        new THREE.MeshStandardMaterial({ color: 0x88ccff, roughness: 0.2, emissive: 0x4488ff, emissiveIntensity: 0.5 })
      );
      const angle = (i / 4) * Math.PI * 2;
      window.position.set(Math.cos(angle) * 26, 24, Math.sin(angle) * 26);
      window.rotation.y = angle;
      g.add(window);
    }
    
    // Roof
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(30, 25, 4),
      new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 })
    );
    roof.position.y = 48;
    roof.rotation.y = Math.PI / 4;
    g.add(roof);
    
    // Crystal
    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(10, 0),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, metalness: 0.9, emissive: color, emissiveIntensity: 0.8 })
    );
    crystal.position.y = 62;
    g.add(crystal);
    
    return g;
  };

  // Build a minion mesh
  const buildMinion = (color: number): THREE.Group => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(6, 8, 8),
      new THREE.MeshStandardMaterial({ color, roughness: 0.7 })
    );
    body.position.y = 6;
    g.add(body);
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(6, 8),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.5;
    g.add(shadow);
    return g;
  };

  useEffect(() => {
    if (!mountRef.current) return;
    const mount = mountRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a3a1a);
    scene.fog = new THREE.Fog(0x1a3a1a, 500, 1200);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 1, 2000);
    camera.position.set(0, 400, 400);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    // Lighting
    const ambient = new THREE.AmbientLight(0x404060, 0.6);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffeedd, 1.2);
    dirLight.position.set(100, 200, 100);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 1000;
    dirLight.shadow.camera.left = -500;
    dirLight.shadow.camera.right = 500;
    dirLight.shadow.camera.top = 500;
    dirLight.shadow.camera.bottom = -500;
    scene.add(dirLight);
    const fillLight = new THREE.DirectionalLight(0x4488ff, 0.4);
    fillLight.position.set(-100, 100, -100);
    scene.add(fillLight);

    // Ground
    const groundGeo = new THREE.PlaneGeometry(ARENA_W, ARENA_H);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x2d5a2d, roughness: 1 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(ARENA_W / 2, 0, ARENA_H / 2 - 100);
    ground.receiveShadow = true;
    scene.add(ground);

    // Lane
    const laneMat = new THREE.MeshStandardMaterial({ color: 0x6b5b3a, roughness: 1 });
    const lane = new THREE.Mesh(new THREE.PlaneGeometry(ARENA_W, 120), laneMat);
    lane.rotation.x = -Math.PI / 2;
    lane.position.set(ARENA_W / 2, 0.5, LANE_Y + ARENA_H / 2 - 100);
    lane.receiveShadow = true;
    scene.add(lane);

    // Create units
    const playerMesh = buildHero(0x8a2be2);
    playerMesh.position.set(120, 0, LANE_Y);
    scene.add(playerMesh);

    const enemyMesh = buildHero(0xff5252);
    enemyMesh.position.set(ARENA_W - 120, 0, LANE_Y);
    scene.add(enemyMesh);

    const player: Unit = { mesh: playerMesh, hp: PLAYER_HP, maxHp: PLAYER_HP, x: 120, z: LANE_Y, team: 'player', type: 'hero', radius: COLLISION_RADIUS };
    const enemy: Unit = { mesh: enemyMesh, hp: PLAYER_HP, maxHp: PLAYER_HP, x: ARENA_W - 120, z: LANE_Y, team: 'enemy', type: 'hero', radius: COLLISION_RADIUS };

    // Towers
    const towers: Unit[] = [];
    const towerPositions = [
      { x: 350, z: LANE_Y, team: 'player' as const },
      { x: 600, z: LANE_Y, team: 'player' as const },
      { x: 680, z: LANE_Y, team: 'enemy' as const },
      { x: 930, z: LANE_Y, team: 'enemy' as const },
    ];
    for (const tp of towerPositions) {
      const color = tp.team === 'player' ? 0x4a90d9 : 0xd94a4a;
      const mesh = buildTower(color);
      mesh.position.set(tp.x, 0, tp.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      towers.push({ mesh, hp: TOWER_HP, maxHp: TOWER_HP, ...tp, team: tp.team, type: 'tower', radius: COLLISION_RADIUS });
    }

    // Nexuses
    const nexusLMesh = buildNexus(0x4a90d9);
    nexusLMesh.position.set(60, 0, LANE_Y);
    nexusLMesh.castShadow = true;
    scene.add(nexusLMesh);
    const nexusRMesh = buildNexus(0xd94a4a);
    nexusRMesh.position.set(ARENA_W - 60, 0, LANE_Y);
    nexusRMesh.castShadow = true;
    scene.add(nexusRMesh);
    const nexusL: Unit = { mesh: nexusLMesh, hp: NEXUS_HP, maxHp: NEXUS_HP, x: 60, z: LANE_Y, team: 'player', type: 'nexus', radius: COLLISION_RADIUS };
    const nexusR: Unit = { mesh: nexusRMesh, hp: NEXUS_HP, maxHp: NEXUS_HP, x: ARENA_W - 60, z: LANE_Y, team: 'enemy', type: 'nexus', radius: COLLISION_RADIUS };

    // State
    const state = {
      scene, camera, renderer,
      player, enemy, towers, minions: [] as Unit[],
      nexusL, nexusR,
      projectiles: [] as { mesh: THREE.Mesh; tx: number; tz: number; dmg: number; team: string }[],
      clock: new THREE.Clock(),
      moveDir: { x: 0, z: 0 },
      playerHp: PLAYER_HP,
      enemyHp: PLAYER_HP,
      nexusLHp: NEXUS_HP,
      nexusRHp: NEXUS_HP,
      lastAtk: 0,
      s1Cd: 0,
      s2Cd: 0,
      playerX: 120,
      playerZ: LANE_Y,
      enemyX: ARENA_W - 120,
      enemyZ: LANE_Y,
      kills: 0,
      deaths: 0,
      gold: 1000,
      respawn: 0,
      enemyRespawn: 0,
      waveTimer: 0,
      startTime: Date.now(),
      ended: false,
      animPhase: 0,
      moving: false,
      hpLabels: [] as THREE.Sprite[],
    };
    sceneRef.current = state;

    // Spawn minion wave
    const spawnWave = (team: string) => {
      const startX = team === 'player' ? 150 : ARENA_W - 150;
      const color = team === 'player' ? 0x4a90d9 : 0xd94a4a;
      for (let i = 0; i < WAVE_COUNT; i++) {
        const mesh = buildMinion(color);
        const x = startX + i * 30;
        const z = LANE_Y + (Math.random() - 0.5) * 20;
        mesh.position.set(x, 0, z);
        scene.add(mesh);
        state.minions.push({ mesh, hp: MINION_HP, maxHp: MINION_HP, x, z, team, type: 'minion', radius: COLLISION_RADIUS });
      }
    };

    // Game loop
    const gameLoop = () => {
      const dt = Math.min(state.clock.getDelta(), 0.05);
      const now = Date.now();

      // Player movement
      if (state.respawn <= 0) {
        const newX = state.playerX + state.moveDir.x * SPEED * dt;
        const newZ = state.playerZ + state.moveDir.z * SPEED * dt;
        state.playerX = Math.max(20, Math.min(ARENA_W - 20, newX));
        state.playerZ = Math.max(-300, Math.min(300, newZ));
        state.player.mesh.position.x = state.playerX;
        state.player.mesh.position.z = state.playerZ;
        state.player.x = state.playerX;
        state.player.z = state.playerZ;
        if (state.moveDir.x !== 0 || state.moveDir.z !== 0) {
          state.animPhase += dt * 8;
          state.player.mesh.position.y = Math.abs(Math.sin(state.animPhase)) * 3;
        } else {
          state.player.mesh.position.y = 0;
        }
      }

      // Collision detection and resolution
      const allUnits: Unit[] = [state.player, state.enemy, ...state.towers, ...state.minions, state.nexusL, state.nexusR];
      for (let i = 0; i < allUnits.length; i++) {
        for (let j = i + 1; j < allUnits.length; j++) {
          const a = allUnits[i];
          const b = allUnits[j];
          if (a.hp <= 0 || b.hp <= 0) continue;
          const dx = a.x - b.x;
          const dz = a.z - b.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          const minDist = a.radius + b.radius;
          if (dist < minDist && dist > 0) {
            const overlap = minDist - dist;
            const nx = dx / dist;
            const nz = dz / dist;
            // Push apart movable units
            if (a.type === 'hero' || a.type === 'minion') {
              a.x += nx * overlap * 0.5;
              a.z += nz * overlap * 0.5;
            }
            if (b.type === 'hero' || b.type === 'minion') {
              b.x -= nx * overlap * 0.5;
              b.z -= nz * overlap * 0.5;
            }
          }
        }
      }
      // Sync state positions with unit positions after collision
      state.playerX = state.player.x;
      state.playerZ = state.player.z;
      state.enemyX = state.enemy.x;
      state.enemyZ = state.enemy.z;
      // Update mesh positions
      state.player.mesh.position.x = state.playerX;
      state.player.mesh.position.z = state.playerZ;
      state.enemy.mesh.position.x = state.enemyX;
      state.enemy.mesh.position.z = state.enemyZ;

      // Enemy AI
      if (state.enemyRespawn <= 0) {
        const dx = state.playerX - state.enemyX;
        const dz = state.playerZ - state.enemyZ;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > ATK_RANGE) {
          const newX = state.enemyX + (dx / dist) * SPEED * 0.7 * dt;
          const newZ = state.enemyZ + (dz / dist) * SPEED * 0.7 * dt;
          state.enemyX = newX;
          state.enemyZ = newZ;
          state.enemy.mesh.position.x = state.enemyX;
          state.enemy.mesh.position.z = state.enemyZ;
          state.enemy.x = state.enemyX;
          state.enemy.z = state.enemyZ;
        } else if (now - state.lastAtk > ATK_CD + 500) {
          state.lastAtk = now;
          fireProjectile(state.enemyX, state.enemyZ, state.playerX, state.playerZ, ATK_DMG, 'enemy');
        }
      }

      // Minion AI
      for (const m of state.minions) {
        if (m.hp <= 0) continue;
        const targetX = m.team === 'player' ? ARENA_W : 0;
        const dx = targetX - m.x;
        const dist = Math.abs(dx);
        if (dist > 10) {
          const newX = m.x + (dx / dist) * MINION_SPD * dt;
          m.x = newX;
          m.mesh.position.x = m.x;
        }
        // Attack towers
        for (const t of towers) {
          if (t.team !== m.team && t.hp > 0) {
            const d = Math.sqrt((m.x - t.x) ** 2 + (m.z - t.z) ** 2);
            if (d < 50) {
              t.hp -= MINION_DMG * dt;
              if (t.hp < 0) t.hp = 0;
            }
          }
        }
        // Attack nexus
        if (m.team === 'player') {
          const d = Math.sqrt((m.x - nexusR.x) ** 2 + (m.z - nexusR.z) ** 2);
          if (d < 50) {
            state.nexusRHp -= MINION_DMG * dt;
            if (state.nexusRHp < 0) state.nexusRHp = 0;
          }
        }
        if (m.team === 'enemy') {
          const d = Math.sqrt((m.x - nexusL.x) ** 2 + (m.z - nexusL.z) ** 2);
          if (d < 50) {
            state.nexusLHp -= MINION_DMG * dt;
            if (state.nexusLHp < 0) state.nexusLHp = 0;
          }
          const pd = Math.sqrt((m.x - state.playerX) ** 2 + (m.z - state.playerZ) ** 2);
          if (pd < 50) state.playerHp -= MINION_DMG * dt;
        }
      }

      // Tower attacks
      for (const t of towers) {
        if (t.hp <= 0 || t.team !== 'enemy' || state.respawn > 0) continue;
        const d = Math.sqrt((t.x - state.playerX) ** 2 + (t.z - state.playerZ) ** 2);
        if (d < TOWER_RANGE && now % 1200 < 16) {
          fireProjectile(t.x, t.z, state.playerX, state.playerZ, TOWER_DMG, 'enemy');
        }
      }

      // Projectiles
      for (let i = state.projectiles.length - 1; i >= 0; i--) {
        const p = state.projectiles[i];
        const dx = p.tx - p.mesh.position.x;
        const dz = p.tz - p.mesh.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 10) {
          hit(p);
          scene.remove(p.mesh);
          state.projectiles.splice(i, 1);
        } else {
          p.mesh.position.x += (dx / dist) * 200 * dt;
          p.mesh.position.z += (dz / dist) * 200 * dt;
        }
      }

      // Respawn
      if (state.respawn > 0) {
        state.respawn -= dt * 1000;
        if (state.respawn <= 0) {
          state.playerHp = PLAYER_HP;
          state.playerX = 120;
          state.playerZ = LANE_Y;
          state.player.mesh.position.set(120, 0, LANE_Y);
          state.player.mesh.visible = true;
        }
      }
      if (state.enemyRespawn > 0) {
        state.enemyRespawn -= dt * 1000;
        if (state.enemyRespawn <= 0) {
          state.enemyHp = PLAYER_HP;
          state.enemyX = ARENA_W - 120;
          state.enemyZ = LANE_Y;
          state.enemy.mesh.position.set(ARENA_W - 120, 0, LANE_Y);
          state.enemy.mesh.visible = true;
        }
      }

      // Deaths
      if (state.playerHp <= 0 && state.respawn <= 0) {
        state.deaths++;
        state.respawn = RESPAWN;
        state.player.mesh.visible = false;
      }
      if (state.enemyHp <= 0 && state.enemyRespawn <= 0) {
        state.kills++;
        state.gold += 100;
        state.enemyRespawn = RESPAWN;
        state.enemy.mesh.visible = false;
      }

      // Minion deaths
      for (let i = state.minions.length - 1; i >= 0; i--) {
        if (state.minions[i].hp <= 0) {
          state.gold += MINION_GOLD;
          scene.remove(state.minions[i].mesh);
          state.minions.splice(i, 1);
        }
      }

      // Wave spawner
      state.waveTimer += dt * 1000;
      if (state.waveTimer >= MINION_INTERVAL) {
        state.waveTimer = 0;
        spawnWave('player');
        spawnWave('enemy');
      }

      // Win/lose
      if (state.nexusRHp <= 0 && !state.ended) {
        state.ended = true;
        onMatchEnd?.({ won: true, kills: state.kills, deaths: state.deaths, duration: (Date.now() - state.startTime) / 1000 });
      }
      if (state.nexusLHp <= 0 && !state.ended) {
        state.ended = true;
        onMatchEnd?.({ won: false, kills: state.kills, deaths: state.deaths, duration: (Date.now() - state.startTime) / 1000 });
      }

      // Update HP labels
      for (const l of state.hpLabels) scene.remove(l);
      state.hpLabels = [];
      const addLabel = (x: number, z: number, hp: number, maxHp: number, color: string, yOff: number) => {
        const pct = Math.max(0, (hp / maxHp) * 100);
        const label = makeLabel(pct.toFixed(0), color, 30);
        label.position.set(x, yOff, z);
        scene.add(label);
        state.hpLabels.push(label);
      };
      addLabel(state.playerX, state.playerZ, state.playerHp, PLAYER_HP, '#4caf50', 40);
      if (state.enemyRespawn <= 0) addLabel(state.enemyX, state.enemyZ, state.enemyHp, PLAYER_HP, '#ff5252', 40);
      for (const t of towers) {
        if (t.hp > 0) addLabel(t.x, t.z, t.hp, TOWER_HP, t.team === 'player' ? '#4a90d9' : '#d94a4a', 50);
      }
      for (const m of state.minions) {
        if (m.hp > 0) addLabel(m.x, m.z, m.hp, MINION_HP, m.team === 'player' ? '#4a90d9' : '#d94a4a', 15);
      }
      addLabel(nexusL.x, nexusL.z, state.nexusLHp, NEXUS_HP, '#4a90d9', 60);
      addLabel(nexusR.x, nexusR.z, state.nexusRHp, NEXUS_HP, '#d94a4a', 60);

      // Camera follow
      camera.position.x = state.playerX;
      camera.position.z = state.playerZ + 400;
      camera.lookAt(state.playerX, 0, state.playerZ);

      renderer.render(scene, camera);
      requestAnimationFrame(gameLoop);
    };

    const fireProjectile = (x: number, z: number, tx: number, tz: number, dmg: number, team: string) => {
      const color = team === 'player' ? 0xffd700 : 0xff5252;
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(4, 8, 8),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.5 })
      );
      mesh.position.set(x, 10, z);
      scene.add(mesh);
      state.projectiles.push({ mesh, tx, tz, dmg, team });
    };

    const hit = (p: { mesh: THREE.Mesh; dmg: number; team: string }) => {
      if (p.team === 'player') {
        for (const m of state.minions) {
          if (m.team === 'enemy' && m.hp > 0 && Math.sqrt((p.mesh.position.x - m.x) ** 2 + (p.mesh.position.z - m.z) ** 2) < 25) {
            m.hp -= p.dmg; return;
          }
        }
        if (state.enemyRespawn <= 0 && Math.sqrt((p.mesh.position.x - state.enemyX) ** 2 + (p.mesh.position.z - state.enemyZ) ** 2) < 30) {
          state.enemyHp -= p.dmg; return;
        }
        for (const t of towers) {
          if (t.team === 'enemy' && t.hp > 0 && Math.sqrt((p.mesh.position.x - t.x) ** 2 + (p.mesh.position.z - t.z) ** 2) < 30) {
            t.hp -= p.dmg; return;
          }
        }
        if (Math.sqrt((p.mesh.position.x - nexusR.x) ** 2 + (p.mesh.position.z - nexusR.z) ** 2) < 40) {
          state.nexusRHp -= p.dmg;
        }
      } else {
        if (state.respawn <= 0 && Math.sqrt((p.mesh.position.x - state.playerX) ** 2 + (p.mesh.position.z - state.playerZ) ** 2) < 30) {
          state.playerHp -= p.dmg;
        }
      }
    };

    gameLoop();
    sceneRef.current = state;

    // Resize
    const resize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', resize);

    // UI update
    const tick = setInterval(() => force(n => n + 1), 100);

    return () => {
      clearInterval(tick);
      window.removeEventListener('resize', resize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [character, gameMode, onMatchEnd]);

  const s = sceneRef.current;
  const hpPct = s ? (s.playerHp / PLAYER_HP) * 100 : 100;
  const ehpPct = s ? (s.enemyHp / PLAYER_HP) * 100 : 100;
  const nlp = s ? (s.nexusLHp / NEXUS_HP) * 100 : 100;
  const nrp = s ? (s.nexusRHp / NEXUS_HP) * 100 : 100;
  const dead = s ? s.respawn > 0 : false;
  const rt = s ? Math.ceil(s.respawn / 1000) : 0;
  const kills = s?.kills ?? 0;
  const deaths = s?.deaths ?? 0;
  const gold = s?.gold ?? 1000;

  const handleMove = useCallback((x: number, z: number) => {
    if (sceneRef.current) sceneRef.current.moveDir = { x, z };
  }, []);

  const handleAttack = useCallback(() => {
    const s = sceneRef.current;
    if (!s || Date.now() - s.lastAtk < ATK_CD || s.respawn > 0) return;
    s.lastAtk = Date.now();
    // Find nearest target
    let best: { x: number; z: number } | null = null;
    let bestDist = Infinity;
    const cx = s.playerX, cz = s.playerZ;
    for (const m of s.minions) {
      if (m.team !== 'enemy' || m.hp <= 0) continue;
      const d = Math.sqrt((cx - m.x) ** 2 + (cz - m.z) ** 2);
      if (d < bestDist) { bestDist = d; best = { x: m.x, z: m.z }; }
    }
    if (s.enemyRespawn <= 0) {
      const d = Math.sqrt((cx - s.enemyX) ** 2 + (cz - s.enemyZ) ** 2);
      if (d < bestDist) { bestDist = d; best = { x: s.enemyX, z: s.enemyZ }; }
    }
    for (const t of s.towers) {
      if (t.team !== 'enemy' || t.hp <= 0) continue;
      const d = Math.sqrt((cx - t.x) ** 2 + (cz - t.z) ** 2);
      if (d < bestDist) { bestDist = d; best = { x: t.x, z: t.z }; }
    }
    if (best) {
      const p = new THREE.Mesh(
        new THREE.SphereGeometry(4, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 0.5 })
      );
      p.position.set(cx, 10, cz);
      s.scene.add(p);
      s.projectiles.push({ mesh: p, tx: best.x, tz: best.z, dmg: ATK_DMG, team: 'player' });
    }
  }, []);

  const handleSkill1 = useCallback(() => {
    const s = sceneRef.current;
    if (!s || Date.now() - s.s1Cd < S1_CD || s.respawn > 0) return;
    s.s1Cd = Date.now();
    // AoE damage
    for (const m of s.minions) {
      if (m.team === 'enemy' && m.hp > 0 && Math.sqrt((s.playerX - m.x) ** 2 + (s.playerZ - m.z) ** 2) < S1_RANGE) {
        m.hp -= S1_DMG;
      }
    }
    if (s.enemyRespawn <= 0 && Math.sqrt((s.playerX - s.enemyX) ** 2 + (s.playerZ - s.enemyZ) ** 2) < S1_RANGE) {
      s.enemyHp -= S1_DMG;
    }
    for (const t of s.towers) {
      if (t.team === 'enemy' && t.hp > 0 && Math.sqrt((s.playerX - t.x) ** 2 + (s.playerZ - t.z) ** 2) < S1_RANGE) {
        t.hp -= S1_DMG;
      }
    }
    // Visual effect
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(2, S1_RANGE, 32),
      new THREE.MeshBasicMaterial({ color: 0xff6b35, transparent: true, opacity: 0.3, side: THREE.DoubleSide })
    );
    ring.position.set(s.playerX, 1, s.playerZ);
    s.scene.add(ring);
    setTimeout(() => s.scene.remove(ring), 500);
  }, []);

  const handleSkill2 = useCallback(() => {
    const s = sceneRef.current;
    if (!s || Date.now() - s.s2Cd < S2_CD || s.respawn > 0) return;
    s.s2Cd = Date.now();
    // Find nearest enemy
    let best: { x: number; z: number } | null = null;
    let bestDist = Infinity;
    for (const m of s.minions) {
      if (m.team !== 'enemy' || m.hp <= 0) continue;
      const d = Math.sqrt((s.playerX - m.x) ** 2 + (s.playerZ - m.z) ** 2);
      if (d < bestDist) { bestDist = d; best = { x: m.x, z: m.z }; }
    }
    if (s.enemyRespawn <= 0) {
      const d = Math.sqrt((s.playerX - s.enemyX) ** 2 + (s.playerZ - s.enemyZ) ** 2);
      if (d < bestDist) { best = { x: s.enemyX, z: s.enemyZ }; }
    }
    if (best) {
      const p = new THREE.Mesh(
        new THREE.SphereGeometry(8, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 0.5 })
      );
      p.position.set(s.playerX, 10, s.playerZ);
      s.scene.add(p);
      s.projectiles.push({ mesh: p, tx: best.x, tz: best.z, dmg: S2_DMG, team: 'player' });
    }
  }, []);

  return (
    <div ref={mountRef} className="fixed inset-0 w-screen h-screen bg-obsidian-900 select-none" style={{ zIndex: 9999 }}>
      {/* Nexus HP */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-3 z-30 pointer-events-none">
        <div className="flex items-center gap-1 bg-black/60 rounded-lg px-3 py-1.5 border border-blue-500/40">
          <span className="text-blue-400 text-xs font-bold">NEXUS</span>
          <div className="w-20 h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/20">
            <div className="h-full bg-blue-500 transition-all" style={{ width: `${nlp}%` }} />
          </div>
        </div>
        <span className="text-gold text-sm font-bold">VS</span>
        <div className="flex items-center gap-1 bg-black/60 rounded-lg px-3 py-1.5 border border-red-500/40">
          <div className="w-20 h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/20">
            <div className="h-full bg-red-500 transition-all" style={{ width: `${nrp}%` }} />
          </div>
          <span className="text-red-400 text-xs font-bold">NEXUS</span>
        </div>
      </div>

      {/* Player info */}
      <div className="absolute top-12 left-3 z-30 pointer-events-none">
        <div className="flex items-center gap-2 bg-black/60 rounded-lg px-3 py-2 border border-purple-neon/40">
          <div className="w-10 h-10 rounded-full bg-purple-neon/60 border-2 border-white/40 flex items-center justify-center text-lg">🛡️</div>
          <div className="flex flex-col gap-0.5">
            <div className="text-xs text-purple-neon font-bold">{charName} ({modeLabel})</div>
            <div className="flex items-center gap-1">
              <span className="text-red-400 text-sm">❤️</span>
              <div className="w-24 h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/20">
                <div className="h-full bg-green-500 transition-all" style={{ width: `${hpPct}%` }} />
              </div>
              <span className="text-white text-xs font-bold">{Math.round(hpPct)}%</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gold">💰 {gold}</span>
              <span className="text-green-400">⚔️ {kills}</span>
              <span className="text-red-400">💀 {deaths}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enemy info */}
      <div className="absolute top-12 right-3 z-30 pointer-events-none">
        <div className="flex items-center gap-2 bg-black/60 rounded-lg px-3 py-2 border border-red-500/40">
          <div className="flex flex-col gap-0.5 items-end">
            <div className="flex items-center gap-1">
              <span className="text-white text-xs font-bold">{Math.round(ehpPct)}%</span>
              <div className="w-24 h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/20">
                <div className="h-full bg-red-500 transition-all" style={{ width: `${ehpPct}%` }} />
              </div>
              <span className="text-red-400 text-sm">❤️</span>
            </div>
            <span className="text-red-400 text-xs">Enemy</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-red-500/60 border-2 border-white/40 flex items-center justify-center text-lg">⚔️</div>
        </div>
      </div>

      {/* Death overlay */}
      {dead && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 pointer-events-none">
          <div className="text-center">
            <div className="text-red-500 text-5xl font-bold mb-2">YOU DIED</div>
            <div className="text-white text-xl">Respawn in {rt}s</div>
          </div>
        </div>
      )}

      {/* Joystick */}
      <div className="absolute bottom-8 left-6 z-30">
        <div className="relative w-36 h-36 rounded-full bg-obsidian-700/50 border-2 border-purple-neon/40 touch-none">
          <div
            className="absolute w-16 h-16 rounded-full bg-purple-neon/70 border-2 border-white/60 pointer-events-none"
            onPointerDown={(e) => {
              const r = e.currentTarget.parentElement!.getBoundingClientRect();
              const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
              const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
              handleMove(dx, dy);
            }}
            onPointerMove={(e) => {
              if (e.buttons === 0) return;
              const r = e.currentTarget.parentElement!.getBoundingClientRect();
              const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
              const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
              handleMove(dx, dy);
            }}
            onPointerUp={() => handleMove(0, 0)}
            onPointerLeave={() => handleMove(0, 0)}
          />
        </div>
      </div>

      {/* Action buttons - Q W E R layout */}
      <div className="absolute bottom-8 right-6 z-30 flex items-end gap-3">
        <button onClick={handleSkill2} className="w-16 h-16 rounded-full border-2 border-[#00e5ff] bg-[#00e5ff]22 flex items-center justify-center text-2xl font-bold text-white touch-none shadow-lg">R</button>
        <button onClick={handleSkill1} className="w-16 h-16 rounded-full border-2 border-[#ff6b35] bg-[#ff6b35]22 flex items-center justify-center text-2xl font-bold text-white touch-none shadow-lg">E</button>
        <button onClick={handleAttack} className="w-20 h-20 rounded-full border-2 border-[#daa520] bg-[#daa520]22 flex items-center justify-center text-2xl font-bold text-white touch-none shadow-lg">Q</button>
      </div>
    </div>
  );
};