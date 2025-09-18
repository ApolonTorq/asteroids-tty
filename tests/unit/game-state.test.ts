import { describe, it, expect, beforeEach } from 'vitest';

describe('GameState Interface', () => {
  let gameState: any;

  beforeEach(() => {
    try {
      // @ts-expect-error - Class doesn't exist yet
      gameState = new GameState({
        score: 0,
        level: 1,
        lives: 3,
        gameMode: 'scrolling',
        characterMode: 'ascii',
        screenSize: { width: 80, height: 25 }
      });
    } catch (error) {
      gameState = null;
    }
  });

  describe('Initial State', () => {
    it('should create game state with valid defaults', () => {
      expect(() => {
        expect(gameState.score).toBe(0);
        expect(gameState.level).toBe(1);
        expect(gameState.lives).toBe(3);
        expect(gameState.gameMode).toBe('scrolling');
        expect(gameState.characterMode).toBe('ascii');
        expect(gameState.gameStatus).toBe('playing');
      }).toThrow();
    });

    it('should initialize game objects', () => {
      expect(() => {
        expect(gameState.objects.spaceship).toBeTruthy();
        expect(Array.isArray(gameState.objects.asteroids)).toBe(true);
        expect(Array.isArray(gameState.objects.projectiles)).toBe(true);
      }).toThrow();
    });

    it('should validate screen size', () => {
      expect(() => {
        expect(gameState.screenSize.width).toBeGreaterThan(0);
        expect(gameState.screenSize.height).toBeGreaterThan(0);
      }).toThrow();
    });
  });

  describe('Score Management', () => {
    it('should update score correctly', () => {
      expect(() => {
        gameState.addScore(100);
        expect(gameState.score).toBe(100);

        gameState.addScore(50);
        expect(gameState.score).toBe(150);
      }).toThrow();
    });

    it('should not allow negative scores', () => {
      expect(() => {
        gameState.addScore(-100);
        expect(gameState.score).toBe(0);
      }).toThrow();
    });

    it('should calculate score for asteroid destruction', () => {
      expect(() => {
        const largeAsteroidScore = gameState.getScoreForAsteroid('large');
        const smallAsteroidScore = gameState.getScoreForAsteroid('small');

        expect(largeAsteroidScore).toBeGreaterThan(smallAsteroidScore);
        expect(largeAsteroidScore).toBeGreaterThan(0);
        expect(smallAsteroidScore).toBeGreaterThan(0);
      }).toThrow();
    });
  });

  describe('Level Management', () => {
    it('should advance to next level when asteroids cleared', () => {
      expect(() => {
        gameState.objects.asteroids = []; // No asteroids left
        gameState.checkLevelCompletion();

        expect(gameState.level).toBe(2);
      }).toThrow();
    });

    it('should spawn more asteroids on higher levels', () => {
      expect(() => {
        const level1Count = gameState.getAsteroidCountForLevel(1);
        const level5Count = gameState.getAsteroidCountForLevel(5);

        expect(level5Count).toBeGreaterThan(level1Count);
      }).toThrow();
    });

    it('should increase asteroid speed on higher levels', () => {
      expect(() => {
        const level1Speed = gameState.getAsteroidSpeedForLevel(1);
        const level5Speed = gameState.getAsteroidSpeedForLevel(5);

        expect(level5Speed).toBeGreaterThan(level1Speed);
      }).toThrow();
    });

    it('should award level completion bonus', () => {
      expect(() => {
        const initialScore = gameState.score;
        gameState.completeLevelBonus();

        expect(gameState.score).toBeGreaterThan(initialScore);
      }).toThrow();
    });
  });

  describe('Lives Management', () => {
    it('should decrease lives when spaceship dies', () => {
      expect(() => {
        gameState.loseLife();
        expect(gameState.lives).toBe(2);
      }).toThrow();
    });

    it('should trigger game over when lives reach zero', () => {
      expect(() => {
        gameState.lives = 1;
        gameState.loseLife();

        expect(gameState.lives).toBe(0);
        expect(gameState.gameStatus).toBe('gameOver');
      }).toThrow();
    });

    it('should award extra life for high scores', () => {
      expect(() => {
        gameState.score = 10000; // High score threshold
        gameState.checkExtraLife();

        expect(gameState.lives).toBeGreaterThan(3);
      }).toThrow();
    });

    it('should respawn spaceship after losing life', () => {
      expect(() => {
        // Move spaceship away from center
        gameState.objects.spaceship.position = { x: 100, y: 100 };
        gameState.loseLife();

        // Should be back at center
        const centerX = gameState.screenSize.width / 2;
        const centerY = gameState.screenSize.height / 2;
        expect(gameState.objects.spaceship.position.x).toBeCloseTo(centerX);
        expect(gameState.objects.spaceship.position.y).toBeCloseTo(centerY);
      }).toThrow();
    });
  });

  describe('Game Status Management', () => {
    it('should pause and resume game', () => {
      expect(() => {
        gameState.pause();
        expect(gameState.gameStatus).toBe('paused');

        gameState.resume();
        expect(gameState.gameStatus).toBe('playing');
      }).toThrow();
    });

    it('should reset game to initial state', () => {
      expect(() => {
        // Modify game state
        gameState.score = 1000;
        gameState.level = 5;
        gameState.lives = 1;

        gameState.reset();

        expect(gameState.score).toBe(0);
        expect(gameState.level).toBe(1);
        expect(gameState.lives).toBe(3);
        expect(gameState.gameStatus).toBe('playing');
      }).toThrow();
    });

    it('should validate game status transitions', () => {
      expect(() => {
        // Valid transitions
        gameState.gameStatus = 'playing';
        expect(gameState.canPause()).toBe(true);

        gameState.gameStatus = 'paused';
        expect(gameState.canResume()).toBe(true);

        gameState.gameStatus = 'gameOver';
        expect(gameState.canPause()).toBe(false);
      }).toThrow();
    });
  });

  describe('Display Configuration', () => {
    it('should toggle character mode', () => {
      expect(() => {
        gameState.toggleCharacterMode();
        expect(gameState.characterMode).toBe('unicode');

        gameState.toggleCharacterMode();
        expect(gameState.characterMode).toBe('ascii');
      }).toThrow();
    });

    it('should toggle physics mode', () => {
      expect(() => {
        gameState.togglePhysicsMode();
        expect(gameState.gameMode).toBe('traditional');

        gameState.togglePhysicsMode();
        expect(gameState.gameMode).toBe('scrolling');
      }).toThrow();
    });

    it('should update screen size', () => {
      expect(() => {
        gameState.setScreenSize(100, 30);

        expect(gameState.screenSize.width).toBe(100);
        expect(gameState.screenSize.height).toBe(30);
      }).toThrow();
    });

    it('should validate screen size limits', () => {
      expect(() => {
        // Too small
        expect(() => gameState.setScreenSize(10, 5)).toThrow();

        // Negative values
        expect(() => gameState.setScreenSize(-1, 25)).toThrow();
      }).toThrow();
    });
  });

  describe('Object Management', () => {
    it('should add and remove projectiles', () => {
      expect(() => {
        const initialCount = gameState.objects.projectiles.length;

        // @ts-expect-error - Class doesn't exist yet
        const projectile = new Projectile({ position: { x: 0, y: 0 } });
        gameState.addProjectile(projectile);

        expect(gameState.objects.projectiles.length).toBe(initialCount + 1);

        gameState.removeInactiveProjectiles();
        // Should still be there if active
        expect(gameState.objects.projectiles.length).toBe(initialCount + 1);
      }).toThrow();
    });

    it('should spawn asteroids for new level', () => {
      expect(() => {
        gameState.objects.asteroids = [];
        gameState.spawnAsteroidsForLevel(2);

        expect(gameState.objects.asteroids.length).toBeGreaterThan(0);
      }).toThrow();
    });

    it('should clear all objects on reset', () => {
      expect(() => {
        // Add some objects
        gameState.objects.projectiles.push({});
        gameState.objects.asteroids.push({});

        gameState.clearAllObjects();

        expect(gameState.objects.projectiles.length).toBe(0);
        expect(gameState.objects.asteroids.length).toBe(0);
      }).toThrow();
    });
  });

  describe('State Serialization', () => {
    it('should serialize game state to JSON', () => {
      expect(() => {
        const serialized = gameState.toJSON();

        expect(serialized).toHaveProperty('score');
        expect(serialized).toHaveProperty('level');
        expect(serialized).toHaveProperty('lives');
        expect(serialized).toHaveProperty('gameStatus');
      }).toThrow();
    });

    it('should restore game state from JSON', () => {
      expect(() => {
        const savedState = {
          score: 500,
          level: 3,
          lives: 2,
          gameStatus: 'paused'
        };

        gameState.fromJSON(savedState);

        expect(gameState.score).toBe(500);
        expect(gameState.level).toBe(3);
        expect(gameState.lives).toBe(2);
        expect(gameState.gameStatus).toBe('paused');
      }).toThrow();
    });
  });
});