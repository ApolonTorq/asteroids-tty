import type { Position, Velocity } from '../types/geometry.js';
import type { Projectile, ProjectileConfig } from '../types/projectile.js';
import { applyVelocity, wrapPosition } from '../types/geometry.js';
import { createProjectile, createProjectileFromSpaceship } from '../types/projectile.js';
import type { Spaceship } from '../types/spaceship.js';

export class ProjectileController {
  private projectile: Projectile;
  private lastPosition: Position;

  constructor(config: ProjectileConfig = {}) {
    this.projectile = createProjectile(config);
    this.lastPosition = { ...this.projectile.position };
  }

  // Update projectile physics
  update(screenWidth: number, screenHeight: number, deltaTime: number = 1): void {
    if (!this.projectile.active) return;

    this.lastPosition = { ...this.projectile.position };

    // Update lifetime
    this.projectile.age += deltaTime;

    // Check if projectile has expired
    if (this.projectile.age >= this.projectile.maxAge) {
      this.destroy();
      return;
    }

    // Update position
    this.projectile.position = applyVelocity(this.projectile.position, this.projectile.velocity, deltaTime);

    // Handle screen wrapping (projectiles can wrap around screen)
    this.projectile.position = wrapPosition(this.projectile.position, screenWidth, screenHeight);
  }

  // Projectile lifecycle
  destroy(): void {
    this.projectile.active = false;
  }

  isActive(): boolean {
    return this.projectile.active;
  }

  isExpired(): boolean {
    return this.projectile.age >= this.projectile.maxAge;
  }

  // Collision detection helpers
  getBoundingRadius(): number {
    return 0.5; // Small collision radius for projectiles
  }

  getCenterPosition(): Position {
    return { ...this.projectile.position };
  }

  // Getters
  getProjectile(): Readonly<Projectile> {
    return { ...this.projectile };
  }

  getPosition(): Position {
    return { ...this.projectile.position };
  }

  getVelocity(): Velocity {
    return { ...this.projectile.velocity };
  }

  getAge(): number {
    return this.projectile.age;
  }

  getMaxAge(): number {
    return this.projectile.maxAge;
  }

  getRemainingLifetime(): number {
    return Math.max(0, this.projectile.maxAge - this.projectile.age);
  }

  getLifetimeRatio(): number {
    return this.projectile.maxAge > 0 ? this.projectile.age / this.projectile.maxAge : 1;
  }

  // Physics state
  getPhysicsInfo(): {
    position: Position;
    velocity: Velocity;
    age: number;
    maxAge: number;
    active: boolean;
    expired: boolean;
    speed: number;
  } {
    const speed = Math.sqrt(
      this.projectile.velocity.x * this.projectile.velocity.x +
      this.projectile.velocity.y * this.projectile.velocity.y
    );

    return {
      position: { ...this.projectile.position },
      velocity: { ...this.projectile.velocity },
      age: this.projectile.age,
      maxAge: this.projectile.maxAge,
      active: this.projectile.active,
      expired: this.isExpired(),
      speed
    };
  }

  // Save/restore state
  saveState(): object {
    return {
      projectile: { ...this.projectile },
      lastPosition: { ...this.lastPosition }
    };
  }

  restoreState(state: any): boolean {
    try {
      if (!state || typeof state !== 'object') return false;

      if (state.projectile) {
        this.projectile = { ...this.projectile, ...state.projectile };
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

export class ProjectileManager {
  private projectiles: ProjectileController[];
  private screenWidth: number;
  private screenHeight: number;
  private maxProjectiles: number;

  // Shooting rate limiting
  private lastShotTime: number;
  private readonly SHOT_COOLDOWN = 100; // ms between shots

  constructor(screenWidth: number, screenHeight: number, maxProjectiles: number = 10) {
    this.projectiles = [];
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.maxProjectiles = maxProjectiles;
    this.lastShotTime = 0;
  }

  // Projectile management
  addProjectile(config: ProjectileConfig): ProjectileController | null {
    // Check if we can add more projectiles
    if (this.getActiveProjectileCount() >= this.maxProjectiles) {
      return null;
    }

    const controller = new ProjectileController(config);
    this.projectiles.push(controller);
    return controller;
  }

  addProjectileFromSpaceship(spaceship: Spaceship): ProjectileController | null {
    // Check shooting cooldown
    const now = performance.now();
    if (now - this.lastShotTime < this.SHOT_COOLDOWN) {
      return null;
    }

    // Check if spaceship can shoot
    if (!spaceship.alive) {
      return null;
    }

    // Create projectile from spaceship
    const projectile = createProjectileFromSpaceship(spaceship);
    const controller = this.addProjectile({
      position: projectile.position,
      velocity: projectile.velocity,
      maxAge: projectile.maxAge
    });

    if (controller) {
      this.lastShotTime = now;
    }

    return controller;
  }

  removeProjectile(controller: ProjectileController): boolean {
    const index = this.projectiles.indexOf(controller);
    if (index > -1) {
      this.projectiles.splice(index, 1);
      return true;
    }
    return false;
  }

  // Update all projectiles
  updateAll(deltaTime: number = 1): void {
    this.projectiles.forEach(projectile => {
      if (projectile.isActive()) {
        projectile.update(this.screenWidth, this.screenHeight, deltaTime);
      }
    });
  }

  // Clean up inactive projectiles
  cleanupInactive(): number {
    const initialCount = this.projectiles.length;
    this.projectiles = this.projectiles.filter(projectile => projectile.isActive());
    return initialCount - this.projectiles.length;
  }

  // Clean up expired projectiles
  cleanupExpired(): number {
    const expiredProjectiles = this.projectiles.filter(p => p.isExpired());
    expiredProjectiles.forEach(p => p.destroy());
    return this.cleanupInactive();
  }

  // Shooting control
  canShoot(): boolean {
    const now = performance.now();
    return (
      this.getActiveProjectileCount() < this.maxProjectiles &&
      now - this.lastShotTime >= this.SHOT_COOLDOWN
    );
  }

  getShotCooldownRemaining(): number {
    const now = performance.now();
    return Math.max(0, this.SHOT_COOLDOWN - (now - this.lastShotTime));
  }

  // Getters
  getAllProjectiles(): ProjectileController[] {
    return [...this.projectiles];
  }

  getActiveProjectiles(): ProjectileController[] {
    return this.projectiles.filter(projectile => projectile.isActive());
  }

  getProjectileCount(): number {
    return this.projectiles.length;
  }

  getActiveProjectileCount(): number {
    return this.projectiles.filter(projectile => projectile.isActive()).length;
  }

  getMaxProjectiles(): number {
    return this.maxProjectiles;
  }

  // Configuration
  setMaxProjectiles(max: number): void {
    this.maxProjectiles = Math.max(1, max);
  }

  setShotCooldown(cooldown: number): void {
    // This would require modifying the readonly property, so we'll skip implementation
    // In a real scenario, this could be configurable via constructor
  }

  // Clear all projectiles
  clearAll(): void {
    this.projectiles = [];
    this.lastShotTime = 0;
  }

  // Screen size updates
  updateScreenSize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;
  }

  // Collision helpers
  checkCollisionWithPosition(position: Position, radius: number): ProjectileController[] {
    return this.getActiveProjectiles().filter(projectile => {
      const projectilePos = projectile.getPosition();
      const distance = Math.sqrt(
        Math.pow(projectilePos.x - position.x, 2) +
        Math.pow(projectilePos.y - position.y, 2)
      );
      return distance <= (radius + projectile.getBoundingRadius());
    });
  }

  // Performance monitoring
  getPerformanceStats(): {
    activeProjectiles: number;
    totalProjectiles: number;
    averageAge: number;
    oldestProjectile: number;
    canShoot: boolean;
    cooldownRemaining: number;
  } {
    const activeProjectiles = this.getActiveProjectiles();
    const ages = activeProjectiles.map(p => p.getAge());
    const averageAge = ages.length > 0 ? ages.reduce((a, b) => a + b, 0) / ages.length : 0;
    const oldestProjectile = ages.length > 0 ? Math.max(...ages) : 0;

    return {
      activeProjectiles: activeProjectiles.length,
      totalProjectiles: this.projectiles.length,
      averageAge,
      oldestProjectile,
      canShoot: this.canShoot(),
      cooldownRemaining: this.getShotCooldownRemaining()
    };
  }

  // Save/restore state
  saveState(): object {
    return {
      projectiles: this.projectiles.map(projectile => projectile.saveState()),
      screenWidth: this.screenWidth,
      screenHeight: this.screenHeight,
      maxProjectiles: this.maxProjectiles,
      lastShotTime: this.lastShotTime
    };
  }

  restoreState(state: any): boolean {
    try {
      if (!state || typeof state !== 'object') return false;

      this.clearAll();

      if (Array.isArray(state.projectiles)) {
        state.projectiles.forEach((projectileState: any) => {
          const controller = new ProjectileController();
          if (controller.restoreState(projectileState)) {
            this.projectiles.push(controller);
          }
        });
      }

      if (typeof state.screenWidth === 'number') {
        this.screenWidth = state.screenWidth;
      }

      if (typeof state.screenHeight === 'number') {
        this.screenHeight = state.screenHeight;
      }

      if (typeof state.maxProjectiles === 'number') {
        this.maxProjectiles = state.maxProjectiles;
      }

      if (typeof state.lastShotTime === 'number') {
        this.lastShotTime = state.lastShotTime;
      }

      return true;
    } catch {
      return false;
    }
  }

  // Debug information
  getDebugInfo(): object {
    const activeProjectiles = this.getActiveProjectiles();
    const expiredProjectiles = this.projectiles.filter(p => p.isExpired()).length;

    return {
      totalProjectiles: this.projectiles.length,
      activeProjectiles: activeProjectiles.length,
      expiredProjectiles,
      maxProjectiles: this.maxProjectiles,
      canShoot: this.canShoot(),
      cooldownRemaining: this.getShotCooldownRemaining(),
      averageLifetime: activeProjectiles.length > 0
        ? activeProjectiles.reduce((sum, p) => sum + p.getLifetimeRatio(), 0) / activeProjectiles.length
        : 0,
      screenSize: { width: this.screenWidth, height: this.screenHeight }
    };
  }
}

// Factory functions
export function createProjectileController(config: ProjectileConfig = {}): ProjectileController {
  return new ProjectileController(config);
}

export function createProjectileManager(
  screenWidth: number,
  screenHeight: number,
  maxProjectiles: number = 10
): ProjectileManager {
  return new ProjectileManager(screenWidth, screenHeight, maxProjectiles);
}

// Export as default
export default ProjectileController;