import type { Position } from '../types/geometry.js';
import type { Spaceship } from '../types/spaceship.js';
import type { Asteroid } from '../types/asteroid.js';
import type { Projectile } from '../types/projectile.js';
import type { GameState } from '../types/game-state.js';
import { getCharacterBounds, isPointInRectangle, calculateDistance } from '../types/geometry.js';
import { getScoreForAsteroid, createAsteroidFragments } from '../types/asteroid.js';

export interface CollisionResult {
  occurred: boolean;
  object1: string;
  object2: string;
  position: Position;
}

export interface ProjectileCollisionResult extends CollisionResult {
  fragments: Asteroid[];
  score: number;
}

export interface GameCollisionResults {
  spaceshipHit: boolean;
  asteroidsDestroyed: number;
  projectilesDestroyed: number;
  newFragments: Asteroid[];
  scoreAwarded: number;
}

export class CollisionSystem {
  private tolerance: number;

  constructor(tolerance: number = 0.1) {
    this.tolerance = tolerance;
  }

  // Basic collision detection
  checkPointCollision(point1: Position, point2: Position, tolerance: number = this.tolerance): boolean {
    return calculateDistance(point1, point2) <= tolerance;
  }

  checkRectangleCollision(pos1: Position, pos2: Position): boolean {
    const bounds1 = getCharacterBounds(pos1);
    const bounds2 = getCharacterBounds(pos2);

    return (
      bounds1.x < bounds2.x + bounds2.width &&
      bounds1.x + bounds1.width > bounds2.x &&
      bounds1.y < bounds2.y + bounds2.height &&
      bounds1.y + bounds1.height > bounds2.y
    );
  }

  // Spaceship-Asteroid collision
  checkSpaceshipAsteroidCollision(spaceship: Spaceship, asteroid: Asteroid): boolean {
    if (!spaceship.alive || !asteroid.active) {
      return false;
    }

    return this.checkRectangleCollision(spaceship.position, asteroid.position);
  }

  // Projectile-Asteroid collision
  checkProjectileAsteroidCollision(projectile: Projectile, asteroid: Asteroid): boolean {
    if (!projectile.active || !asteroid.active) {
      return false;
    }

    return this.checkRectangleCollision(projectile.position, asteroid.position);
  }

  // Handle collision responses
  handleSpaceshipAsteroidCollision(spaceship: Spaceship, asteroid: Asteroid): CollisionResult {
    spaceship.alive = false;

    return {
      occurred: true,
      object1: 'spaceship',
      object2: 'asteroid',
      position: spaceship.position
    };
  }

  handleProjectileAsteroidCollision(projectile: Projectile, asteroid: Asteroid): ProjectileCollisionResult {
    projectile.active = false;
    asteroid.active = false;

    const fragments = createAsteroidFragments(asteroid);
    const score = getScoreForAsteroid(asteroid.size);

    return {
      occurred: true,
      object1: 'projectile',
      object2: 'asteroid',
      position: asteroid.position,
      fragments,
      score
    };
  }

  // Batch collision detection
  checkAllSpaceshipCollisions(spaceship: Spaceship, asteroids: Asteroid[]): Asteroid[] {
    const collisions: Asteroid[] = [];

    for (const asteroid of asteroids) {
      if (this.checkSpaceshipAsteroidCollision(spaceship, asteroid)) {
        collisions.push(asteroid);
      }
    }

    return collisions;
  }

  checkAllProjectileCollisions(projectiles: Projectile[], asteroids: Asteroid[]): {
    projectile: Projectile;
    asteroid: Asteroid;
  }[] {
    const collisions: { projectile: Projectile; asteroid: Asteroid }[] = [];

    for (const projectile of projectiles) {
      if (!projectile.active) continue;

      for (const asteroid of asteroids) {
        if (!asteroid.active) continue;

        if (this.checkProjectileAsteroidCollision(projectile, asteroid)) {
          collisions.push({ projectile, asteroid });
          // Break to prevent multiple collisions per projectile
          break;
        }
      }
    }

    return collisions;
  }

  // Process all collisions in a single frame
  processAllCollisions(gameState: GameState): GameCollisionResults {
    const results: GameCollisionResults = {
      spaceshipHit: false,
      asteroidsDestroyed: 0,
      projectilesDestroyed: 0,
      newFragments: [],
      scoreAwarded: 0
    };

    // Check spaceship-asteroid collisions
    const spaceshipCollisions = this.checkAllSpaceshipCollisions(
      gameState.objects.spaceship,
      gameState.objects.asteroids
    );

    if (spaceshipCollisions.length > 0) {
      results.spaceshipHit = true;
      const firstCollision = spaceshipCollisions[0];
      if (firstCollision) {
        this.handleSpaceshipAsteroidCollision(gameState.objects.spaceship, firstCollision);
      }
    }

    // Check projectile-asteroid collisions
    const projectileCollisions = this.checkAllProjectileCollisions(
      gameState.objects.projectiles,
      gameState.objects.asteroids
    );

    for (const { projectile, asteroid } of projectileCollisions) {
      const result = this.handleProjectileAsteroidCollision(projectile, asteroid);

      results.asteroidsDestroyed++;
      results.projectilesDestroyed++;
      results.newFragments.push(...result.fragments);
      results.scoreAwarded += result.score;
    }

    return results;
  }

  // Performance optimized collision detection for many objects
  checkCollisionsWithSpatialPartitioning(
    spaceship: Spaceship,
    projectiles: Projectile[],
    asteroids: Asteroid[],
    gridSize: number = 10
  ): GameCollisionResults {
    // Create spatial grid for asteroids
    const grid = this.createSpatialGrid(asteroids, gridSize);

    const results: GameCollisionResults = {
      spaceshipHit: false,
      asteroidsDestroyed: 0,
      projectilesDestroyed: 0,
      newFragments: [],
      scoreAwarded: 0
    };

    // Check spaceship collisions using grid
    const spaceshipGridKey = this.getGridKey(spaceship.position, gridSize);
    const nearbyAsteroids = grid.get(spaceshipGridKey) || [];

    for (const asteroid of nearbyAsteroids) {
      if (this.checkSpaceshipAsteroidCollision(spaceship, asteroid)) {
        results.spaceshipHit = true;
        this.handleSpaceshipAsteroidCollision(spaceship, asteroid);
        break;
      }
    }

    // Check projectile collisions using grid
    for (const projectile of projectiles) {
      if (!projectile.active) continue;

      const projectileGridKey = this.getGridKey(projectile.position, gridSize);
      const nearbyAsteroidsList = grid.get(projectileGridKey) || [];

      for (const asteroid of nearbyAsteroidsList) {
        if (this.checkProjectileAsteroidCollision(projectile, asteroid)) {
          const result = this.handleProjectileAsteroidCollision(projectile, asteroid);

          results.asteroidsDestroyed++;
          results.projectilesDestroyed++;
          results.newFragments.push(...result.fragments);
          results.scoreAwarded += result.score;
          break;
        }
      }
    }

    return results;
  }

  // Spatial partitioning helpers
  private createSpatialGrid(asteroids: Asteroid[], gridSize: number): Map<string, Asteroid[]> {
    const grid = new Map<string, Asteroid[]>();

    for (const asteroid of asteroids) {
      if (!asteroid.active) continue;

      const key = this.getGridKey(asteroid.position, gridSize);
      if (!grid.has(key)) {
        grid.set(key, []);
      }
      grid.get(key)!.push(asteroid);
    }

    return grid;
  }

  private getGridKey(position: Position, gridSize: number): string {
    const gridX = Math.floor(position.x / gridSize);
    const gridY = Math.floor(position.y / gridSize);
    return `${gridX},${gridY}`;
  }

  // Boundary collision detection
  checkBoundaryCollision(object: { position: Position }, screenWidth: number, screenHeight: number): boolean {
    return (
      object.position.x < 0 ||
      object.position.x >= screenWidth ||
      object.position.y < 0 ||
      object.position.y >= screenHeight
    );
  }

  // Debug helpers
  getCollisionBounds(object: { position: Position }): { x: number; y: number; width: number; height: number } {
    return getCharacterBounds(object.position);
  }

  // Collision prediction (for AI or advanced features)
  predictCollision(
    obj1: { position: Position; velocity: { dx: number; dy: number } },
    obj2: { position: Position; velocity: { dx: number; dy: number } },
    timeSteps: number = 10
  ): { willCollide: boolean; timeToCollision?: number } {
    for (let t = 1; t <= timeSteps; t++) {
      const pos1 = {
        x: obj1.position.x + obj1.velocity.dx * t,
        y: obj1.position.y + obj1.velocity.dy * t
      };

      const pos2 = {
        x: obj2.position.x + obj2.velocity.dx * t,
        y: obj2.position.y + obj2.velocity.dy * t
      };

      if (this.checkRectangleCollision(pos1, pos2)) {
        return { willCollide: true, timeToCollision: t };
      }
    }

    return { willCollide: false };
  }

  // Safe zone detection (for spaceship respawning)
  findSafePosition(
    asteroids: Asteroid[],
    screenWidth: number,
    screenHeight: number,
    safeRadius: number = 3
  ): Position {
    const attempts = 50;
    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;

    for (let i = 0; i < attempts; i++) {
      const testPosition: Position = {
        x: centerX + (Math.random() - 0.5) * screenWidth * 0.5,
        y: centerY + (Math.random() - 0.5) * screenHeight * 0.5
      };

      const isSafe = !asteroids.some(asteroid =>
        asteroid.active &&
        calculateDistance(asteroid.position, testPosition) < safeRadius
      );

      if (isSafe) {
        return testPosition;
      }
    }

    // Fallback to center if no safe position found
    return { x: centerX, y: centerY };
  }
}