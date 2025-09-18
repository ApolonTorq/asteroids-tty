import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GameLoop } from '../../src/lib/engine/game-loop.js';
import { PhysicsEngine } from '../../src/lib/engine/physics.js';
import { CollisionSystem } from '../../src/lib/engine/collision.js';
import { Renderer } from '../../src/lib/engine/renderer.js';
import { GameStateManager } from '../../src/lib/engine/game-state.js';
import { InputHandler } from '../../src/lib/engine/input.js';
import { createDisplayConfiguration } from '../../src/lib/types/display.js';

describe('Memory Usage Validation', () => {
  let gameLoop: GameLoop;
  let physics: PhysicsEngine;
  let collision: CollisionSystem;
  let renderer: Renderer;
  let gameState: GameStateManager;
  let input: InputHandler;

  const SCREEN_WIDTH = 80;
  const SCREEN_HEIGHT = 25;

  beforeEach(() => {
    // Create mock DOM element
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

    gameLoop = new GameLoop(physics, collision, renderer, gameState, input);
  });

  afterEach(() => {
    gameLoop?.destroy();
  });

  it('should not leak memory during object creation and destruction', async () => {
    // Get baseline object counts
    const initialState = gameState.getState();
    const initialAsteroidCount = initialState.objects.asteroids.length;
    const initialProjectileCount = initialState.objects.projectiles.length;

    // Create and destroy objects multiple times
    for (let cycle = 0; cycle < 10; cycle++) {
      // Add asteroids
      gameState.spawnAsteroidsForLevel(5);

      // Add projectiles
      for (let i = 0; i < 8; i++) {
        const projectile = physics.createProjectileFromSpaceship(initialState.objects.spaceship);
        gameState.addProjectile(projectile);
      }

      // Process collisions to trigger cleanup
      gameLoop.start();
      await new Promise(resolve => setTimeout(resolve, 100));
      gameLoop.stop();

      // Clear all objects
      gameState.clearAllObjects();

      // Force cleanup
      gameState.removeInactiveProjectiles();
      gameState.removeInactiveAsteroids();
    }

    // Check final state matches initial
    const finalState = gameState.getState();
    expect(finalState.objects.asteroids.length).toBe(initialAsteroidCount);
    expect(finalState.objects.projectiles.length).toBe(initialProjectileCount);
  });

  it('should properly clean up inactive projectiles', () => {
    const projectileCount = 20;

    // Add many projectiles
    for (let i = 0; i < projectileCount; i++) {
      const projectile = physics.createProjectileFromSpaceship(gameState.getState().objects.spaceship);
      gameState.addProjectile(projectile);
    }

    let currentState = gameState.getState();
    expect(currentState.objects.projectiles.length).toBe(projectileCount);

    // Manually mark projectiles as inactive
    currentState.objects.projectiles.forEach(projectile => {
      projectile.active = false;
    });

    // Clean up inactive projectiles
    const removedCount = gameState.removeInactiveProjectiles();

    currentState = gameState.getState();
    expect(removedCount).toBe(projectileCount);
    expect(currentState.objects.projectiles.length).toBe(0);
  });

  it('should properly clean up inactive asteroids', () => {
    gameState.spawnAsteroidsForLevel(8);

    let currentState = gameState.getState();
    const asteroidCount = currentState.objects.asteroids.length;
    expect(asteroidCount).toBeGreaterThan(0);

    // Mark asteroids as inactive
    currentState.objects.asteroids.forEach(asteroid => {
      asteroid.active = false;
    });

    // Clean up inactive asteroids
    const removedCount = gameState.removeInactiveAsteroids();

    currentState = gameState.getState();
    expect(removedCount).toBe(asteroidCount);
    expect(currentState.objects.asteroids.length).toBe(0);
  });

  it('should not accumulate performance history beyond limits', async () => {
    // Run game loop to generate performance history
    gameLoop.start();

    // Let it run for enough time to generate significant history
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds

    gameLoop.stop();

    const stats = gameLoop.getPerformanceStats();

    // Performance history should be bounded
    expect(stats.frameNumber).toBeGreaterThan(60); // At least 1 second worth
    expect(stats.frameNumber).toBeLessThan(200); // But not excessive

    // Average calculations should work (indicating proper history management)
    expect(stats.averageFPS).toBeGreaterThan(0);
    expect(stats.averageFrameTime).toBeGreaterThan(0);
  });

  it('should handle rapid object creation without memory buildup', async () => {
    const cycles = 50;

    for (let i = 0; i < cycles; i++) {
      // Rapid projectile creation
      const projectile = physics.createProjectileFromSpaceship(gameState.getState().objects.spaceship);
      gameState.addProjectile(projectile);

      // Immediate cleanup
      gameState.removeInactiveProjectiles();

      // Verify no accumulation
      if (i % 10 === 0) {
        const currentState = gameState.getState();
        expect(currentState.objects.projectiles.length).toBeLessThanOrEqual(cycles / 10);
      }
    }

    // Final cleanup and verification
    gameState.clearAllObjects();
    const finalState = gameState.getState();
    expect(finalState.objects.projectiles.length).toBe(0);
  });

  it('should properly handle collision system memory management', () => {
    // Test collision system with many objects
    gameState.spawnAsteroidsForLevel(10);

    for (let i = 0; i < 15; i++) {
      const projectile = physics.createProjectileFromSpaceship(gameState.getState().objects.spaceship);
      gameState.addProjectile(projectile);
    }

    const initialState = gameState.getState();
    const initialObjectCount =
      initialState.objects.asteroids.length +
      initialState.objects.projectiles.length + 1; // +1 for spaceship

    // Process many collision checks
    for (let i = 0; i < 100; i++) {
      collision.processAllCollisions(gameState.getState());
    }

    // Object counts should remain stable (no duplication/leaks)
    const finalState = gameState.getState();
    const finalObjectCount =
      finalState.objects.asteroids.length +
      finalState.objects.projectiles.length + 1;

    // Allow for some variation due to collisions, but no major leaks
    expect(Math.abs(finalObjectCount - initialObjectCount)).toBeLessThanOrEqual(initialObjectCount * 0.2);
  });

  it('should handle game state serialization without memory leaks', () => {
    // Set up complex game state
    gameState.spawnAsteroidsForLevel(6);

    for (let i = 0; i < 10; i++) {
      const projectile = physics.createProjectileFromSpaceship(gameState.getState().objects.spaceship);
      gameState.addProjectile(projectile);
    }

    // Test serialization multiple times
    const serializations: object[] = [];

    for (let i = 0; i < 20; i++) {
      const serialized = gameState.toJSON();
      serializations.push(serialized);

      // Modify state slightly
      gameState.addScore(100);
    }

    // Verify serializations don't accumulate references
    expect(serializations.length).toBe(20);

    // Each serialization should be independent
    const firstSerialization = serializations[0] as any;
    const lastSerialization = serializations[19] as any;

    expect(firstSerialization.score).not.toBe(lastSerialization.score);
    expect(typeof firstSerialization).toBe('object');
    expect(typeof lastSerialization).toBe('object');
  });

  it('should properly manage input handler memory', () => {
    const eventCounts = { keydown: 0, keyup: 0 };

    // Mock element with event tracking
    const mockElement = {
      addEventListener: (event: string) => {
        eventCounts[event as keyof typeof eventCounts]++;
      },
      removeEventListener: (event: string) => {
        eventCounts[event as keyof typeof eventCounts]--;
      },
      focus: () => {},
      blur: () => {}
    } as any;

    // Create and destroy multiple input handlers
    for (let i = 0; i < 10; i++) {
      const tempInput = new InputHandler(mockElement);
      tempInput.destroy();
    }

    // Event listeners should be properly cleaned up
    expect(eventCounts.keydown).toBe(0);
    expect(eventCounts.keyup).toBe(0);
  });

  it('should handle renderer memory management during screen size changes', () => {
    const originalSize = renderer.getScreenSize();

    // Change screen size multiple times
    const sizes = [
      { width: 40, height: 15 },
      { width: 100, height: 30 },
      { width: 60, height: 20 },
      { width: originalSize.width, height: originalSize.height }
    ];

    sizes.forEach(size => {
      renderer.updateScreenSize(size.width, size.height);
      const currentSize = renderer.getScreenSize();
      expect(currentSize.width).toBe(size.width);
      expect(currentSize.height).toBe(size.height);

      // Test that rendering still works
      const testState = gameState.getState();
      expect(() => renderer.renderGameState(testState)).not.toThrow();
    });
  });

  it('should validate object cleanup during extended gameplay', async () => {
    // Simulate extended gameplay session
    const sessionDuration = 1000; // 1 second (shortened for test)
    const checkInterval = 200; // Check every 200ms

    gameLoop.start();

    const objectCounts: Array<{asteroids: number, projectiles: number}> = [];

    const checkMemory = () => {
      const state = gameState.getState();
      objectCounts.push({
        asteroids: state.objects.asteroids.length,
        projectiles: state.objects.projectiles.length
      });
    };

    // Periodic memory checks
    const intervalId = setInterval(checkMemory, checkInterval);

    // Add some gameplay activity
    setTimeout(() => {
      gameState.spawnAsteroidsForLevel(3);
      for (let i = 0; i < 5; i++) {
        const projectile = physics.createProjectileFromSpaceship(gameState.getState().objects.spaceship);
        gameState.addProjectile(projectile);
      }
    }, 100);

    await new Promise(resolve => setTimeout(resolve, sessionDuration));

    clearInterval(intervalId);
    gameLoop.stop();

    // Verify object counts remain reasonable
    expect(objectCounts.length).toBeGreaterThan(3);

    const maxAsteroids = Math.max(...objectCounts.map(c => c.asteroids));
    const maxProjectiles = Math.max(...objectCounts.map(c => c.projectiles));

    // Object counts should be bounded (not growing indefinitely)
    expect(maxAsteroids).toBeLessThan(20);
    expect(maxProjectiles).toBeLessThan(15);
  });
});