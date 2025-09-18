import type { CharacterMode } from './spaceship.js';
import type { ScreenSize } from './game-state.js';

export interface CharacterSet {
  spaceship: {
    up: string;
    down: string;
    left: string;
    right: string;
  };
  asteroid: {
    large: string;
    small: string;
  };
  projectile: string;
}

export interface ColorScheme {
  background: string;
  foreground: string;
  highlight: string;
  accent: string;
}

export interface DisplayConfiguration {
  characterSet: CharacterSet;
  colors: ColorScheme;
  characterMode: CharacterMode;
  screenSize: ScreenSize;
}

// Predefined character sets
export const CHARACTER_SETS: Record<CharacterMode, CharacterSet> = {
  ascii: {
    spaceship: {
      up: '^',
      down: 'v',
      left: '<',
      right: '>'
    },
    asteroid: {
      large: 'O',
      small: 'o'
    },
    projectile: '.'
  },
  unicode: {
    spaceship: {
      up: '🚀',
      down: '⬇️',
      left: '⬅️',
      right: '➡️'
    },
    asteroid: {
      large: '🪨',
      small: '⚫'
    },
    projectile: '•'
  }
};

// Predefined color schemes
export const COLOR_SCHEMES = {
  retro: {
    background: '#000000',
    foreground: '#00ff00',
    highlight: '#ffff00',
    accent: '#ff0000'
  },
  classic: {
    background: '#000000',
    foreground: '#ffffff',
    highlight: '#00ffff',
    accent: '#ff8000'
  },
  amber: {
    background: '#000000',
    foreground: '#ffbf00',
    highlight: '#ffd700',
    accent: '#ff4500'
  }
} as const;

export type ColorSchemeName = keyof typeof COLOR_SCHEMES;

export function createDisplayConfiguration(
  characterMode: CharacterMode = 'ascii',
  colorScheme: ColorSchemeName = 'retro',
  screenSize: ScreenSize = { width: 80, height: 25 }
): DisplayConfiguration {
  return {
    characterSet: CHARACTER_SETS[characterMode],
    colors: COLOR_SCHEMES[colorScheme],
    characterMode,
    screenSize
  };
}

export function getCharacterForObject(
  objectType: 'spaceship' | 'asteroid' | 'projectile',
  config: DisplayConfiguration,
  details?: { rotation?: number; size?: 'large' | 'small' }
): string {
  switch (objectType) {
    case 'spaceship': {
      const rotation = details?.rotation ?? 0;
      const normalizedRotation = ((rotation % 360) + 360) % 360;

      if (normalizedRotation >= 315 || normalizedRotation < 45) {
        return config.characterSet.spaceship.up;
      } else if (normalizedRotation >= 45 && normalizedRotation < 135) {
        return config.characterSet.spaceship.right;
      } else if (normalizedRotation >= 135 && normalizedRotation < 225) {
        return config.characterSet.spaceship.down;
      } else {
        return config.characterSet.spaceship.left;
      }
    }
    case 'asteroid': {
      const size = details?.size ?? 'large';
      return config.characterSet.asteroid[size];
    }
    case 'projectile':
      return config.characterSet.projectile;
    default:
      return '?';
  }
}

export function updateCharacterMode(
  config: DisplayConfiguration,
  newMode: CharacterMode
): DisplayConfiguration {
  return {
    ...config,
    characterMode: newMode,
    characterSet: CHARACTER_SETS[newMode]
  };
}

export function updateColorScheme(
  config: DisplayConfiguration,
  newScheme: ColorSchemeName
): DisplayConfiguration {
  return {
    ...config,
    colors: COLOR_SCHEMES[newScheme]
  };
}

export function updateScreenSize(
  config: DisplayConfiguration,
  newSize: ScreenSize
): DisplayConfiguration {
  return {
    ...config,
    screenSize: newSize
  };
}

// CSS helper functions
export function getCSSColorVars(colors: ColorScheme): Record<string, string> {
  return {
    '--game-bg': colors.background,
    '--game-fg': colors.foreground,
    '--game-highlight': colors.highlight,
    '--game-accent': colors.accent
  };
}

export function getMonospaceCSS(): Record<string, string> {
  return {
    fontFamily: "'Courier New', 'Monaco', 'Consolas', monospace",
    fontWeight: 'normal',
    fontSize: '1rem',
    lineHeight: '1',
    letterSpacing: '0'
  };
}