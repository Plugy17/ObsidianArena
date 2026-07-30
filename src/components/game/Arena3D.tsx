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

interface Unit {
  mesh: THREE.Group;
  hp: number;
  maxHp: number;
  x: number;
  z: number;
  team: string;
  type: 'hero' | 'tower' | 'nexus' | 'minion';
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

  // Create a text sprite for HP bars
  const makeLabel = (text: string, color: string, size: number): THREE.Sprite => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
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

  // Build a hero mesh
  const buildHero = (color: number): THREE.Group => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(12, 20, 8),
      new THREE.MeshStandardMaterial({ color, roughness: 0.8 })
    );
    body.position.y = 10;
    g.add(body);
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(6, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.5 })
    );
    head.position.y = 22;
    g.add(head);
    const shield = new THREE.Mesh(
      new THREE.BoxGeometry(8, 14, 2),
      new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.6 })
    );
    shield.position.set(-10, 10, 0);
    g.add(shield);
    const sword = new THREE.Mesh(
      new THREE.BoxGeometry(2, 16, 2),
      new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.3 })
    );
    sword.position.set(10, 8, 0);
    g.add(sword);
    // Shadow
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(12, 16),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.5;
    g.add(shadow);
    return g;
  };

  // Build a tower mesh
  const buildTower = (color: number): THREE.Group => {
    const g = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(16, 20, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9 })
    );
    base.position.y = 4;
    g.add(base);
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(12, 14, 30, 8),
      new THREE.MeshStandardMaterial({ color, roughness: 0.7 })
    );
    body.position.y = 22;
    g.add(body);
    const top = new THREE.Mesh(
      new THREE.CylinderGeometry(4, 6, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.4, emissive: color, emissiveIntensity: 0.3 })
    );
    top.position.y = 36;
    g.add(top);
    return g;
  };

  // Build a nexus mesh
  const buildNexus = (color: number): THREE.Group => {
    const g = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(30, 35, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.9 })
    );
    base.position.y = 5;
    g.add(base);
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(40, 30, 40),
      new THREE.MeshStandardMaterial({ color, roughness: 0.7 })
    );
    body.position.y = 20;
    g.add(body);
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(25, 20, 4),
      new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 })
    );
    roof.position.y = 40;
    roof.rotation.y = Math.PI / 4;
    g.add(roof);
    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(8),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: color, emissiveIntensity: 0.8 })
    );
    crystal.position.y = 50;
    g.add(crystal);
    return g;
  };

  // Build a minion mesh
  const buildMinion = (color: number): THREE.Group => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(5, 6, 6),
      new THREE.MeshStandardMaterial({ color, roughness: 0.8 })
    );
    body.position.y = 5;
    g.add(body);
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(5, 8),
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
    const ambient = new THREE.AmbientLight(0x404060, 0.5);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffeedd, 1);
    dirLight.position.set(100, 200, 100);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);
    const fillLight = new THREE.DirectionalLight(0x4488ff, 0.3);
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
    scene.add(lane);

    // Create units
    const playerMesh = buildHero(0x8a2be2);
    playerMesh.position.set(120, 0, LANE_Y);
    scene.add(playerMesh);

    const enemyMesh = buildHero(0xff5252);
    enemyMesh.position.set(ARENA_W - 120, 0, LANE_Y);
    scene.add(enemyMesh);

    const player: Unit = { mesh: playerMesh, hp: PLAYER_HP, maxHp: PLAYER_HP, x: 120, z: LANE_Y, team: 'player', type: 'hero' };
    const enemy: Unit = { mesh: enemyMesh, hp: PLAYER_HP, maxHp: PLAYER_HP, x: ARENA_W - 120, z: LANE_Y, team: 'enemy', type: 'hero' };

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
      scene.add(mesh);
      towers.push({ mesh, hp: TOWER_HP, maxHp: TOWER_HP, ...tp, team: tp.team, type: 'tower' });
    }

    // Nexuses
    const nexusLMesh = buildNexus(0x4a90d9);
    nexusLMesh.position.set(60, 0, LANE_Y);
    scene.add(nexusLMesh);
    const nexusRMesh = buildNexus(0xd94a4a);
    nexusRMesh.position.set(ARENA_W - 60, 0, LANE_Y);
    scene.add(nexusRMesh);
    const nexusL: Unit = { mesh: nexusLMesh, hp: NEXUS_HP, maxHp: NEXUS_HP, x: 60, z: LANE_Y, team: 'player', type: 'nexus' };
    const nexusR: Unit = { mesh: nexusRMesh, hp: NEXUS_HP, maxHp: NEXUS_HP, x: ARENA_W - 60, z: LANE_Y, team: 'enemy', type: 'nexus' };

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
        state.minions.push({ mesh, hp: MINION_HP, maxHp: MINION_HP, x, z, team, type: 'minion' });
      }
    };

    // Game loop
    const gameLoop = () => {
      const dt = Math.min(state.clock.getDelta(), 0.05);
      const now = Date.now();

      // Player movement
      if (state.respawn <= 0) {
        state.playerX += state.moveDir.x * SPEED * dt;
        state.playerZ += state.moveDir.z * SPEED * dt;
        state.playerX = Math.max(20, Math.min(ARENA_W - 20, state.playerX));
        state.playerZ = Math.max(-300, Math.min(300, state.playerZ));
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

      // Enemy AI
      if (state.enemyRespawn <= 0) {
        const dx = state.playerX - state.enemyX;
        const dz = state.playerZ - state.enemyZ;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > ATK_RANGE) {
          state.enemyX += (dx / dist) * SPEED * 0.7 * dt;
          state.enemyZ += (dz / dist) * SPEED * 0.7 * dt;
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
          m.x += (dx / dist) * MINION_SPD * dt;
          m.mesh.position.x = m.x;
        }
        // Attack towers
        for (const t of towers) {
          if (t.team !== m.team && t.hp > 0) {
            const d = Math.sqrt((m.x - t.x) ** 2 + (m.z - t.z) ** 2);
            if (d < 50) t.hp -= MINION_DMG * dt;
          }
        }
        if (m.team === 'enemy') {
          const d = Math.sqrt((m.x - state.playerX) ** 2 + (m.z - state.playerZ) ** 2);
          if (d < 50) state.playerHp -= MINION_DMG * dt;
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
      mount.removeChild(renderer.domElement);
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
    <div className="relative w-full h-full bg-obsidian-900 select-none" style={{ zIndex: 0 }}>
      <div ref={mountRef} className="relative w-full h-full" style={{ minHeight: '600px' }} />

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
        <div className="relative w-32 h-32 rounded-full bg-obsidian-700/40 border-2 border-purple-neon/30 touch-none">
          <div
            className="absolute w-14 h-14 rounded-full bg-purple-neon/60 border-2 border-white/50 pointer-events-none"
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

      {/* Action buttons */}
      <div className="absolute bottom-6 right-6 z-30 flex items-end gap-3">
        <button onClick={handleSkill2} className="w-16 h-16 rounded-full border-2 border-[#00e5ff] bg-[#00e5ff]22 flex items-center justify-center text-2xl touch-none">💨</button>
        <button onClick={handleSkill1} className="w-16 h-16 rounded-full border-2 border-[#ff6b35] bg-[#ff6b35]22 flex items-center justify-center text-2xl touch-none">🔥</button>
        <button onClick={handleAttack} className="w-20 h-20 rounded-full border-2 border-[#daa520] bg-[#daa520]22 flex items-center justify-center text-2xl touch-none">⚔️</button>
      </div>
    </div>
  );
};