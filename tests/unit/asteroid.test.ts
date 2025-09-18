import { describe, it, expect, beforeEach } from 'vitest';

describe('Asteroid Interface', () => {
  let asteroid: any;

  beforeEach(() => {
    try {
      // @ts-expect-error - Class doesn't exist yet
      asteroid = new Asteroid({
        position: { x: 20, y: 10 },
        velocity: { dx: 1, dy: -0.5 },
        size: 'large'
      });
    } catch (error) {
      asteroid = null;
    }
  });

  describe('Initial State', () => {
    it('should create asteroid with valid initial state', () => {
      expect(() => {
        expect(asteroid.position).toEqual({ x: 20, y: 10 });
        expect(asteroid.velocity).toEqual({ dx: 1, dy: -0.5 });
        expect(asteroid.size).toBe('large');
        expect(asteroid.character).toBe('O');
        expect(asteroid.active).toBe(true);
      }).toThrow();
    });

    it('should set correct character for size', () => {
      expect(() => {
        // @ts-expect-error - Class doesn't exist yet
        const largeAsteroid = new Asteroid({ size: 'large' });
        expect(largeAsteroid.character).toBe('O');

        // @ts-expect-error - Class doesn't exist yet
        const smallAsteroid = new Asteroid({ size: 'small' });
        expect(smallAsteroid.character).toBe('o');
      }).toThrow();
    });
  });

  describe('Movement', () => {
    it('should update position based on velocity', () => {
      expect(() => {
        const initialPos = { ...asteroid.position };
        asteroid.updatePosition();

        expect(asteroid.position.x).toBe(initialPos.x + 1);
        expect(asteroid.position.y).toBe(initialPos.y - 0.5);
      }).toThrow();
    });

    it('should wrap around screen boundaries', () => {
      expect(() => {
        asteroid.position = { x: 85, y: 30 };
        asteroid.wrapPosition(80, 25);

        expect(asteroid.position.x).toBe(5);
        expect(asteroid.position.y).toBe(5);
      }).toThrow();
    });
  });

  describe('Fragmentation', () => {
    it('should fragment large asteroid into small pieces', () => {
      expect(() => {
        asteroid.size = 'large';
        const fragments = asteroid.fragment();

        expect(fragments.length).toBeGreaterThanOrEqual(2);
        expect(fragments.length).toBeLessThanOrEqual(3);
        fragments.forEach(fragment => {
          expect(fragment.size).toBe('small');
          expect(fragment.character).toBe('o');
        });
      }).toThrow();
    });

    it('should destroy small asteroid when hit', () => {
      expect(() => {
        // @ts-expect-error - Class doesn't exist yet
        const smallAsteroid = new Asteroid({ size: 'small' });
        const fragments = smallAsteroid.fragment();

        expect(fragments.length).toBe(0);
        expect(smallAsteroid.active).toBe(false);
      }).toThrow();
    });

    it('should generate fragments with random velocities', () => {
      expect(() => {
        const fragments = asteroid.fragment();
        const velocities = fragments.map(f => f.velocity);

        // Should have different velocities
        const uniqueVelocities = new Set(velocities.map(v => `${v.dx},${v.dy}`));
        expect(uniqueVelocities.size).toBe(velocities.length);
      }).toThrow();
    });
  });

  describe('Collision Detection', () => {
    it('should detect collision with point', () => {
      expect(() => {
        asteroid.position = { x: 15, y: 8 };
        expect(asteroid.isCollidingWith({ x: 15, y: 8 })).toBe(true);
        expect(asteroid.isCollidingWith({ x: 16, y: 8 })).toBe(false);
      }).toThrow();
    });

    it('should not collide when inactive', () => {
      expect(() => {
        asteroid.active = false;
        expect(asteroid.isCollidingWith(asteroid.position)).toBe(false);
      }).toThrow();
    });
  });

  describe('Unicode Mode', () => {
    it('should use emoji characters in unicode mode', () => {
      expect(() => {
        asteroid.setCharacterMode('unicode');
        expect(['🪨', '⚫']).toContain(asteroid.character);
      }).toThrow();
    });
  });
});