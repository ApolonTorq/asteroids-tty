import type { Position, Velocity } from '../types/geometry.js';
import type { Spaceship, SpaceshipConfig } from '../types/spaceship.js';
import { rotationToDirection, applyVelocity, wrapPosition } from '../types/geometry.js';
import { createSpaceship } from '../types/spaceship.js';

export class SpaceshipController {
  private spaceship: Spaceship;
  private thrust: boolean;
  private rotateLeft: boolean;
  private rotateRight: boolean;
  private lastPosition: Position;
  private lastRotation: number;

  // Constants for spaceship physics
  private readonly THRUST_POWER = 0.3;
  private readonly ROTATION_SPEED = 5; // degrees per frame
  private readonly MAX_VELOCITY = 8;
  private readonly DRAG = 0.98; // Velocity multiplier each frame

  constructor(config: SpaceshipConfig = {}) {
    this.spaceship = createSpaceship(config);
    this.thrust = false;
    this.rotateLeft = false;
    this.rotateRight = false;
    this.lastPosition = { ...this.spaceship.position };
    this.lastRotation = this.spaceship.rotation;
  }

  // Input handling
  setThrust(active: boolean): void {
    if (this.spaceship.alive) {
      this.thrust = active;
      this.spaceship.thrust = active;
    }
  }

  setRotateLeft(active: boolean): void {
    if (this.spaceship.alive) {
      this.rotateLeft = active;
    }
  }

  setRotateRight(active: boolean): void {
    if (this.spaceship.alive) {
      this.rotateRight = active;
    }
  }

  // Update spaceship physics
  update(screenWidth: number, screenHeight: number, deltaTime: number = 1): void {
    if (!this.spaceship.alive) return;

    this.lastPosition = { ...this.spaceship.position };
    this.lastRotation = this.spaceship.rotation;

    // Handle rotation
    if (this.rotateLeft && !this.rotateRight) {
      this.spaceship.rotation = (this.spaceship.rotation - this.ROTATION_SPEED + 360) % 360;
    } else if (this.rotateRight && !this.rotateLeft) {
      this.spaceship.rotation = (this.spaceship.rotation + this.ROTATION_SPEED) % 360;
    }

    // Handle thrust
    if (this.thrust) {
      const direction = rotationToDirection(this.spaceship.rotation);
      this.spaceship.velocity.x += direction.x * this.THRUST_POWER * deltaTime;
      this.spaceship.velocity.y += direction.y * this.THRUST_POWER * deltaTime;

      // Limit maximum velocity
      const speed = Math.sqrt(
        this.spaceship.velocity.x * this.spaceship.velocity.x +
        this.spaceship.velocity.y * this.spaceship.velocity.y
      );

      if (speed > this.MAX_VELOCITY) {
        this.spaceship.velocity.x = (this.spaceship.velocity.x / speed) * this.MAX_VELOCITY;
        this.spaceship.velocity.y = (this.spaceship.velocity.y / speed) * this.MAX_VELOCITY;
      }
    }

    // Apply drag
    this.spaceship.velocity.x *= this.DRAG;
    this.spaceship.velocity.y *= this.DRAG;

    // Update position
    this.spaceship.position = applyVelocity(this.spaceship.position, this.spaceship.velocity, deltaTime);

    // Handle screen wrapping
    this.spaceship.position = wrapPosition(this.spaceship.position, screenWidth, screenHeight);
  }

  // Spaceship state management
  destroy(): void {
    this.spaceship.alive = false;
    this.spaceship.thrust = false;
    this.thrust = false;
    this.rotateLeft = false;
    this.rotateRight = false;
  }

  respawn(position: Position, resetVelocity: boolean = true): void {
    this.spaceship.alive = true;
    this.spaceship.position = { ...position };

    if (resetVelocity) {
      this.spaceship.velocity = { x: 0, y: 0 };
    }

    this.spaceship.rotation = 0; // Face up
    this.spaceship.thrust = false;
    this.thrust = false;
    this.rotateLeft = false;
    this.rotateRight = false;
  }

  // Shooting mechanics
  canShoot(): boolean {
    return this.spaceship.alive;
  }

  getProjectileSpawnPosition(): Position {
    const direction = rotationToDirection(this.spaceship.rotation);
    return {
      x: this.spaceship.position.x + direction.x * 1.5,
      y: this.spaceship.position.y + direction.y * 1.5
    };
  }

  getProjectileSpawnVelocity(baseProjectileSpeed: number = 10): Velocity {
    const direction = rotationToDirection(this.spaceship.rotation);
    return {
      x: this.spaceship.velocity.x + direction.x * baseProjectileSpeed,
      y: this.spaceship.velocity.y + direction.y * baseProjectileSpeed
    };
  }

  // Collision detection helpers
  getBoundingRadius(): number {
    return 1.0; // Character-based collision radius
  }

  getCenterPosition(): Position {
    return { ...this.spaceship.position };
  }

  // Getters
  getSpaceship(): Readonly<Spaceship> {
    return { ...this.spaceship };
  }

  getPosition(): Position {
    return { ...this.spaceship.position };
  }

  getVelocity(): Velocity {
    return { ...this.spaceship.velocity };
  }

  getRotation(): number {
    return this.spaceship.rotation;
  }

  isAlive(): boolean {
    return this.spaceship.alive;
  }

  isThrusting(): boolean {
    return this.thrust && this.spaceship.alive;
  }

  // Movement state for debugging
  getMovementState(): {
    thrust: boolean;
    rotateLeft: boolean;
    rotateRight: boolean;
    speed: number;
  } {
    const speed = Math.sqrt(
      this.spaceship.velocity.x * this.spaceship.velocity.x +
      this.spaceship.velocity.y * this.spaceship.velocity.y
    );

    return {
      thrust: this.thrust,
      rotateLeft: this.rotateLeft,
      rotateRight: this.rotateRight,
      speed
    };
  }

  // Save/restore state for game state management
  saveState(): object {
    return {
      spaceship: { ...this.spaceship },
      controls: {
        thrust: this.thrust,
        rotateLeft: this.rotateLeft,
        rotateRight: this.rotateRight
      },
      lastPosition: { ...this.lastPosition },
      lastRotation: this.lastRotation
    };
  }

  restoreState(state: any): boolean {
    try {
      if (!state || typeof state !== 'object') return false;

      if (state.spaceship) {
        this.spaceship = { ...this.spaceship, ...state.spaceship };
      }

      if (state.controls) {
        this.thrust = state.controls.thrust || false;
        this.rotateLeft = state.controls.rotateLeft || false;
        this.rotateRight = state.controls.rotateRight || false;
        this.spaceship.thrust = this.thrust;
      }

      if (state.lastPosition) {
        this.lastPosition = { ...state.lastPosition };
      }

      if (typeof state.lastRotation === 'number') {
        this.lastRotation = state.lastRotation;
      }

      return true;
    } catch {
      return false;
    }
  }

  // Physics debugging
  getPhysicsInfo(): {
    position: Position;
    velocity: Velocity;
    rotation: number;
    speed: number;
    thrust: boolean;
    alive: boolean;
  } {
    const speed = Math.sqrt(
      this.spaceship.velocity.x * this.spaceship.velocity.x +
      this.spaceship.velocity.y * this.spaceship.velocity.y
    );

    return {
      position: { ...this.spaceship.position },
      velocity: { ...this.spaceship.velocity },
      rotation: this.spaceship.rotation,
      speed,
      thrust: this.thrust,
      alive: this.spaceship.alive
    };
  }
}

// Factory function for convenience
export function createSpaceshipController(config: SpaceshipConfig = {}): SpaceshipController {
  return new SpaceshipController(config);
}

// Export the class as default
export default SpaceshipController;