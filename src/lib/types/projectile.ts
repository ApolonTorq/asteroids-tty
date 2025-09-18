import type { Position, Velocity } from './geometry.js';
import type { CharacterMode } from './spaceship.js';

export interface Projectile {
  position: Position;
  velocity: Velocity;
  lifespan: number;     // frames remaining
  character: string;    // '.' for bullet
  active: boolean;      // expired/hit state
}

export interface ProjectileConfig {
  position: Position;
  velocity: Velocity;
  lifespan?: number;
  active?: boolean;
}

// Character mappings for different modes
export const PROJECTILE_CHARACTERS = {
  ascii: '.',
  unicode: '•'
} as const;

export function getProjectileCharacter(mode: CharacterMode = 'ascii'): string {
  return PROJECTILE_CHARACTERS[mode];
}

export function createProjectile(config: ProjectileConfig): Projectile {
  return {
    position: config.position,
    velocity: config.velocity,
    lifespan: config.lifespan ?? 100, // Default 100 frames
    character: getProjectileCharacter(),
    active: config.active ?? true
  };
}

export function updateProjectile(projectile: Projectile): void {
  if (!projectile.active) return;

  // Decrease lifespan
  projectile.lifespan--;

  // Deactivate if lifespan expired
  if (projectile.lifespan <= 0) {
    projectile.active = false;
    return;
  }

  // Update position
  projectile.position.x += projectile.velocity.dx;
  projectile.position.y += projectile.velocity.dy;
}

export function isProjectileOffScreen(
  projectile: Projectile,
  screenWidth: number,
  screenHeight: number
): boolean {
  return (
    projectile.position.x < 0 ||
    projectile.position.x >= screenWidth ||
    projectile.position.y < 0 ||
    projectile.position.y >= screenHeight
  );
}

export function createProjectileFromSpaceship(
  spaceshipPosition: Position,
  spaceshipRotation: number,
  projectileSpeed: number = 5
): Projectile {
  // Calculate projectile starting position (slightly ahead of spaceship)
  const radians = (spaceshipRotation * Math.PI) / 180;
  const startOffset = 1.5; // Start slightly ahead of spaceship

  const startPosition: Position = {
    x: spaceshipPosition.x + Math.sin(radians) * startOffset,
    y: spaceshipPosition.y - Math.cos(radians) * startOffset
  };

  // Calculate projectile velocity based on spaceship rotation
  const velocity: Velocity = {
    dx: Math.sin(radians) * projectileSpeed,
    dy: -Math.cos(radians) * projectileSpeed
  };

  return createProjectile({
    position: startPosition,
    velocity
  });
}