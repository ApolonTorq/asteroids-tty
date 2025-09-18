import type { Position } from './geometry.js';
import type { Spaceship, CharacterMode } from './spaceship.js';
import type { Asteroid } from './asteroid.js';
import type { Projectile } from './projectile.js';

export type GameMode = 'scrolling' | 'traditional';
export type GameStatus = 'playing' | 'gameOver' | 'paused';
export type Difficulty = 'easy' | 'normal' | 'hard';

export interface ScreenSize {
  width: number;
  height: number;
}

export interface GameObjects {
  spaceship: Spaceship;
  asteroids: Asteroid[];
  projectiles: Projectile[];
}

export interface GameState {
  score: number;
  level: number;
  lives: number;
  gameMode: GameMode;
  characterMode: CharacterMode;
  screenSize: ScreenSize;
  objects: GameObjects;
  gameStatus: GameStatus;
  difficulty: Difficulty;
}

export interface GameStateConfig {
  score?: number;
  level?: number;
  lives?: number;
  gameMode?: GameMode;
  characterMode?: CharacterMode;
  screenSize?: ScreenSize;
  difficulty?: Difficulty;
  spaceshipPosition?: Position;
}

export interface GameStateSnapshot {
  score: number;
  level: number;
  lives: number;
  gameStatus: GameStatus;
  timestamp: number;
}

// Default values
export const DEFAULT_SCREEN_SIZE: ScreenSize = { width: 80, height: 25 };
export const DEFAULT_LIVES = 3;
export const DEFAULT_LEVEL = 1;
export const MIN_SCREEN_SIZE: ScreenSize = { width: 40, height: 20 };

// Scoring constants
export const SCORE_MULTIPLIERS = {
  easy: 1,
  normal: 1.5,
  hard: 2
} as const;

export const LEVEL_COMPLETION_BONUS = 100;
export const EXTRA_LIFE_THRESHOLD = 10000;

// Level progression
export function getAsteroidCountForLevel(level: number): number {
  return Math.min(4 + level * 2, 20); // Start with 6, max 20
}

export function getAsteroidSpeedForLevel(level: number): number {
  return 0.15 + (level - 1) * 0.05; // Start at 0.15, increase by 0.05 per level
}

export function getLevelCompletionBonus(level: number): number {
  return LEVEL_COMPLETION_BONUS * level;
}

// Score calculation
export function calculateScore(baseScore: number, difficulty: Difficulty): number {
  return Math.floor(baseScore * SCORE_MULTIPLIERS[difficulty]);
}

export function shouldAwardExtraLife(currentScore: number, previousScore: number): boolean {
  const currentMilestone = Math.floor(currentScore / EXTRA_LIFE_THRESHOLD);
  const previousMilestone = Math.floor(previousScore / EXTRA_LIFE_THRESHOLD);
  return currentMilestone > previousMilestone;
}

// Game state validation
export function isValidScreenSize(screenSize: ScreenSize): boolean {
  return (
    screenSize.width >= MIN_SCREEN_SIZE.width &&
    screenSize.height >= MIN_SCREEN_SIZE.height &&
    screenSize.width <= 200 && // Reasonable maximum
    screenSize.height <= 100
  );
}

export function getDefaultSpaceshipPosition(screenSize: ScreenSize): Position {
  return {
    x: Math.floor(screenSize.width / 2),
    y: Math.floor(screenSize.height / 2)
  };
}

// Game state transitions
export function canPause(gameStatus: GameStatus): boolean {
  return gameStatus === 'playing';
}

export function canResume(gameStatus: GameStatus): boolean {
  return gameStatus === 'paused';
}

export function canReset(gameStatus: GameStatus): boolean {
  return gameStatus === 'gameOver' || gameStatus === 'paused';
}

// Serialization helpers
export function gameStateToSnapshot(gameState: GameState): GameStateSnapshot {
  return {
    score: gameState.score,
    level: gameState.level,
    lives: gameState.lives,
    gameStatus: gameState.gameStatus,
    timestamp: Date.now()
  };
}

export function isLevelComplete(asteroids: Asteroid[]): boolean {
  return asteroids.filter(asteroid => asteroid.active).length === 0;
}

export function isGameOver(lives: number): boolean {
  return lives <= 0;
}