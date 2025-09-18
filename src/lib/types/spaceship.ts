import type { Position, Velocity } from './geometry.js';

export interface Spaceship {
  position: Position;
  velocity: Velocity;
  rotation: number;     // 0-360 degrees
  thrust: boolean;      // currently accelerating
  character: string;    // visual representation (< > ^ v)
  alive: boolean;       // collision state
}

export type CharacterMode = 'ascii' | 'unicode';

export interface SpaceshipConfig {
  position: Position;
  velocity?: Velocity;
  rotation?: number;
  thrust?: boolean;
  alive?: boolean;
}

// Character mappings for different modes
export const SPACESHIP_CHARACTERS = {
  ascii: {
    up: '^',
    down: 'v',
    left: '<',
    right: '>'
  },
  unicode: {
    up: '🚀',
    down: '⬇️',
    left: '⬅️',
    right: '➡️'
  }
} as const;

export function getCharacterForRotation(rotation: number, mode: CharacterMode = 'ascii'): string {
  const normalizedRotation = ((rotation % 360) + 360) % 360;
  const characters = SPACESHIP_CHARACTERS[mode];

  // Map rotation to nearest cardinal direction
  if (normalizedRotation >= 315 || normalizedRotation < 45) {
    return characters.up;    // 0° (up)
  } else if (normalizedRotation >= 45 && normalizedRotation < 135) {
    return characters.right; // 90° (right)
  } else if (normalizedRotation >= 135 && normalizedRotation < 225) {
    return characters.down;  // 180° (down)
  } else {
    return characters.left;  // 270° (left)
  }
}

export function createSpaceship(config: SpaceshipConfig): Spaceship {
  const spaceship: Spaceship = {
    position: config.position,
    velocity: config.velocity ?? { dx: 0, dy: 0 },
    rotation: config.rotation ?? 0,
    thrust: config.thrust ?? false,
    character: getCharacterForRotation(config.rotation ?? 0),
    alive: config.alive ?? true
  };

  return spaceship;
}