import type { Position } from '../types/geometry.js';
import type { AsteroidConfig, AsteroidSize } from '../types/asteroid.js';
import type { ScreenSize, Difficulty } from '../types/game-state.js';
import { generateRandomAsteroidVelocity } from '../types/asteroid.js';

export interface LevelConfig {
  asteroidCount: number;
  asteroidSpeed: number;
  largeAsteroidRatio: number; // 0.0 to 1.0
  spawnSafeZone: number; // Radius around center to avoid spawning
  levelBonus: number;
}

export interface LevelTemplate {
  level: number;
  config: LevelConfig;
  description: string;
}

export class LevelGenerator {
  private screenSize: ScreenSize;
  private difficulty: Difficulty;

  // Base level progression parameters
  private readonly BASE_ASTEROID_COUNT = 4;
  private readonly MAX_ASTEROID_COUNT = 15;
  private readonly BASE_ASTEROID_SPEED = 0.8;
  private readonly MAX_ASTEROID_SPEED = 4.0;
  private readonly BASE_LARGE_RATIO = 0.7;
  private readonly MIN_LARGE_RATIO = 0.3;
  private readonly SAFE_ZONE_RADIUS = 3;

  // Difficulty multipliers
  private readonly DIFFICULTY_MULTIPLIERS = {
    easy: { speed: 0.7, count: 0.8, bonus: 0.8 },
    normal: { speed: 1.0, count: 1.0, bonus: 1.0 },
    hard: { speed: 1.3, count: 1.2, bonus: 1.5 }
  };

  constructor(screenSize: ScreenSize, difficulty: Difficulty = 'normal') {
    this.screenSize = screenSize;
    this.difficulty = difficulty;
  }

  // Generate level configuration
  generateLevelConfig(level: number): LevelConfig {
    const multiplier = this.DIFFICULTY_MULTIPLIERS[this.difficulty];

    // Progressive asteroid count (4 to 15)
    const baseCount = Math.min(
      this.BASE_ASTEROID_COUNT + Math.floor(level / 2),
      this.MAX_ASTEROID_COUNT
    );
    const asteroidCount = Math.floor(baseCount * multiplier.count);

    // Progressive speed (0.8 to 4.0)
    const baseSpeed = Math.min(
      this.BASE_ASTEROID_SPEED + (level - 1) * 0.15,
      this.MAX_ASTEROID_SPEED
    );
    const asteroidSpeed = baseSpeed * multiplier.speed;

    // Decreasing large asteroid ratio (starts high, gets lower)
    const largeAsteroidRatio = Math.max(
      this.BASE_LARGE_RATIO - (level - 1) * 0.02,
      this.MIN_LARGE_RATIO
    );

    // Level completion bonus
    const levelBonus = Math.floor(level * 100 * multiplier.bonus);

    return {
      asteroidCount,
      asteroidSpeed,
      largeAsteroidRatio,
      spawnSafeZone: this.SAFE_ZONE_RADIUS,
      levelBonus
    };
  }

  // Generate asteroids for a level
  generateAsteroidsForLevel(level: number): AsteroidConfig[] {
    const config = this.generateLevelConfig(level);
    const asteroids: AsteroidConfig[] = [];

    for (let i = 0; i < config.asteroidCount; i++) {
      const asteroid = this.generateSingleAsteroid(config);
      asteroids.push(asteroid);
    }

    return asteroids;
  }

  private generateSingleAsteroid(config: LevelConfig): AsteroidConfig {
    // Determine size
    const size: AsteroidSize = Math.random() < config.largeAsteroidRatio ? 'large' : 'small';

    // Generate spawn position around screen edges, avoiding safe zone
    const position = this.generateSafeSpawnPosition(config.spawnSafeZone);

    // Generate velocity towards general screen area
    const velocity = generateRandomAsteroidVelocity(config.asteroidSpeed);

    // Random initial rotation
    const rotation = Math.random() * 360;

    return {
      position,
      velocity,
      size,
      rotation
    };
  }

  private generateSafeSpawnPosition(safeZoneRadius: number): Position {
    const centerX = this.screenSize.width / 2;
    const centerY = this.screenSize.height / 2;
    const margin = 3; // Spawn outside visible area

    let position: Position;
    let attempts = 0;
    const maxAttempts = 20;

    do {
      // Choose edge (0=top, 1=right, 2=bottom, 3=left)
      const edge = Math.floor(Math.random() * 4);

      switch (edge) {
        case 0: // Top
          position = {
            x: Math.random() * this.screenSize.width,
            y: -margin
          };
          break;
        case 1: // Right
          position = {
            x: this.screenSize.width + margin,
            y: Math.random() * this.screenSize.height
          };
          break;
        case 2: // Bottom
          position = {
            x: Math.random() * this.screenSize.width,
            y: this.screenSize.height + margin
          };
          break;
        default: // Left
          position = {
            x: -margin,
            y: Math.random() * this.screenSize.height
          };
          break;
      }

      attempts++;
    } while (
      this.isInSafeZone(position, centerX, centerY, safeZoneRadius) &&
      attempts < maxAttempts
    );

    return position;
  }

  private isInSafeZone(position: Position, centerX: number, centerY: number, radius: number): boolean {
    const distance = Math.sqrt(
      Math.pow(position.x - centerX, 2) +
      Math.pow(position.y - centerY, 2)
    );
    return distance < radius;
  }

  // Generate level template with metadata
  generateLevelTemplate(level: number): LevelTemplate {
    const config = this.generateLevelConfig(level);

    const description = this.generateLevelDescription(level, config);

    return {
      level,
      config,
      description
    };
  }

  private generateLevelDescription(level: number, config: LevelConfig): string {
    const speedDesc = config.asteroidSpeed < 1.5 ? 'slow' :
                     config.asteroidSpeed < 2.5 ? 'medium' : 'fast';

    const countDesc = config.asteroidCount < 6 ? 'few' :
                     config.asteroidCount < 10 ? 'several' : 'many';

    return `Level ${level}: ${countDesc} ${speedDesc} asteroids`;
  }

  // Preset level templates for testing
  generatePresetLevels(): LevelTemplate[] {
    const presets: LevelTemplate[] = [];

    // Generate first 10 levels as presets
    for (let level = 1; level <= 10; level++) {
      presets.push(this.generateLevelTemplate(level));
    }

    return presets;
  }

  // Special level generators
  generateBossLevel(level: number): LevelTemplate {
    const baseConfig = this.generateLevelConfig(level);

    // Boss levels have fewer but larger, faster asteroids
    const bossConfig: LevelConfig = {
      ...baseConfig,
      asteroidCount: Math.max(3, Math.floor(baseConfig.asteroidCount * 0.6)),
      asteroidSpeed: baseConfig.asteroidSpeed * 1.3,
      largeAsteroidRatio: 0.9, // Mostly large asteroids
      levelBonus: baseConfig.levelBonus * 2
    };

    return {
      level,
      config: bossConfig,
      description: `Boss Level ${level}: Giant asteroid field!`
    };
  }

  generateBonusLevel(level: number): LevelTemplate {
    const baseConfig = this.generateLevelConfig(level);

    // Bonus levels have many small, slow asteroids for easy points
    const bonusConfig: LevelConfig = {
      ...baseConfig,
      asteroidCount: Math.floor(baseConfig.asteroidCount * 1.5),
      asteroidSpeed: baseConfig.asteroidSpeed * 0.7,
      largeAsteroidRatio: 0.2, // Mostly small asteroids
      levelBonus: baseConfig.levelBonus * 1.5
    };

    return {
      level,
      config: bonusConfig,
      description: `Bonus Level ${level}: Asteroid shower!`
    };
  }

  // Configuration updates
  updateScreenSize(screenSize: ScreenSize): void {
    this.screenSize = screenSize;
  }

  updateDifficulty(difficulty: Difficulty): void {
    this.difficulty = difficulty;
  }

  // Getters
  getScreenSize(): ScreenSize {
    return { ...this.screenSize };
  }

  getDifficulty(): Difficulty {
    return this.difficulty;
  }

  // Level progression info
  getLevelProgressionInfo(maxLevel: number = 20): {
    levels: number[];
    asteroidCounts: number[];
    speeds: number[];
    descriptions: string[];
  } {
    const levels: number[] = [];
    const asteroidCounts: number[] = [];
    const speeds: number[] = [];
    const descriptions: string[] = [];

    for (let level = 1; level <= maxLevel; level++) {
      const template = this.generateLevelTemplate(level);
      levels.push(level);
      asteroidCounts.push(template.config.asteroidCount);
      speeds.push(template.config.asteroidSpeed);
      descriptions.push(template.description);
    }

    return { levels, asteroidCounts, speeds, descriptions };
  }

  // Validation
  validateLevelConfig(config: LevelConfig): boolean {
    return (
      config.asteroidCount > 0 &&
      config.asteroidCount <= this.MAX_ASTEROID_COUNT &&
      config.asteroidSpeed > 0 &&
      config.asteroidSpeed <= this.MAX_ASTEROID_SPEED &&
      config.largeAsteroidRatio >= 0 &&
      config.largeAsteroidRatio <= 1 &&
      config.spawnSafeZone >= 0 &&
      config.levelBonus >= 0
    );
  }

  // Debug information
  getGeneratorInfo(): {
    screenSize: ScreenSize;
    difficulty: Difficulty;
    baseParameters: object;
    difficultyMultipliers: object;
  } {
    return {
      screenSize: { ...this.screenSize },
      difficulty: this.difficulty,
      baseParameters: {
        baseAsteroidCount: this.BASE_ASTEROID_COUNT,
        maxAsteroidCount: this.MAX_ASTEROID_COUNT,
        baseAsteroidSpeed: this.BASE_ASTEROID_SPEED,
        maxAsteroidSpeed: this.MAX_ASTEROID_SPEED,
        baseLargeRatio: this.BASE_LARGE_RATIO,
        minLargeRatio: this.MIN_LARGE_RATIO,
        safeZoneRadius: this.SAFE_ZONE_RADIUS
      },
      difficultyMultipliers: { ...this.DIFFICULTY_MULTIPLIERS }
    };
  }
}

// Factory function
export function createLevelGenerator(
  screenSize: ScreenSize,
  difficulty: Difficulty = 'normal'
): LevelGenerator {
  return new LevelGenerator(screenSize, difficulty);
}

// Export as default
export default LevelGenerator;