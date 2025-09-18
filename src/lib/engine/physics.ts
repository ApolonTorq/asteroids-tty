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
  thrustPower: 0.3,
  dampingFactor: 0.99,
  maxSpeed: 8,
  rotationSpeed: 5,
  projectileSpeed: 5,
  scrollSpeed: 0.5
};

export class PhysicsEngine {
  private config: PhysicsConfig;
  private screenSize: ScreenSize;
  private gameMode: GameMode;

  constructor(
    screenSize: ScreenSize,
    gameMode: GameMode = 'scrolling',
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

    // Handle screen wrapping based on game mode
    if (this.gameMode === 'traditional') {
      spaceship.position = wrapPosition(spaceship.position, this.screenSize.width, this.screenSize.height);
    } else {
      // In scrolling mode, only wrap horizontally
      if (spaceship.position.x < 0) {
        spaceship.position.x = this.screenSize.width - 1;
      } else if (spaceship.position.x >= this.screenSize.width) {
        spaceship.position.x = 0;
      }

      // Keep spaceship in vertical bounds
      spaceship.position.y = Math.max(0, Math.min(this.screenSize.height - 1, spaceship.position.y));
    }
  }

  // Asteroid physics
  updateAsteroid(asteroid: Asteroid): void {
    if (!asteroid.active) return;

    // Update position
    asteroid.position = addVelocityToPosition(asteroid.position, asteroid.velocity);

    // Handle screen wrapping/behavior based on game mode
    if (this.gameMode === 'traditional') {
      asteroid.position = wrapPosition(asteroid.position, this.screenSize.width, this.screenSize.height);
    } else {
      // In scrolling mode, asteroids move with the scroll
      asteroid.position.y += this.config.scrollSpeed;

      // Wrap horizontally
      if (asteroid.position.x < 0) {
        asteroid.position.x = this.screenSize.width - 1;
      } else if (asteroid.position.x >= this.screenSize.width) {
        asteroid.position.x = 0;
      }

      // Respawn at top when going off bottom
      if (asteroid.position.y >= this.screenSize.height) {
        asteroid.position.y = -1;
        asteroid.position.x = Math.random() * this.screenSize.width;
      }
    }
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
    // Update spaceship
    this.updateSpaceship(spaceship, input);

    // Update asteroids
    asteroids.forEach(asteroid => this.updateAsteroid(asteroid));

    // Update projectiles
    projectiles.forEach(projectile => this.updateProjectile(projectile));

    // In scrolling mode, apply background scroll effect
    if (this.gameMode === 'scrolling') {
      this.applyScrollingPhysics(spaceship, asteroids);
    }
  }

  // Scrolling mode specific physics
  private applyScrollingPhysics(spaceship: Spaceship, asteroids: Asteroid[]): void {
    // In scrolling mode, the "screen" moves upward
    // This creates the illusion that everything is moving down

    // Apply scroll compensation to spaceship if it's not thrusting against scroll
    if (!spaceship.thrust || spaceship.velocity.dy >= 0) {
      spaceship.position.y += this.config.scrollSpeed;
    }

    // Ensure spaceship doesn't go off screen
    if (spaceship.position.y >= this.screenSize.height) {
      spaceship.position.y = this.screenSize.height - 1;
    }
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
    const velocity = scaleVelocity(direction, this.config.projectileSpeed);

    // Add spaceship's velocity to projectile (momentum conservation)
    velocity.dx += spaceship.velocity.dx * 0.5;
    velocity.dy += spaceship.velocity.dy * 0.5;

    // Start position slightly ahead of spaceship
    const startOffset = 1.2;
    const startPosition: Position = {
      x: spaceship.position.x + direction.dx * startOffset,
      y: spaceship.position.y + direction.dy * startOffset
    };

    return {
      position: startPosition,
      velocity,
      lifespan: 60, // 1 second at 60fps
      character: '.',
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