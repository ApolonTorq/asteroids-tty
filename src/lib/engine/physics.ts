import type { Position, Velocity } from '../types/geometry.js';
import type { Spaceship } from '../types/spaceship.js';
import type { Asteroid } from '../types/asteroid.js';
import type { Projectile } from '../types/projectile.js';
import type { GameMode, ScreenSize } from '../types/game-state.js';
import {
  addVelocityToPosition,
  wrapPosition,
  rotationToDirection,
  normalizeRotation,
  scaleVelocity,
  getVelocityMagnitude
} from '../types/geometry.js';

export interface PhysicsConfig {
  thrustPower: number;
  dampingFactor: number;
  maxSpeed: number;
  rotationSpeed: number;
  projectileSpeed: number;
  scrollSpeed: number; // For scrolling mode
}

export const DEFAULT_PHYSICS_CONFIG: PhysicsConfig = {
  thrustPower: 0.15,    // Reduced from 0.3 for better control
  dampingFactor: 0.99,  // Increased from 0.98 for slower deceleration
  maxSpeed: 2,          // Reduced from 5 for more manageable speed
  rotationSpeed: 8,     // Slightly reduced from 10
  projectileSpeed: 1.5,  // Reduced from 6 for visible projectiles
  scrollSpeed: 0.5      // Moderate scrolling speed
};

export class PhysicsEngine {
  private config: PhysicsConfig;
  private screenSize: ScreenSize;
  private gameMode: GameMode;

  constructor(
    screenSize: ScreenSize,
    gameMode: GameMode = 'traditional',
    config: Partial<PhysicsConfig> = {}
  ) {
    this.screenSize = screenSize;
    this.gameMode = gameMode;
    this.config = { ...DEFAULT_PHYSICS_CONFIG, ...config };
  }

  // Spaceship physics
  updateSpaceship(spaceship: Spaceship, input: {
    thrust: boolean;
    rotateLeft: boolean;
    rotateRight: boolean;
  }): void {
    if (!spaceship.alive) return;

    const oldVelocity = { ...spaceship.velocity };
    const oldPosition = { ...spaceship.position };

    if (this.updateCount <= 10) {
      console.log('[Physics] START updateSpaceship:', {
        oldPos: oldPosition,
        oldVel: oldVelocity,
        input
      });
    }

    // Handle rotation
    if (input.rotateLeft) {
      spaceship.rotation = normalizeRotation(spaceship.rotation - this.config.rotationSpeed);
    }
    if (input.rotateRight) {
      spaceship.rotation = normalizeRotation(spaceship.rotation + this.config.rotationSpeed);
    }

    // Handle thrust
    spaceship.thrust = input.thrust;
    if (input.thrust) {
      const thrustDirection = rotationToDirection(spaceship.rotation);
      const thrustForce = scaleVelocity(thrustDirection, this.config.thrustPower);
      spaceship.velocity.dx += thrustForce.dx;
      spaceship.velocity.dy += thrustForce.dy;
      console.log('[Physics] Thrust applied:', {
        direction: thrustDirection,
        force: thrustForce,
        newVelocity: spaceship.velocity
      });
    }

    // Apply damping (space friction)
    spaceship.velocity = scaleVelocity(spaceship.velocity, this.config.dampingFactor);

    // Limit maximum speed
    const speed = getVelocityMagnitude(spaceship.velocity);
    if (speed > this.config.maxSpeed) {
      const scale = this.config.maxSpeed / speed;
      spaceship.velocity = scaleVelocity(spaceship.velocity, scale);
    }

    // Update position
    spaceship.position = addVelocityToPosition(spaceship.position, spaceship.velocity);

    // Always wrap around screen edges (proper asteroids behavior)
    const preWrapPos = { ...spaceship.position };
    spaceship.position = wrapPosition(spaceship.position, this.screenSize.width, this.screenSize.height);

    if (this.updateCount <= 10 || (preWrapPos.y !== spaceship.position.y || preWrapPos.x !== spaceship.position.x)) {
      console.log('[Physics] END updateSpaceship:', {
        newPos: spaceship.position,
        newVel: spaceship.velocity,
        preWrapPos,
        screenSize: this.screenSize,
        wrapped: preWrapPos.y !== spaceship.position.y || preWrapPos.x !== spaceship.position.x
      });
    }
  }

  // Asteroid physics
  updateAsteroid(asteroid: Asteroid): void {
    if (!asteroid.active) return;

    // Update position
    asteroid.position = addVelocityToPosition(asteroid.position, asteroid.velocity);

    // Always use traditional wrapping for proper asteroids behavior
    asteroid.position = wrapPosition(asteroid.position, this.screenSize.width, this.screenSize.height);
  }

  // Projectile physics
  updateProjectile(projectile: Projectile): void {
    if (!projectile.active) return;

    // Decrease lifespan
    projectile.lifespan--;
    if (projectile.lifespan <= 0) {
      projectile.active = false;
      return;
    }

    // Update position
    projectile.position = addVelocityToPosition(projectile.position, projectile.velocity);

    // Check if projectile is off screen
    if (this.isOffScreen(projectile.position)) {
      projectile.active = false;
    }
  }

  private updateCount = 0;

  // Update all game objects
  updateAllObjects(
    spaceship: Spaceship,
    asteroids: Asteroid[],
    projectiles: Projectile[],
    input: {
      thrust: boolean;
      rotateLeft: boolean;
      rotateRight: boolean;
    }
  ): void {
    this.updateCount++;

    // Log first 10 frames to debug initialization
    if (this.updateCount <= 10) {
      console.log(`[Physics] Frame ${this.updateCount} - updateAllObjects entry:`, {
        velocity: spaceship.velocity,
        position: spaceship.position,
        input: input
      });
    }

    // Update spaceship
    this.updateSpaceship(spaceship, input);

    // Update asteroids
    asteroids.forEach(asteroid => this.updateAsteroid(asteroid));

    // Update projectiles
    projectiles.forEach(projectile => this.updateProjectile(projectile));

    // No scrolling physics - pure space physics only
  }

  // Utility methods
  private isOffScreen(position: Position): boolean {
    return (
      position.x < -1 ||
      position.x > this.screenSize.width ||
      position.y < -1 ||
      position.y > this.screenSize.height
    );
  }

  // Configuration updates
  setGameMode(gameMode: GameMode): void {
    this.gameMode = gameMode;
  }

  setScreenSize(screenSize: ScreenSize): void {
    this.screenSize = screenSize;
  }

  updateConfig(config: Partial<PhysicsConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): PhysicsConfig {
    return { ...this.config };
  }

  // Helper for creating projectiles with correct physics
  createProjectileFromSpaceship(spaceship: Spaceship): Projectile {
    const direction = rotationToDirection(spaceship.rotation);
    // Projectile moves in the direction spaceship is pointing
    const velocity = scaleVelocity(direction, this.config.projectileSpeed);

    // Don't add spaceship velocity - projectiles should shoot straight
    // This makes them easier to aim and more predictable

    // Start position slightly ahead of spaceship
    const startOffset = 1.5;
    const startPosition: Position = {
      x: spaceship.position.x + direction.dx * startOffset,
      y: spaceship.position.y + direction.dy * startOffset
    };

    return {
      position: startPosition,
      velocity,
      lifespan: 90, // 1.5 seconds at 60fps (increased for slower projectiles)
      character: '*',  // Changed from '.' to '*' for better visibility
      active: true
    };
  }

  // Respawn spaceship at safe position
  respawnSpaceship(spaceship: Spaceship, asteroids: Asteroid[]): void {
    const centerX = Math.floor(this.screenSize.width / 2);
    const centerY = Math.floor(this.screenSize.height / 2);

    // Try to find a safe spawn position
    let safePosition = { x: centerX, y: centerY };
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const testPosition = {
        x: centerX + (Math.random() - 0.5) * 10,
        y: centerY + (Math.random() - 0.5) * 10
      };

      // Check if position is clear of asteroids
      const isSafe = !asteroids.some(asteroid =>
        asteroid.active &&
        Math.abs(asteroid.position.x - testPosition.x) < 3 &&
        Math.abs(asteroid.position.y - testPosition.y) < 3
      );

      if (isSafe) {
        safePosition = testPosition;
        break;
      }
      attempts++;
    }

    // Reset spaceship
    spaceship.position = safePosition;
    spaceship.velocity = { dx: 0, dy: 0 };
    spaceship.rotation = 0;
    spaceship.thrust = false;
    spaceship.alive = true;
  }
}