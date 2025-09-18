import type { Position, Velocity } from './geometry.js';
import type { CharacterMode } from './spaceship.js';

export type AsteroidSize = 'large' | 'small';

export interface Asteroid {
  position: Position;
  velocity: Velocity;
  size: AsteroidSize;
  character: string;    // 'O' for large, 'o' for small
  active: boolean;      // destroyed state
}

export interface AsteroidConfig {
  position: Position;
  velocity?: Velocity;
  size?: AsteroidSize;
  active?: boolean;
}

// Character mappings for different modes
export const ASTEROID_CHARACTERS = {
  ascii: {
    large: 'O',
    small: 'o'
  },
  unicode: {
    large: '🪨',
    small: '⚫'
  }
} as const;

export function getAsteroidCharacter(size: AsteroidSize, mode: CharacterMode = 'ascii'): string {
  return ASTEROID_CHARACTERS[mode][size];
}

export function createAsteroid(config: AsteroidConfig): Asteroid {
  const size = config.size ?? 'large';

  return {
    position: config.position,
    velocity: config.velocity ?? { dx: 0, dy: 0 },
    size,
    character: getAsteroidCharacter(size),
    active: config.active ?? true
  };
}

export function getScoreForAsteroid(size: AsteroidSize): number {
  switch (size) {
    case 'large':
      return 20;
    case 'small':
      return 50;
    default:
      return 0;
  }
}

export function generateRandomAsteroidVelocity(baseSpeed: number = 0.15): Velocity {
  const angle = Math.random() * 2 * Math.PI;
  const speed = baseSpeed * (0.8 + Math.random() * 0.2); // 80-100% of base speed for minimal variation

  return {
    dx: Math.cos(angle) * speed,
    dy: Math.sin(angle) * speed
  };
}

export function createAsteroidFragments(parentAsteroid: Asteroid): Asteroid[] {
  if (parentAsteroid.size === 'small') {
    return []; // Small asteroids don't fragment
  }

  const fragmentCount = 2 + Math.floor(Math.random() * 2); // 2-3 fragments
  const fragments: Asteroid[] = [];

  for (let i = 0; i < fragmentCount; i++) {
    // Create fragments near parent position with random velocities
    const offsetAngle = (Math.PI * 2 * i) / fragmentCount + Math.random() * 0.5;
    const offsetDistance = 1 + Math.random() * 2;

    const fragmentPosition: Position = {
      x: parentAsteroid.position.x + Math.cos(offsetAngle) * offsetDistance,
      y: parentAsteroid.position.y + Math.sin(offsetAngle) * offsetDistance
    };

    // Base fragment velocity on parent velocity plus small random component
    const baseSpeed = Math.sqrt(
      parentAsteroid.velocity.dx ** 2 + parentAsteroid.velocity.dy ** 2
    );
    const fragmentVelocity = generateRandomAsteroidVelocity(baseSpeed * 1.1); // Only 10% faster than parent

    fragments.push(createAsteroid({
      position: fragmentPosition,
      velocity: fragmentVelocity,
      size: 'small'
    }));
  }

  return fragments;
}