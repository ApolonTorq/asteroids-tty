import type { GameState } from '../types/game-state.js';
import type { InputState } from './input.js';
import { PhysicsEngine } from './physics.js';
import { CollisionSystem } from './collision.js';
// Import either renderer type - they share the same interface
import type { Renderer } from './renderer.js';
import type { SimpleRenderer } from './simple-renderer.js';
import { GameStateManager } from './game-state.js';
import { InputHandler } from './input.js';
import { createProjectileFromSpaceship } from '../types/projectile.js';

export interface GameLoopConfig {
  targetFPS: number;
  maxDeltaTime: number;
  enableDebug: boolean;
}

export interface FrameData {
  deltaTime: number;
  fps: number;
  frameNumber: number;
  timestamp: number;
}

export interface GameLoopCallbacks {
  onUpdate?: (frameData: FrameData) => void;
  onRender?: (frameData: FrameData) => void;
  onGameOver?: (finalScore: number) => void;
  onLevelComplete?: (level: number) => void;
  onScoreChange?: (score: number) => void;
}

export class GameLoop {
  private physics: PhysicsEngine;
  private collision: CollisionSystem;
  private renderer: Renderer | SimpleRenderer;
  private gameState: GameStateManager;
  private input: InputHandler;

  private config: GameLoopConfig;
  private callbacks: GameLoopCallbacks;

  private running: boolean;
  private frameNumber: number;
  private lastFrameTime: number;
  private targetFrameTime: number;
  private animationFrameId: number | null;

  // Performance tracking
  private fpsHistory: number[];
  private frameTimeHistory: number[];
  private maxHistorySize: number;

  constructor(
    physics: PhysicsEngine,
    collision: CollisionSystem,
    renderer: Renderer | SimpleRenderer,
    gameState: GameStateManager,
    input: InputHandler,
    config: Partial<GameLoopConfig> = {},
    callbacks: GameLoopCallbacks = {}
  ) {
    this.physics = physics;
    this.collision = collision;
    this.renderer = renderer;
    this.gameState = gameState;
    this.input = input;

    this.config = {
      targetFPS: 30,  // Reduced from 60 for better performance
      maxDeltaTime: 100, // 100ms max to prevent large jumps
      enableDebug: false,
      ...config
    };

    this.callbacks = callbacks;

    this.running = false;
    this.frameNumber = 0;
    this.lastFrameTime = 0;
    this.targetFrameTime = 1000 / this.config.targetFPS;
    this.animationFrameId = null;

    this.fpsHistory = [];
    this.frameTimeHistory = [];
    this.maxHistorySize = 60; // Track last 60 frames

    this.bindInputEvents();
  }

  private bindInputEvents(): void {
    this.input.addEventListener((event) => {
      const state = this.gameState.getState();

      // Handle single-press actions
      if (event.pressed && !event.repeat) {
        switch (event.action) {
          case 'pause':
            this.gameState.togglePause();
            break;
          case 'reset':
            if (state.gameStatus === 'gameOver') {
              this.gameState.reset();
            }
            break;
          case 'toggleCharacterMode':
            this.gameState.toggleCharacterMode();
            break;
          case 'togglePhysicsMode':
            const newMode = this.gameState.toggleGameMode();
            this.physics.setGameMode(newMode);
            break;
          case 'shoot':
            if (state.gameStatus === 'playing' && state.objects.spaceship.alive) {
              const projectile = this.physics.createProjectileFromSpaceship(state.objects.spaceship);
              this.gameState.addProjectile(projectile);
            }
            break;
        }
      }
    });
  }

  // Track RAF calls
  private rafCallCount = 0;
  private rafCountStartTime = performance.now();
  private emergencyStop = false;

  // Main game loop
  private gameLoopStep = (currentTime: number): void => {
    if (!this.running || this.emergencyStop) return;

    // Track RAF frequency and emergency stop if runaway
    this.rafCallCount++;
    const rafCheckTime = performance.now();
    if (rafCheckTime - this.rafCountStartTime >= 1000) {
      if (this.rafCallCount > 70) {
        console.error('EMERGENCY STOP: RAF called', this.rafCallCount, 'times in 1 second!');
        this.emergencyStop = true;
        this.stop();
        return;
      }
      this.rafCallCount = 0;
      this.rafCountStartTime = rafCheckTime;
    }

    const frameStartTime = performance.now();

    // Calculate delta time
    const deltaTime = currentTime - this.lastFrameTime;

    // Frame skipping - only update if enough time has passed
    if (deltaTime < this.targetFrameTime) {
      requestAnimationFrame(this.gameLoopStep);
      return;
    }

    this.lastFrameTime = currentTime;

    const frameData: FrameData = {
      deltaTime,
      fps: this.calculateFPS(deltaTime),
      frameNumber: this.frameNumber,
      timestamp: currentTime
    };

    // Log every 300 frames (10 seconds at 30fps)
    if (this.frameNumber % 300 === 0 && this.frameNumber > 0) {
      console.log('Frame', this.frameNumber, 'FPS:', Math.round(frameData.fps));
    }

    // Update game with timing
    const updateStart = performance.now();
    this.update(frameData);
    const updateTime = performance.now() - updateStart;

    // Render game with timing
    const renderStart = performance.now();
    this.render(frameData);
    const renderTime = performance.now() - renderStart;

    // Update performance tracking
    this.updatePerformanceMetrics(deltaTime);

    // Callbacks
    this.callbacks.onUpdate?.(frameData);
    this.callbacks.onRender?.(frameData);

    const totalFrameTime = performance.now() - frameStartTime;

    // Log slow frames
    if (totalFrameTime > 33) { // More than 33ms (30fps threshold)
      console.warn('Slow frame!', {
        frame: this.frameNumber,
        total: totalFrameTime.toFixed(2) + 'ms',
        update: updateTime.toFixed(2) + 'ms',
        render: renderTime.toFixed(2) + 'ms'
      });
    }

    this.frameNumber++;

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.gameLoopStep);
  };

  private update(frameData: FrameData): void {
    const state = this.gameState.getState();
    // Get mutable objects for physics updates
    const mutableObjects = this.gameState.getMutableObjects();

    // Log object counts periodically
    if (this.frameNumber % 100 === 0) {
      console.log('[GameLoop] Update cycle', {
        frame: this.frameNumber,
        asteroids: mutableObjects.asteroids.filter(a => a.active).length,
        projectiles: mutableObjects.projectiles.filter(p => p.active).length,
        status: state.gameStatus
      });
    }

    // Skip update if game is paused or over
    if (state.gameStatus !== 'playing') {
      return;
    }

    // Get input state
    const inputState = this.input.getInputState();

    // Log first 10 frames to debug physics
    if (this.frameNumber <= 10) {
      console.log(`[GameLoop] Frame ${this.frameNumber} - BEFORE physics update:`, {
        spaceshipPos: { ...mutableObjects.spaceship.position },
        spaceshipVel: { ...mutableObjects.spaceship.velocity },
        input: { thrust: inputState.thrust, left: inputState.rotateLeft, right: inputState.rotateRight }
      });
    }

    // Update physics with mutable objects
    this.physics.updateAllObjects(
      mutableObjects.spaceship,
      mutableObjects.asteroids,
      mutableObjects.projectiles,
      {
        thrust: inputState.thrust,
        rotateLeft: inputState.rotateLeft,
        rotateRight: inputState.rotateRight
      }
    );

    // Log after physics update
    if (this.frameNumber <= 10) {
      console.log(`[GameLoop] Frame ${this.frameNumber} - AFTER physics update:`, {
        spaceshipPos: { ...mutableObjects.spaceship.position },
        spaceshipVel: { ...mutableObjects.spaceship.velocity }
      });
    }

    // Process collisions with the full state (collision system may need readonly access)
    const collisionResults = this.collision.processAllCollisions(state);

    // Handle collision results
    if (collisionResults.spaceshipHit && mutableObjects.spaceship.alive) {
      this.gameState.loseLife();

      if (state.gameStatus === 'gameOver') {
        this.callbacks.onGameOver?.(state.score);
      }
    }

    // Add asteroid fragments
    if (collisionResults.newFragments.length > 0) {
      this.gameState.addAsteroidFragments(collisionResults.newFragments);
    }

    // Update score
    if (collisionResults.scoreAwarded > 0) {
      this.gameState.addScore(collisionResults.scoreAwarded);
      this.callbacks.onScoreChange?.(state.score);
    }

    // Clean up inactive objects
    this.gameState.removeInactiveProjectiles();
    this.gameState.removeInactiveAsteroids();

    // Check level completion
    if (this.gameState.checkLevelCompletion()) {
      this.callbacks.onLevelComplete?.(state.level);
    }
  }

  private render(frameData: FrameData): void {
    const state = this.gameState.getState();

    // Render game state - SimpleRenderer updates DOM directly
    this.renderer.renderGameState(state);
  }

  // Control methods
  start(): void {
    if (this.running) return;

    this.running = true;
    this.lastFrameTime = performance.now();
    this.frameNumber = 0;

    this.animationFrameId = requestAnimationFrame(this.gameLoopStep);
  }

  stop(): void {
    this.running = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  pause(): void {
    this.gameState.pause();
  }

  resume(): void {
    this.gameState.resume();
  }

  reset(): void {
    this.gameState.reset();
    this.frameNumber = 0;
    this.clearPerformanceHistory();
  }

  // Performance monitoring
  private calculateFPS(deltaTime: number): number {
    return deltaTime > 0 ? Math.round(1000 / deltaTime) : 0;
  }

  private updatePerformanceMetrics(frameTime: number): void {
    this.frameTimeHistory.push(frameTime);
    this.fpsHistory.push(this.calculateFPS(frameTime));

    // Keep history size limited
    if (this.frameTimeHistory.length > this.maxHistorySize) {
      this.frameTimeHistory.shift();
      this.fpsHistory.shift();
    }
  }

  private clearPerformanceHistory(): void {
    this.frameTimeHistory = [];
    this.fpsHistory = [];
  }

  // Getters
  isRunning(): boolean {
    return this.running;
  }

  getFrameNumber(): number {
    return this.frameNumber;
  }

  getCurrentFPS(): number {
    return this.fpsHistory.length > 0
      ? this.fpsHistory[this.fpsHistory.length - 1]
      : 0;
  }

  getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return 0;
    const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.fpsHistory.length);
  }

  getPerformanceStats(): {
    currentFPS: number;
    averageFPS: number;
    frameTime: number;
    averageFrameTime: number;
    frameNumber: number;
  } {
    const avgFrameTime = this.frameTimeHistory.length > 0
      ? this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length
      : 0;

    return {
      currentFPS: this.getCurrentFPS(),
      averageFPS: this.getAverageFPS(),
      frameTime: this.frameTimeHistory[this.frameTimeHistory.length - 1] || 0,
      averageFrameTime: avgFrameTime,
      frameNumber: this.frameNumber
    };
  }

  // Configuration updates
  updateConfig(newConfig: Partial<GameLoopConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.targetFrameTime = 1000 / this.config.targetFPS;
  }

  updateCallbacks(newCallbacks: Partial<GameLoopCallbacks>): void {
    this.callbacks = { ...this.callbacks, ...newCallbacks };
  }

  // Debug information
  getDebugInfo(): object {
    return {
      running: this.running,
      frameNumber: this.frameNumber,
      config: this.config,
      performance: this.getPerformanceStats(),
      gameState: this.gameState.getDebugInfo(),
      input: this.input.getDebugInfo()
    };
  }

  // System references (for external access)
  getPhysics(): PhysicsEngine {
    return this.physics;
  }

  getCollision(): CollisionSystem {
    return this.collision;
  }

  getRenderer(): Renderer {
    return this.renderer;
  }

  getGameState(): GameStateManager {
    return this.gameState;
  }

  getInput(): InputHandler {
    return this.input;
  }

  // Cleanup
  destroy(): void {
    this.stop();
    this.input.destroy();
    this.clearPerformanceHistory();
  }
}