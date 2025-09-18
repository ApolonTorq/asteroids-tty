import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GameLoop } from '../../src/lib/engine/game-loop.js';
import { PhysicsEngine } from '../../src/lib/engine/physics.js';
import { CollisionSystem } from '../../src/lib/engine/collision.js';
import { Renderer } from '../../src/lib/engine/renderer.js';
import { GameStateManager } from '../../src/lib/engine/game-state.js';
import { InputHandler } from '../../src/lib/engine/input.js';
import { createDisplayConfiguration } from '../../src/lib/types/display.js';

describe('60 FPS Performance Validation', () => {
  let gameLoop: GameLoop;
  let physics: PhysicsEngine;
  let collision: CollisionSystem;
  let renderer: Renderer;
  let gameState: GameStateManager;
  let input: InputHandler;

  const SCREEN_WIDTH = 80;
  const SCREEN_HEIGHT = 25;
  const TARGET_FPS = 60;
  const PERFORMANCE_TOLERANCE = 0.9; // Accept 90% of target (54 FPS minimum)

  beforeEach(() => {
    // Create mock DOM element for tests
    const mockElement = {
      addEventListener: () => {},
      removeEventListener: () => {},
      focus: () => {},
      blur: () => {}
    } as any;

    // Initialize game systems
    physics = new PhysicsEngine(SCREEN_WIDTH, SCREEN_HEIGHT);
    collision = new CollisionSystem(SCREEN_WIDTH, SCREEN_HEIGHT);
    renderer = new Renderer(SCREEN_WIDTH, SCREEN_HEIGHT, createDisplayConfiguration());
    gameState = new GameStateManager({
      screenSize: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT }
    });
    input = new InputHandler(mockElement);

    gameLoop = new GameLoop(
      physics,
      collision,
      renderer,
      gameState,
      input,
      {
        targetFPS: TARGET_FPS,
        maxDeltaTime: 50,
        enableDebug: true
      }
    );
  });

  afterEach(() => {
    gameLoop?.destroy();
  });

  it('should maintain target FPS with minimal game objects', async () => {
    // Start with minimal setup - spaceship only
    gameState.spawnAsteroidsForLevel(1);

    // Run for performance measurement duration
    const measurementDuration = 1000; // 1 second
    const startTime = performance.now();

    gameLoop.start();

    // Wait for measurement period
    await new Promise(resolve => setTimeout(resolve, measurementDuration));

    gameLoop.stop();

    const stats = gameLoop.getPerformanceStats();
    const averageFPS = stats.averageFPS;
    const minAcceptableFPS = TARGET_FPS * PERFORMANCE_TOLERANCE;

    expect(averageFPS).toBeGreaterThanOrEqual(minAcceptableFPS);
    expect(stats.currentFPS).toBeGreaterThan(0);
  });

  it('should maintain performance with moderate asteroid count', async () => {
    // Moderate load - typical level 5 setup
    gameState.spawnAsteroidsForLevel(5);

    const measurementDuration = 1000;

    gameLoop.start();
    await new Promise(resolve => setTimeout(resolve, measurementDuration));
    gameLoop.stop();

    const stats = gameLoop.getPerformanceStats();
    const minAcceptableFPS = TARGET_FPS * PERFORMANCE_TOLERANCE;

    expect(stats.averageFPS).toBeGreaterThanOrEqual(minAcceptableFPS);
  });

  it('should handle high asteroid count without dropping below minimum FPS', async () => {
    // High load - maximum asteroids
    gameState.spawnAsteroidsForLevel(10);

    // Add some projectiles for stress testing
    for (let i = 0; i < 5; i++) {
      const projectile = physics.createProjectileFromSpaceship(gameState.getState().objects.spaceship);
      gameState.addProjectile(projectile);
    }

    const measurementDuration = 1500; // Longer measurement for stressed system

    gameLoop.start();
    await new Promise(resolve => setTimeout(resolve, measurementDuration));
    gameLoop.stop();

    const stats = gameLoop.getPerformanceStats();
    const minAcceptableFPS = TARGET_FPS * 0.8; // Allow 20% degradation under stress

    expect(stats.averageFPS).toBeGreaterThanOrEqual(minAcceptableFPS);
    expect(stats.frameNumber).toBeGreaterThan(60); // At least 1 second worth of frames
  });

  it('should have consistent frame times', async () => {
    gameState.spawnAsteroidsForLevel(3);

    const measurementDuration = 1000;

    gameLoop.start();
    await new Promise(resolve => setTimeout(resolve, measurementDuration));
    gameLoop.stop();

    const stats = gameLoop.getPerformanceStats();

    // Frame time should be close to target (16.67ms for 60 FPS)
    const targetFrameTime = 1000 / TARGET_FPS;
    const maxAcceptableFrameTime = targetFrameTime * 1.5; // 50% tolerance

    expect(stats.averageFrameTime).toBeLessThanOrEqual(maxAcceptableFrameTime);
    expect(stats.frameTime).toBeLessThanOrEqual(maxAcceptableFrameTime);
  });

  it('should handle game mode switching without performance degradation', async () => {
    gameState.spawnAsteroidsForLevel(3);

    // Test scrolling mode
    physics.setGameMode('scrolling');
    gameLoop.start();
    await new Promise(resolve => setTimeout(resolve, 500));

    const scrollingStats = gameLoop.getPerformanceStats();

    // Switch to traditional mode
    physics.setGameMode('traditional');
    await new Promise(resolve => setTimeout(resolve, 500));

    gameLoop.stop();
    const traditionalStats = gameLoop.getPerformanceStats();

    const minAcceptableFPS = TARGET_FPS * PERFORMANCE_TOLERANCE;

    expect(scrollingStats.averageFPS).toBeGreaterThanOrEqual(minAcceptableFPS);
    expect(traditionalStats.averageFPS).toBeGreaterThanOrEqual(minAcceptableFPS);
  });

  it('should maintain performance during collision-heavy scenarios', async () => {
    // Create scenario with many potential collisions
    gameState.spawnAsteroidsForLevel(8);

    // Add multiple projectiles
    for (let i = 0; i < 8; i++) {
      const projectile = physics.createProjectileFromSpaceship(gameState.getState().objects.spaceship);
      gameState.addProjectile(projectile);
    }

    const measurementDuration = 1000;

    gameLoop.start();
    await new Promise(resolve => setTimeout(resolve, measurementDuration));
    gameLoop.stop();

    const stats = gameLoop.getPerformanceStats();
    const minAcceptableFPS = TARGET_FPS * 0.75; // More lenient for collision stress

    expect(stats.averageFPS).toBeGreaterThanOrEqual(minAcceptableFPS);
  });

  it('should not accumulate performance debt over extended runs', async () => {
    gameState.spawnAsteroidsForLevel(5);

    // Run for extended period to test for memory leaks or accumulated overhead
    const extendedDuration = 3000; // 3 seconds

    gameLoop.start();

    // Take measurement after 1 second
    await new Promise(resolve => setTimeout(resolve, 1000));
    const earlyStats = gameLoop.getPerformanceStats();

    // Take measurement after 3 seconds total
    await new Promise(resolve => setTimeout(resolve, 2000));
    gameLoop.stop();

    const lateStats = gameLoop.getPerformanceStats();

    // Performance should not degrade significantly over time
    const performanceDegradation = (earlyStats.averageFPS - lateStats.averageFPS) / earlyStats.averageFPS;

    expect(performanceDegradation).toBeLessThan(0.1); // Less than 10% degradation
    expect(lateStats.averageFPS).toBeGreaterThanOrEqual(TARGET_FPS * 0.85);
  });
});