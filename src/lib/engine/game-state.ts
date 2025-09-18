import type {
  GameState,
  GameStateConfig,
  GameMode,
  GameStatus,
  Difficulty,
  ScreenSize,
  GameObjects
} from '../types/game-state.js';
import type { Spaceship } from '../types/spaceship.js';
import type { Asteroid } from '../types/asteroid.js';
import type { Projectile } from '../types/projectile.js';
import {
  DEFAULT_SCREEN_SIZE,
  DEFAULT_LIVES,
  DEFAULT_LEVEL,
  getAsteroidCountForLevel,
  getAsteroidSpeedForLevel,
  getLevelCompletionBonus,
  calculateScore,
  shouldAwardExtraLife,
  isValidScreenSize,
  getDefaultSpaceshipPosition,
  canPause,
  canResume,
  isLevelComplete,
  isGameOver
} from '../types/game-state.js';
import { createSpaceship } from '../types/spaceship.js';
import { createAsteroid, generateRandomAsteroidVelocity } from '../types/asteroid.js';

export class GameStateManager {
  private state: GameState;
  private initialConfig: GameStateConfig;

  constructor(config: GameStateConfig = {}) {
    this.initialConfig = { ...config };
    this.state = this.createInitialState(config);
  }

  private createInitialState(config: GameStateConfig): GameState {
    const screenSize = config.screenSize || DEFAULT_SCREEN_SIZE;
    const spaceshipPosition = config.spaceshipPosition || getDefaultSpaceshipPosition(screenSize);

    return {
      score: config.score || 0,
      level: config.level || DEFAULT_LEVEL,
      lives: config.lives || DEFAULT_LIVES,
      gameMode: config.gameMode || 'traditional',
      characterMode: config.characterMode || 'ascii',
      screenSize,
      difficulty: config.difficulty || 'normal',
      gameStatus: 'playing',
      objects: {
        spaceship: createSpaceship({
          position: spaceshipPosition,
          velocity: { dx: 0, dy: 0 }  // Explicitly set zero velocity
        }),
        asteroids: [],
        projectiles: []
      }
    };
  }

  // State accessors
  getState(): Readonly<GameState> {
    return { ...this.state };
  }

  getScore(): number {
    return this.state.score;
  }

  getLevel(): number {
    return this.state.level;
  }

  getLives(): number {
    return this.state.lives;
  }

  getGameStatus(): GameStatus {
    return this.state.gameStatus;
  }

  getGameMode(): GameMode {
    return this.state.gameMode;
  }

  getScreenSize(): ScreenSize {
    return { ...this.state.screenSize };
  }

  getObjects(): Readonly<GameObjects> {
    return {
      spaceship: { ...this.state.objects.spaceship },
      asteroids: [...this.state.objects.asteroids],
      projectiles: [...this.state.objects.projectiles]
    };
  }

  // Get mutable objects for physics updates
  getMutableObjects(): GameObjects {
    return this.state.objects;
  }

  // Score management
  addScore(points: number): void {
    if (points <= 0) return;

    const previousScore = this.state.score;
    const adjustedPoints = calculateScore(points, this.state.difficulty);
    this.state.score += adjustedPoints;

    // Check for extra life
    if (shouldAwardExtraLife(this.state.score, previousScore)) {
      this.state.lives++;
    }
  }

  // Level management
  checkLevelCompletion(): boolean {
    if (isLevelComplete(this.state.objects.asteroids)) {
      this.completeLevel();
      return true;
    }
    return false;
  }

  private completeLevel(): void {
    // Award level completion bonus
    const bonus = getLevelCompletionBonus(this.state.level);
    this.addScore(bonus);

    // Advance to next level
    this.state.level++;

    // Spawn new asteroids for next level
    this.spawnAsteroidsForLevel(this.state.level);
  }

  spawnAsteroidsForLevel(level: number): void {
    const count = getAsteroidCountForLevel(level);
    const speed = getAsteroidSpeedForLevel(level);

    this.state.objects.asteroids = [];

    for (let i = 0; i < count; i++) {
      // Random position around the edges
      const edge = Math.floor(Math.random() * 4);
      let x: number, y: number;

      switch (edge) {
        case 0: // Top
          x = Math.random() * this.state.screenSize.width;
          y = -2;
          break;
        case 1: // Right
          x = this.state.screenSize.width + 2;
          y = Math.random() * this.state.screenSize.height;
          break;
        case 2: // Bottom
          x = Math.random() * this.state.screenSize.width;
          y = this.state.screenSize.height + 2;
          break;
        default: // Left
          x = -2;
          y = Math.random() * this.state.screenSize.height;
      }

      const velocity = generateRandomAsteroidVelocity(speed);
      const asteroid = createAsteroid({
        position: { x, y },
        velocity,
        size: Math.random() > 0.3 ? 'large' : 'small' // 70% large, 30% small
      });

      this.state.objects.asteroids.push(asteroid);
    }
  }

  // Lives management
  loseLife(): void {
    this.state.lives--;

    if (isGameOver(this.state.lives)) {
      this.state.gameStatus = 'gameOver';
    } else {
      // Respawn spaceship
      this.respawnSpaceship();
    }
  }

  private respawnSpaceship(): void {
    const safePosition = getDefaultSpaceshipPosition(this.state.screenSize);

    this.state.objects.spaceship = createSpaceship({
      position: safePosition
    });
  }

  // Game control
  pause(): boolean {
    if (canPause(this.state.gameStatus)) {
      this.state.gameStatus = 'paused';
      return true;
    }
    return false;
  }

  resume(): boolean {
    if (canResume(this.state.gameStatus)) {
      this.state.gameStatus = 'playing';
      return true;
    }
    return false;
  }

  togglePause(): boolean {
    if (this.state.gameStatus === 'playing') {
      return this.pause();
    } else if (this.state.gameStatus === 'paused') {
      return this.resume();
    }
    return false;
  }

  reset(): void {
    this.state = this.createInitialState(this.initialConfig);
    this.spawnAsteroidsForLevel(this.state.level);
  }

  // Configuration updates
  setGameMode(gameMode: GameMode): void {
    this.state.gameMode = gameMode;
  }

  toggleGameMode(): GameMode {
    this.state.gameMode = this.state.gameMode === 'traditional' ? 'scrolling' : 'traditional';
    return this.state.gameMode;
  }

  setCharacterMode(mode: 'ascii' | 'unicode'): void {
    this.state.characterMode = mode;
  }

  toggleCharacterMode(): 'ascii' | 'unicode' {
    this.state.characterMode = this.state.characterMode === 'ascii' ? 'unicode' : 'ascii';
    return this.state.characterMode;
  }

  setScreenSize(width: number, height: number): boolean {
    const newSize = { width, height };

    if (!isValidScreenSize(newSize)) {
      return false;
    }

    this.state.screenSize = newSize;

    // Reposition spaceship if needed
    const spaceshipPos = this.state.objects.spaceship.position;
    if (spaceshipPos.x >= width || spaceshipPos.y >= height) {
      this.state.objects.spaceship.position = getDefaultSpaceshipPosition(newSize);
    }

    return true;
  }

  setDifficulty(difficulty: Difficulty): void {
    this.state.difficulty = difficulty;
  }

  // Object management
  addProjectile(projectile: Projectile): void {
    // Safety limit to prevent unbounded growth
    if (this.state.objects.projectiles.length > 20) {
      console.warn('[GameState] Too many projectiles:', this.state.objects.projectiles.length);
      return;
    }
    this.state.objects.projectiles.push(projectile);
  }

  addAsteroid(asteroid: Asteroid): void {
    this.state.objects.asteroids.push(asteroid);
  }

  addAsteroidFragments(fragments: Asteroid[]): void {
    // Safety limit to prevent unbounded growth
    if (this.state.objects.asteroids.length + fragments.length > 50) {
      console.error('[GameState] Too many asteroids! Current:', this.state.objects.asteroids.length, 'Adding:', fragments.length);
      return;
    }
    this.state.objects.asteroids.push(...fragments);
  }

  removeInactiveProjectiles(): number {
    const initialCount = this.state.objects.projectiles.length;
    this.state.objects.projectiles = this.state.objects.projectiles.filter(p => p.active);
    return initialCount - this.state.objects.projectiles.length;
  }

  removeInactiveAsteroids(): number {
    const initialCount = this.state.objects.asteroids.length;
    this.state.objects.asteroids = this.state.objects.asteroids.filter(a => a.active);
    return initialCount - this.state.objects.asteroids.length;
  }

  clearAllObjects(): void {
    this.state.objects.asteroids = [];
    this.state.objects.projectiles = [];
  }

  // State validation
  isValidState(): boolean {
    try {
      // Check basic properties
      if (typeof this.state.score !== 'number' || this.state.score < 0) return false;
      if (typeof this.state.level !== 'number' || this.state.level < 1) return false;
      if (typeof this.state.lives !== 'number' || this.state.lives < 0) return false;

      // Check spaceship
      const spaceship = this.state.objects.spaceship;
      if (!spaceship || typeof spaceship.position.x !== 'number' || typeof spaceship.position.y !== 'number') {
        return false;
      }

      // Check arrays
      if (!Array.isArray(this.state.objects.asteroids) || !Array.isArray(this.state.objects.projectiles)) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  // Serialization
  toJSON(): object {
    return {
      score: this.state.score,
      level: this.state.level,
      lives: this.state.lives,
      gameMode: this.state.gameMode,
      characterMode: this.state.characterMode,
      difficulty: this.state.difficulty,
      gameStatus: this.state.gameStatus,
      screenSize: this.state.screenSize,
      timestamp: Date.now()
    };
  }

  fromJSON(data: any): boolean {
    try {
      if (typeof data !== 'object' || data === null) return false;

      // Restore basic properties
      if (typeof data.score === 'number') this.state.score = data.score;
      if (typeof data.level === 'number') this.state.level = data.level;
      if (typeof data.lives === 'number') this.state.lives = data.lives;
      if (typeof data.gameMode === 'string') this.state.gameMode = data.gameMode;
      if (typeof data.characterMode === 'string') this.state.characterMode = data.characterMode;
      if (typeof data.difficulty === 'string') this.state.difficulty = data.difficulty;
      if (typeof data.gameStatus === 'string') this.state.gameStatus = data.gameStatus;

      if (data.screenSize && typeof data.screenSize === 'object') {
        if (isValidScreenSize(data.screenSize)) {
          this.state.screenSize = data.screenSize;
        }
      }

      return this.isValidState();
    } catch {
      return false;
    }
  }

  // Debug information
  getDebugInfo(): object {
    return {
      state: this.toJSON(),
      objectCounts: {
        asteroids: this.state.objects.asteroids.length,
        activeAsteroids: this.state.objects.asteroids.filter(a => a.active).length,
        projectiles: this.state.objects.projectiles.length,
        activeProjectiles: this.state.objects.projectiles.filter(p => p.active).length
      },
      spaceshipAlive: this.state.objects.spaceship.alive,
      levelComplete: isLevelComplete(this.state.objects.asteroids)
    };
  }
}