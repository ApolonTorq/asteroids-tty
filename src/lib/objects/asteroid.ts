import type { Position, Velocity } from '../types/geometry.js';
import type { Asteroid, AsteroidConfig, AsteroidSize } from '../types/asteroid.js';
import { applyVelocity, wrapPosition } from '../types/geometry.js';
import {
  createAsteroid,
  generateRandomAsteroidVelocity,
  fragmentAsteroid,
  getAsteroidScoreValue,
  getAsteroidCollisionRadius
} from '../types/asteroid.js';

export class AsteroidController {
  private asteroid: Asteroid;
  private rotationSpeed: number;
  private lastPosition: Position;

  // Constants for asteroid physics
  private readonly MIN_ROTATION_SPEED = 0.5;
  private readonly MAX_ROTATION_SPEED = 3.0;

  constructor(config: AsteroidConfig = {}) {
    this.asteroid = createAsteroid(config);
    this.rotationSpeed = this.generateRotationSpeed();
    this.lastPosition = { ...this.asteroid.position };
  }

  private generateRotationSpeed(): number {
    const speed = Math.random() * (this.MAX_ROTATION_SPEED - this.MIN_ROTATION_SPEED) + this.MIN_ROTATION_SPEED;
    return Math.random() < 0.5 ? speed : -speed; // Random direction
  }

  // Update asteroid physics
  update(screenWidth: number, screenHeight: number, deltaTime: number = 1): void {
    if (!this.asteroid.active) return;

    this.lastPosition = { ...this.asteroid.position };

    // Update rotation (visual only)
    this.asteroid.rotation = (this.asteroid.rotation + this.rotationSpeed * deltaTime) % 360;

    // Update position
    this.asteroid.position = applyVelocity(this.asteroid.position, this.asteroid.velocity, deltaTime);

    // Handle screen wrapping
    this.asteroid.position = wrapPosition(this.asteroid.position, screenWidth, screenHeight);
  }

  // Asteroid lifecycle
  destroy(): void {
    this.asteroid.active = false;
  }

  isActive(): boolean {
    return this.asteroid.active;
  }

  // Fragmentation
  fragment(): Asteroid[] {
    if (!this.asteroid.active || this.asteroid.size === 'small') {
      return [];
    }

    const fragments = fragmentAsteroid(this.asteroid);
    this.destroy(); // Original asteroid is destroyed
    return fragments;
  }

  // Collision detection helpers
  getBoundingRadius(): number {
    return getAsteroidCollisionRadius(this.asteroid);
  }

  getCenterPosition(): Position {
    return { ...this.asteroid.position };
  }

  // Scoring
  getScoreValue(): number {
    return getAsteroidScoreValue(this.asteroid);
  }

  // Getters
  getAsteroid(): Readonly<Asteroid> {
    return { ...this.asteroid };
  }

  getPosition(): Position {
    return { ...this.asteroid.position };
  }

  getVelocity(): Velocity {
    return { ...this.asteroid.velocity };
  }

  getSize(): AsteroidSize {
    return this.asteroid.size;
  }

  getRotation(): number {
    return this.asteroid.rotation;
  }

  // Setters for external manipulation
  setPosition(position: Position): void {
    this.asteroid.position = { ...position };
  }

  setVelocity(velocity: Velocity): void {
    this.asteroid.velocity = { ...velocity };
  }

  // Physics state
  getPhysicsInfo(): {
    position: Position;
    velocity: Velocity;
    rotation: number;
    rotationSpeed: number;
    size: AsteroidSize;
    active: boolean;
    boundingRadius: number;
  } {
    return {
      position: { ...this.asteroid.position },
      velocity: { ...this.asteroid.velocity },
      rotation: this.asteroid.rotation,
      rotationSpeed: this.rotationSpeed,
      size: this.asteroid.size,
      active: this.asteroid.active,
      boundingRadius: this.getBoundingRadius()
    };
  }

  // Save/restore state
  saveState(): object {
    return {
      asteroid: { ...this.asteroid },
      rotationSpeed: this.rotationSpeed,
      lastPosition: { ...this.lastPosition }
    };
  }

  restoreState(state: any): boolean {
    try {
      if (!state || typeof state !== 'object') return false;

      if (state.asteroid) {
        this.asteroid = { ...this.asteroid, ...state.asteroid };
      }

      if (typeof state.rotationSpeed === 'number') {
        this.rotationSpeed = state.rotationSpeed;
      }

      if (state.lastPosition) {
        this.lastPosition = { ...state.lastPosition };
      }

      return true;
    } catch {
      return false;
    }
  }
}

export class AsteroidManager {
  private asteroids: AsteroidController[];
  private screenWidth: number;
  private screenHeight: number;

  constructor(screenWidth: number, screenHeight: number) {
    this.asteroids = [];
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
  }

  // Asteroid management
  addAsteroid(config: AsteroidConfig): AsteroidController {
    const controller = new AsteroidController(config);
    this.asteroids.push(controller);
    return controller;
  }

  removeAsteroid(controller: AsteroidController): boolean {
    const index = this.asteroids.indexOf(controller);
    if (index > -1) {
      this.asteroids.splice(index, 1);
      return true;
    }
    return false;
  }

  // Generate asteroids for level
  generateAsteroidsForLevel(level: number, count?: number): AsteroidController[] {
    const asteroidCount = count || Math.min(4 + level, 12); // 4-12 asteroids
    const baseSpeed = Math.min(0.5 + level * 0.2, 3.0); // 0.5-3.0 speed
    const newAsteroids: AsteroidController[] = [];

    for (let i = 0; i < asteroidCount; i++) {
      const asteroid = this.generateRandomAsteroid(baseSpeed);
      newAsteroids.push(asteroid);
    }

    return newAsteroids;
  }

  private generateRandomAsteroid(baseSpeed: number): AsteroidController {
    // Random spawn position around screen edges
    const edge = Math.floor(Math.random() * 4);
    let position: Position;

    switch (edge) {
      case 0: // Top
        position = {
          x: Math.random() * this.screenWidth,
          y: -2
        };
        break;
      case 1: // Right
        position = {
          x: this.screenWidth + 2,
          y: Math.random() * this.screenHeight
        };
        break;
      case 2: // Bottom
        position = {
          x: Math.random() * this.screenWidth,
          y: this.screenHeight + 2
        };
        break;
      default: // Left
        position = {
          x: -2,
          y: Math.random() * this.screenHeight
        };
    }

    // Random size (more large asteroids at higher levels)
    const size: AsteroidSize = Math.random() > 0.3 ? 'large' : 'small';

    // Random velocity towards screen center with some variation
    const velocity = generateRandomAsteroidVelocity(baseSpeed);

    const config: AsteroidConfig = {
      position,
      velocity,
      size
    };

    return this.addAsteroid(config);
  }

  // Update all asteroids
  updateAll(deltaTime: number = 1): void {
    this.asteroids.forEach(asteroid => {
      if (asteroid.isActive()) {
        asteroid.update(this.screenWidth, this.screenHeight, deltaTime);
      }
    });
  }

  // Clean up inactive asteroids
  cleanupInactive(): number {
    const initialCount = this.asteroids.length;
    this.asteroids = this.asteroids.filter(asteroid => asteroid.isActive());
    return initialCount - this.asteroids.length;
  }

  // Handle fragmentation
  fragmentAsteroid(controller: AsteroidController): AsteroidController[] {
    const fragments = controller.fragment();
    const newControllers: AsteroidController[] = [];

    // Remove the original asteroid
    this.removeAsteroid(controller);

    // Add fragment controllers
    fragments.forEach(fragment => {
      const fragmentController = new AsteroidController({
        position: fragment.position,
        velocity: fragment.velocity,
        size: fragment.size,
        rotation: fragment.rotation
      });
      this.asteroids.push(fragmentController);
      newControllers.push(fragmentController);
    });

    return newControllers;
  }

  // Getters
  getAllAsteroids(): AsteroidController[] {
    return [...this.asteroids];
  }

  getActiveAsteroids(): AsteroidController[] {
    return this.asteroids.filter(asteroid => asteroid.isActive());
  }

  getAsteroidCount(): number {
    return this.asteroids.length;
  }

  getActiveAsteroidCount(): number {
    return this.asteroids.filter(asteroid => asteroid.isActive()).length;
  }

  // Level completion check
  isLevelComplete(): boolean {
    return this.getActiveAsteroidCount() === 0;
  }

  // Clear all asteroids
  clearAll(): void {
    this.asteroids = [];
  }

  // Screen size updates
  updateScreenSize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;
  }

  // Save/restore state
  saveState(): object {
    return {
      asteroids: this.asteroids.map(asteroid => asteroid.saveState()),
      screenWidth: this.screenWidth,
      screenHeight: this.screenHeight
    };
  }

  restoreState(state: any): boolean {
    try {
      if (!state || typeof state !== 'object') return false;

      this.clearAll();

      if (Array.isArray(state.asteroids)) {
        state.asteroids.forEach((asteroidState: any) => {
          const controller = new AsteroidController();
          if (controller.restoreState(asteroidState)) {
            this.asteroids.push(controller);
          }
        });
      }

      if (typeof state.screenWidth === 'number') {
        this.screenWidth = state.screenWidth;
      }

      if (typeof state.screenHeight === 'number') {
        this.screenHeight = state.screenHeight;
      }

      return true;
    } catch {
      return false;
    }
  }

  // Debug information
  getDebugInfo(): object {
    return {
      totalAsteroids: this.asteroids.length,
      activeAsteroids: this.getActiveAsteroidCount(),
      asteroidsBySize: {
        large: this.asteroids.filter(a => a.isActive() && a.getSize() === 'large').length,
        small: this.asteroids.filter(a => a.isActive() && a.getSize() === 'small').length
      },
      screenSize: { width: this.screenWidth, height: this.screenHeight }
    };
  }
}

// Factory functions
export function createAsteroidController(config: AsteroidConfig = {}): AsteroidController {
  return new AsteroidController(config);
}

export function createAsteroidManager(screenWidth: number, screenHeight: number): AsteroidManager {
  return new AsteroidManager(screenWidth, screenHeight);
}

// Export as default
export default AsteroidController;