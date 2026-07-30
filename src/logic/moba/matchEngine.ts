// ============================================
// Obsidian Arena — Match Engine
// ============================================

import type {
  Vector2D,
  ChampionEntity,
  CreepEntity,
  Tower,
  Nexus,
  Lane,
  Wave,
  Skillshot,
  MatchStateData,
  MatchState,
  MatchResult,
  MatchMode,
  MatchConfig,
  InputCommand,
  MatchEvent,
  CombatEntity,
  AbilityDefinition,
} from './types';
import {
  calculateDistance,
  normalizeVector,
  vectorToTarget,
  calculateSkillshotTrajectory,
  updateSkillshotPosition,
  checkSkillshotCollision,
} from './vectorEngine';
import {
  createCooldownManager,
  tickCooldowns,
  useAbility,
  isAbilityReady,
  getCooldownProgress,
} from './cooldownManager';
import {
  createInitialMatchState,
  createWave,
  DEFAULT_MATCH_CONFIG,
  LANE_DEFINITIONS,
} from './unitFactory';
import type { CharacterData } from './unitFactory';

// --- Match Engine Class ---
export class MatchEngine {
  private state: MatchStateData;
  private config: MatchConfig;
  private events: MatchEvent[] = [];
  private lastUpdateTime: number = 0;
  private waveNumbers: Map<string, number> = new Map();
  private playerPathIndex: Map<string, number> = new Map();
  private enemyPathIndex: Map<string, number> = new Map();
  private abilityDefs: AbilityDefinition[];
  private characterData: CharacterData;
  private enemyCharacterData: CharacterData | null;
  private pendingCommands: InputCommand[] = [];

  constructor(
    matchId: string,
    mode: MatchMode,
    playerCharacter: CharacterData,
    enemyCharacter: CharacterData | null,
    abilityDefs?: AbilityDefinition[],
    customConfig?: Partial<MatchConfig>
  ) {
    this.characterData = playerCharacter;
    this.enemyCharacterData = enemyCharacter;
    this.abilityDefs = abilityDefs || [];

    this.config = {
      mode,
      mapName: 'Obsidian Arena',
      gameTimeLimit: DEFAULT_MATCH_CONFIG.gameTimeLimit,
      creepSpawnInterval: DEFAULT_MATCH_CONFIG.creepSpawnInterval,
      creepWaveSize: DEFAULT_MATCH_CONFIG.creepWaveSize,
      towerRange: DEFAULT_MATCH_CONFIG.towerRange,
      towerAttackSpeed: DEFAULT_MATCH_CONFIG.towerAttackSpeed,
      nexusHealth: DEFAULT_MATCH_CONFIG.nexusHealth,
      towerHealth: DEFAULT_MATCH_CONFIG.towerHealth,
      startingGold: DEFAULT_MATCH_CONFIG.startingGold,
      startingLevel: DEFAULT_MATCH_CONFIG.startingLevel,
      xpPerKill: DEFAULT_MATCH_CONFIG.xpPerKill,
      goldPerKill: DEFAULT_MATCH_CONFIG.goldPerKill,
      goldPerAssist: DEFAULT_MATCH_CONFIG.goldPerAssist,
      goldPerMinion: DEFAULT_MATCH_CONFIG.goldPerMinion,
      ...customConfig,
    };

    const initialState = createInitialMatchState(
      matchId,
      mode,
      playerCharacter,
      enemyCharacter,
      abilityDefs
    );

    this.state = {
      matchId,
      mode,
      state: 'waiting',
      gameTime: 0,
      playerChampion: initialState.playerChampion,
      enemyChampions: initialState.enemyChampions,
      creeps: [],
      towers: initialState.towers,
      nexuses: initialState.nexuses,
      lanes: initialState.lanes,
      waves: [],
      skillshots: [],
      cooldownManagers: new Map(),
      matchResult: null,
      playerKills: 0,
      playerDeaths: 0,
      playerAssists: 0,
      playerGold: this.config.startingGold,
      playerLevel: this.config.startingLevel,
      playerXP: 0,
      elapsedTime: 0,
    };

    // Initialize cooldown managers for all champions
    this.state.cooldownManagers.set(
      this.state.playerChampion.id,
      this.state.playerChampion.cooldownManager
    );
    for (const enemy of this.state.enemyChampions) {
      this.state.cooldownManagers.set(enemy.id, enemy.cooldownManager);
    }

    // Initialize wave numbers for each lane
    for (const lane of this.state.lanes) {
      this.waveNumbers.set(`${lane.type}-player`, 0);
      this.waveNumbers.set(`${lane.type}-enemy`, 0);
    }
  }

  // --- Start the match ---
  start(): void {
    this.state.state = 'playing';
    this.lastUpdateTime = Date.now();
  }

  // --- Submit input command ---
  submitCommand(command: InputCommand): void {
    this.pendingCommands.push(command);
  }

  // --- Main update loop ---
  update(deltaTime: number): void {
    if (this.state.state !== 'playing') return;

    this.state.gameTime += deltaTime;
    this.state.elapsedTime = Math.floor(this.state.gameTime / 1000);

    // Process pending commands
    this.processCommands();

    // Update cooldowns
    this.updateCooldowns(deltaTime);

    // Spawn creep waves
    this.spawnWaves();

    // Update creep movement and AI
    this.updateCreeps(deltaTime);

    // Update champion AI (enemies)
    this.updateEnemyChampions(deltaTime);

    // Update towers
    this.updateTowers(deltaTime);

    // Update skillshots
    this.updateSkillshots(deltaTime);

    // Update player champion (respawn, etc.)
    this.updatePlayerChampion(deltaTime);

    // Check win conditions
    this.checkWinConditions();

    // Check time limit
    if (this.state.gameTime >= this.config.gameTimeLimit) {
      this.endMatch('draw');
    }
  }

  // --- Process queued input commands ---
  private processCommands(): void {
    for (const command of this.pendingCommands) {
      switch (command.type) {
        case 'move':
          if (command.position && this.state.playerChampion.isAlive) {
            this.moveChampion(this.state.playerChampion, command.position);
          }
          break;
        case 'attack':
          if (this.state.playerChampion.isAlive) {
            this.state.playerChampion.targetId = command.targetId || null;
            if (command.position) {
              this.state.playerChampion.targetId = null;
              this.moveChampion(this.state.playerChampion, command.position);
            }
          }
          break;
        case 'ability':
          if (command.abilityKey && this.state.playerChampion.isAlive) {
            this.castAbility(
              this.state.playerChampion,
              command.abilityKey,
              command.position
            );
          }
          break;
        case 'stop':
          this.state.playerChampion.targetId = null;
          break;
        case 'hold':
          this.state.playerChampion.targetId = null;
          break;
      }
    }
    this.pendingCommands = [];
  }

  // --- Update all cooldown managers ---
  private updateCooldowns(deltaTime: number): void {
    for (const [id, manager] of this.state.cooldownManagers) {
      this.state.cooldownManagers.set(id, tickCooldowns(manager, deltaTime));
    }
  }

  // --- Spawn creep waves ---
  private spawnWaves(): void {
    for (const lane of this.state.lanes) {
      for (const team of ['player', 'enemy'] as const) {
        const key = `${lane.type}-${team}`;
        const waveNumber = (this.waveNumbers.get(key) || 0) + 1;

        // Check if it's time to spawn a new wave
        const shouldSpawn =
          this.state.gameTime >=
          (waveNumber - 1) * this.config.creepSpawnInterval +
            this.config.creepSpawnInterval;

        if (shouldSpawn) {
          const wave = createWave(lane, team, waveNumber, this.state.gameTime);
          this.state.creeps.push(...wave.creeps);
          this.waveNumbers.set(key, waveNumber);

          this.events.push({
            type: 'creep_spawn',
            timestamp: this.state.gameTime,
            data: { lane: lane.type, team, waveNumber, creepCount: wave.creeps.length },
          });
        }
      }
    }
  }

  // --- Update creep movement and combat ---
  private updateCreeps(deltaTime: number): void {
    const deltaSec = deltaTime / 1000;

    for (const creep of this.state.creeps) {
      if (!creep.isAlive) continue;

      // Find path based on team
      const lane = this.state.lanes.find(l => l.type === this.getCreepLane(creep))!;
      const path = creep.team === 'player' ? lane.playerPath : lane.enemyPath;

      // Find next waypoint
      const pathKey = `${creep.id}`;
      let pathIndex = this.playerPathIndex.get(pathKey) || 0;
      if (creep.team === 'enemy') {
        pathIndex = this.enemyPathIndex.get(pathKey) || 0;
      }

      // Move towards next waypoint
      if (pathIndex < path.length) {
        const target = path[pathIndex];
        const direction = normalizeVector(vectorToTarget(creep.position, target));
        const distance = calculateDistance(creep.position, target);
        const moveDistance = creep.moveSpeed * deltaSec;

        if (distance <= moveDistance) {
          creep.position = { ...target };
          if (creep.team === 'player') {
            this.playerPathIndex.set(pathKey, pathIndex + 1);
          } else {
            this.enemyPathIndex.set(pathKey, pathIndex + 1);
          }
        } else {
          creep.position.x += direction.x * moveDistance;
          creep.position.y += direction.y * moveDistance;
        }
      }

      // Attack nearby enemies
      const enemies = this.getNearbyEnemies(creep);
      if (enemies.length > 0) {
        const target = enemies[0];
        const attackRange = creep.attackRange;
        const dist = calculateDistance(creep.position, target.position);

        if (dist <= attackRange) {
          this.dealDamage(creep, target, creep.attack);
        }
      }
    }

    // Remove dead creeps
    this.state.creeps = this.state.creeps.filter(c => c.isAlive || c.health > 0);
  }

  // --- Get lane for a creep ---
  private getCreepLane(creep: CreepEntity): string {
    // Determine lane by position - simplified
    const midLane = this.state.lanes.find(l => l.type === 'mid')!;
    const distToMid = calculateDistance(creep.position, midLane.playerSpawn);

    // Check if creep is near top or bot lane
    const topLane = this.state.lanes.find(l => l.type === 'top')!;
    const botLane = this.state.lanes.find(l => l.type === 'bot')!;

    const distToTop = calculateDistance(creep.position, topLane.playerSpawn);
    const distToBot = calculateDistance(creep.position, botLane.playerSpawn);

    if (distToTop < distToMid && distToTop < distToBot) return 'top';
    if (distToBot < distToMid && distToBot < distToTop) return 'bot';
    return 'mid';
  }

  // --- Get nearby enemy units for a creep ---
  private getNearbyEnemies(creep: CreepEntity): CombatEntity[] {
    const enemies: CombatEntity[] = [];

    // Check champions
    for (const champ of this.state.enemyChampions) {
      if (champ.team !== creep.team && champ.isAlive) {
        enemies.push(champ);
      }
    }
    for (const champ of [this.state.playerChampion]) {
      if (champ.team !== creep.team && champ.isAlive) {
        enemies.push(champ);
      }
    }

    // Check other creeps
    for (const otherCreep of this.state.creeps) {
      if (otherCreep.team !== creep.team && otherCreep.isAlive) {
        enemies.push(otherCreep);
      }
    }

    // Check towers
    for (const tower of this.state.towers) {
      if (tower.team !== creep.team && tower.isAlive) {
        enemies.push(tower as unknown as CombatEntity);
      }
    }

    // Check nexus
    for (const nexus of this.state.nexuses) {
      if (nexus.team !== creep.team && nexus.isAlive) {
        enemies.push(nexus as unknown as CombatEntity);
      }
    }

    return enemies;
  }

  // --- Update enemy champion AI ---
  private updateEnemyChampions(deltaTime: number): void {
    for (const enemy of this.state.enemyChampions) {
      if (!enemy.isAlive) {
        // Check respawn
        if (enemy.respawnTime > 0) {
          enemy.respawnTime -= deltaTime;
          if (enemy.respawnTime <= 0) {
            this.respawnChampion(enemy);
          }
        }
        continue;
      }

      // Simple AI: move towards player or nearest enemy structure
      const target = this.findAITarget(enemy);
      if (target) {
        enemy.targetId = target.id;

        const dist = calculateDistance(enemy.position, target.position);
        const attackRange = enemy.attackRange;

        if (dist > attackRange) {
          // Move towards target
          this.moveChampion(enemy, target.position);
        } else {
          // Attack target
          this.dealDamage(enemy, target, enemy.attack);
        }
      }
    }
  }

  // --- Find AI target for enemy champion ---
  private findAITarget(champion: ChampionEntity): CombatEntity | null {
    // Priority: player champion > creeps > towers > nexus
    if (this.state.playerChampion.isAlive) {
      const dist = calculateDistance(champion.position, this.state.playerChampion.position);
      if (dist < 1200) return this.state.playerChampion;
    }

    // Find nearest creep
    let nearestCreep: CreepEntity | null = null;
    let nearestDist = Infinity;
    for (const creep of this.state.creeps) {
      if (creep.team !== champion.team && creep.isAlive) {
        const dist = calculateDistance(champion.position, creep.position);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestCreep = creep;
        }
      }
    }
    if (nearestCreep && nearestDist < 800) return nearestCreep;

    // Find nearest tower
    let nearestTower: Tower | null = null;
    nearestDist = Infinity;
    for (const tower of this.state.towers) {
      if (tower.team !== champion.team && tower.isAlive) {
        const dist = calculateDistance(champion.position, tower.position);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestTower = tower;
        }
      }
    }
    if (nearestTower && nearestDist < 1000) return nearestTower as unknown as CombatEntity;

    // Find nearest nexus
    for (const nexus of this.state.nexuses) {
      if (nexus.team !== champion.team && nexus.isAlive) {
        return nexus as unknown as CombatEntity;
      }
    }

    return null;
  }

  // --- Move champion towards position ---
  private moveChampion(champion: ChampionEntity, target: Vector2D): void {
    const direction = normalizeVector(vectorToTarget(champion.position, target));
    const deltaSec = 16 / 1000; // approximate frame time
    champion.position.x += direction.x * champion.moveSpeed * deltaSec;
    champion.position.y += direction.y * champion.moveSpeed * deltaSec;
  }

  // --- Cast ability ---
  private castAbility(
    champion: ChampionEntity,
    key: 'Q' | 'W' | 'E' | 'R',
    position?: Vector2D
  ): void {
    const abilityId = key;
    const manager = this.state.cooldownManagers.get(champion.id);
    if (!manager || !isAbilityReady(manager, abilityId)) return;

    const abilityDef = this.abilityDefs.find(a => a.key === key);
    if (!abilityDef) return;

    // Use the ability (starts cooldown)
    useAbility(manager, abilityId);

    // Create skillshot if applicable
    if (abilityDef.targetType === 'skillshot' && position) {
      const skillshot = calculateSkillshotTrajectory(
        champion.position,
        position,
        abilityDef.speed || 800,
        abilityDef.skillshotType || 'line',
        abilityDef.radius || 30,
        abilityDef.range || 600,
        abilityDef.damage,
        champion.id
      );
      this.state.skillshots.push(skillshot);
    }

    // Direct damage for non-skillshot abilities
    if (abilityDef.targetType === 'enemy' && champion.targetId) {
      const target = this.findEntityById(champion.targetId);
      if (target) {
        this.dealDamage(champion, target, abilityDef.damage);
      }
    }

    // Self-heal for self-target abilities
    if (abilityDef.targetType === 'self') {
      const healAmount = abilityDef.damage; // damage field used as heal amount
      champion.health = Math.min(champion.maxHealth, champion.health + healAmount);
    }
  }

  // --- Update towers ---
  private updateTowers(deltaTime: number): void {
    const now = this.state.gameTime;

    for (const tower of this.state.towers) {
      if (!tower.isAlive) continue;

      // Find target
      if (!tower.targetId || !this.isEntityAlive(tower.targetId)) {
        tower.targetId = this.findTowerTarget(tower);
      }

      if (tower.targetId) {
        const target = this.findEntityById(tower.targetId);
        if (target) {
          const dist = calculateDistance(tower.position, target.position);
          if (dist <= tower.range) {
            // Check attack cooldown
            const timeSinceLastAttack = now - tower.lastAttackTime;
            const attackCooldown = 1000 / tower.attackSpeed;

            if (timeSinceLastAttack >= attackCooldown) {
              this.dealDamage(tower as unknown as CombatEntity, target, tower.attack);
              tower.lastAttackTime = now;
            }
          }
        }
      }
    }
  }

  // --- Find target for a tower ---
  private findTowerTarget(tower: Tower): string | null {
    // Priority: enemy creeps > enemy champions > player champion
    let nearest: { entity: CombatEntity; dist: number } | null = null;

    // Check creeps
    for (const creep of this.state.creeps) {
      if (creep.team !== tower.team && creep.isAlive) {
        const dist = calculateDistance(tower.position, creep.position);
        if (dist <= tower.range) {
          if (!nearest || dist < nearest.dist) {
            nearest = { entity: creep, dist };
          }
        }
      }
    }

    // Check champions
    for (const champ of this.state.enemyChampions) {
      if (champ.team !== tower.team && champ.isAlive) {
        const dist = calculateDistance(tower.position, champ.position);
        if (dist <= tower.range) {
          if (!nearest || dist < nearest.dist) {
            nearest = { entity: champ, dist };
          }
        }
      }
    }
    if (this.state.playerChampion.isAlive) {
      const dist = calculateDistance(tower.position, this.state.playerChampion.position);
      if (dist <= tower.range) {
        if (!nearest || dist < nearest.dist) {
          nearest = { entity: this.state.playerChampion, dist };
        }
      }
    }

    return nearest ? nearest.entity.id : null;
  }

  // --- Update skillshots ---
  private updateSkillshots(deltaTime: number): void {
    for (const skillshot of this.state.skillshots) {
      const updated = updateSkillshotPosition(skillshot, deltaTime);
      Object.assign(skillshot, updated);

      if (!skillshot.isActive) continue;

      // Check collision with all entities
      const allEntities = [
        ...this.state.creeps,
        ...this.state.enemyChampions,
        this.state.playerChampion,
      ];

      const hitEntities = checkSkillshotCollision(
        skillshot,
        allEntities.filter(e => e.isAlive)
      );

      for (const entity of hitEntities) {
        this.dealDamage(entity, entity, skillshot.damage);
        // Deactivate skillshot after first hit (for line skillshots)
        if (skillshot.type === 'line') {
          skillshot.isActive = false;
          break;
        }
      }
    }

    // Remove inactive skillshots
    this.state.skillshots = this.state.skillshots.filter(s => s.isActive);
  }

  // --- Update player champion (respawn) ---
  private updatePlayerChampion(deltaTime: number): void {
    if (!this.state.playerChampion.isAlive) {
      if (this.state.playerChampion.respawnTime > 0) {
        this.state.playerChampion.respawnTime -= deltaTime;
        if (this.state.playerChampion.respawnTime <= 0) {
          this.respawnChampion(this.state.playerChampion);
        }
      }
    }
  }

  // --- Respawn a champion ---
  private respawnChampion(champion: ChampionEntity): void {
    champion.isAlive = true;
    champion.health = Math.round(champion.maxHealth * 0.5);
    champion.respawnTime = 0;

    // Respawn at team base
    const midLane = this.state.lanes.find(l => l.type === 'mid')!;
    if (champion.team === 'player') {
      champion.position = { ...midLane.playerSpawn, x: midLane.playerSpawn.x + 100 };
    } else {
      champion.position = { ...midLane.enemySpawn, x: midLane.enemySpawn.x - 100 };
    }
  }

  // --- Deal damage ---
  private dealDamage(
    attacker: CombatEntity | Tower | Nexus,
    target: CombatEntity | Tower | Nexus,
    damage: number
  ): void {
    if (!target.isAlive) return;

    const targetEntity = target as CombatEntity;
    const attackerEntity = attacker as CombatEntity;

    // Calculate damage with defense reduction
    const defense = 'defense' in target ? target.defense : 0;
    const damageReduction = defense / (100 + defense);
    const finalDamage = Math.max(10, Math.round(damage * (1 - damageReduction)));

    targetEntity.health = Math.max(0, targetEntity.health - finalDamage);

    if (targetEntity.health <= 0) {
      targetEntity.isAlive = false;

      // Handle kill
      if (targetEntity.entityType === 'champion') {
        const champion = targetEntity as ChampionEntity;
        champion.deaths++;
        champion.lastAttackerId = attackerEntity.id;

        if (champion.team === 'enemy') {
          this.state.playerKills++;
          this.grantGoldAndXP(champion, finalDamage);
        } else if (champion.team === 'player') {
          this.state.playerDeaths++;
          if (this.state.enemyChampions[0]) {
            this.state.enemyChampions[0].kills++;
          }
        }

        // Set respawn timer
        champion.respawnTime = 5000 + champion.level * 2000; // 5s + 2s per level
      }

      // Handle tower destruction
      if ('tier' in target) {
        const tower = target as Tower;
        this.events.push({
          type: 'tower_destroyed',
          timestamp: this.state.gameTime,
          data: { towerId: tower.id, lane: tower.lane, tier: tower.tier, team: tower.team },
        });

        // Grant gold to player team
        if (tower.team === 'enemy') {
          this.state.playerGold += tower.goldValue;
        }
      }

      // Handle nexus destruction
      if ('radius' in target && !('tier' in target)) {
        const nexus = target as Nexus;
        this.events.push({
          type: 'nexus_destroyed',
          timestamp: this.state.gameTime,
          data: { nexusId: nexus.id, team: nexus.team },
        });
      }
    }
  }

  // --- Grant gold and XP for kill ---
  private grantGoldAndXP(victim: ChampionEntity, damage: number): void {
    this.state.playerGold += this.config.goldPerKill;
    this.state.playerXP += this.config.xpPerKill;

    // Check level up
    const xpForNextLevel = this.state.playerLevel * 100;
    if (this.state.playerXP >= xpForNextLevel) {
      this.state.playerLevel++;
      this.state.playerXP -= xpForNextLevel;
      this.state.playerGold += 100; // level up bonus

      this.events.push({
        type: 'level_up',
        timestamp: this.state.gameTime,
        data: { newLevel: this.state.playerLevel },
      });
    }
  }

  // --- Find entity by ID ---
  private findEntityById(id: string): CombatEntity | Tower | Nexus | null {
    // Check player champion
    if (this.state.playerChampion.id === id) return this.state.playerChampion;

    // Check enemy champions
    for (const champ of this.state.enemyChampions) {
      if (champ.id === id) return champ;
    }

    // Check creeps
    for (const creep of this.state.creeps) {
      if (creep.id === id) return creep;
    }

    // Check towers
    for (const tower of this.state.towers) {
      if (tower.id === id) return tower;
    }

    // Check nexuses
    for (const nexus of this.state.nexuses) {
      if (nexus.id === id) return nexus;
    }

    return null;
  }

  // --- Check if entity is alive ---
  private isEntityAlive(id: string): boolean {
    const entity = this.findEntityById(id);
    return entity ? entity.isAlive : false;
  }

  // --- Check win conditions ---
  private checkWinConditions(): void {
    // Check if enemy nexus is destroyed
    const enemyNexus = this.state.nexuses.find(n => n.team === 'enemy');
    if (enemyNexus && !enemyNexus.isAlive) {
      this.endMatch('player_victory');
      return;
    }

    // Check if player nexus is destroyed
    const playerNexus = this.state.nexuses.find(n => n.team === 'player');
    if (playerNexus && !playerNexus.isAlive) {
      this.endMatch('enemy_victory');
      return;
    }

    // In PvE, check if all enemy champions are dead for 30 seconds
    if (this.config.mode === 'pve') {
      const allEnemiesDead = this.state.enemyChampions.every(e => !e.isAlive);
      if (allEnemiesDead) {
        // Count time since all enemies died
        const timeSinceAllDead = this.state.gameTime - (this.state.enemyChampions[0]?.respawnTime || 0);
        if (timeSinceAllDead > 30000) {
          this.endMatch('player_victory');
          return;
        }
      }
    }
  }

  // --- End the match ---
  private endMatch(result: MatchResult): void {
    this.state.state = 'ended';
    this.state.matchResult = result;

    this.events.push({
      type: 'nexus_destroyed',
      timestamp: this.state.gameTime,
      data: { result },
    });
  }

  // --- Get current match state ---
  getState(): MatchStateData {
    return { ...this.state };
  }

  // --- Get cooldown progress for an ability ---
  getCooldownProgress(championId: string, abilityId: string): number {
    const manager = this.state.cooldownManagers.get(championId);
    if (!manager) return 0;
    return getCooldownProgress(manager, abilityId);
  }

  // --- Get match events ---
  getEvents(): MatchEvent[] {
    return [...this.events];
  }

  // --- Clear events ---
  clearEvents(): void {
    this.events = [];
  }

  // --- Get player champion ---
  getPlayerChampion(): ChampionEntity {
    return this.state.playerChampion;
  }

  // --- Get all entities for rendering ---
  getAllEntities(): {
    champions: ChampionEntity[];
    creeps: CreepEntity[];
    towers: Tower[];
    nexuses: Nexus[];
    skillshots: Skillshot[];
  } {
    return {
      champions: [this.state.playerChampion, ...this.state.enemyChampions],
      creeps: this.state.creeps,
      towers: this.state.towers,
      nexuses: this.state.nexuses,
      skillshots: this.state.skillshots,
    };
  }

  // --- Get match config ---
  getConfig(): MatchConfig {
    return { ...this.config };
  }

  // --- Get lanes ---
  getLanes(): Lane[] {
    return this.state.lanes;
  }

  // --- Get match mode ---
  getMode(): MatchMode {
    return this.state.mode;
  }

  // --- Get match state ---
  getMatchState(): MatchState {
    return this.state.state;
  }

  // --- Get match result ---
  getMatchResult(): MatchResult | null {
    return this.state.matchResult;
  }
}

// --- Factory function to create match engine ---
export const createMatchEngine = (
  matchId: string,
  mode: MatchMode,
  playerCharacter: CharacterData,
  enemyCharacter: CharacterData | null,
  abilityDefs?: AbilityDefinition[],
  customConfig?: Partial<MatchConfig>
): MatchEngine => {
  return new MatchEngine(
    matchId,
    mode,
    playerCharacter,
    enemyCharacter,
    abilityDefs,
    customConfig
  );
};
