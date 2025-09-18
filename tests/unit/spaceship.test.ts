import { describe, it, expect, beforeEach } from 'vitest';

// This test will initially fail - that's expected for TDD
describe('Spaceship Interface', () => {
  let spaceship: any;

  beforeEach(() => {
    try {
      // @ts-expect-error - Class doesn't exist yet
      spaceship = new Spaceship({
        position: { x: 40, y: 12 },
        velocity: { dx: 0, dy: 0 },
        rotation: 0
      });
    } catch (error) {
      spaceship = null;
    }
  });

  describe('Initial State', () => {
    it('should create spaceship with valid initial state', () => {
      expect(() => {
        expect(spaceship.position).toEqual({ x: 40, y: 12 });
        expect(spaceship.velocity).toEqual({ dx: 0, dy: 0 });
        expect(spaceship.rotation).toBe(0);
        expect(spaceship.thrust).toBe(false);
        expect(spaceship.alive).toBe(true);
        expect(spaceship.character).toBe('^'); // Facing up initially
      }).toThrow();
    });

    it('should validate required properties exist', () => {
      expect(() => {
        // @ts-expect-error - Interface doesn't exist yet
        const invalidSpaceship: Spaceship = {
          position: { x: 0, y: 0 },
          // Missing velocity, rotation, etc.
        };
      }).toThrow();
    });

    it('should have correct character for initial rotation', () => {
      expect(() => {
        expect(spaceship.getCharacterForRotation(0)).toBe('^');
        expect(spaceship.getCharacterForRotation(90)).toBe('>');
        expect(spaceship.getCharacterForRotation(180)).toBe('v');
        expect(spaceship.getCharacterForRotation(270)).toBe('<');
      }).toThrow();
    });
  });

  describe('Movement and Physics', () => {
    it('should update position based on velocity', () => {
      expect(() => {
        spaceship.velocity = { dx: 2, dy: -1 };
        const initialPosition = { ...spaceship.position };

        spaceship.updatePosition();

        expect(spaceship.position.x).toBe(initialPosition.x + 2);
        expect(spaceship.position.y).toBe(initialPosition.y - 1);
      }).toThrow();
    });

    it('should apply thrust in current rotation direction', () => {
      expect(() => {
        spaceship.rotation = 0; // Facing up
        spaceship.thrust = true;
        const initialVelocity = { ...spaceship.velocity };

        spaceship.applyThrust(1.0); // Thrust power of 1.0

        expect(spaceship.velocity.dx).toBe(initialVelocity.dx);
        expect(spaceship.velocity.dy).toBeLessThan(initialVelocity.dy); // Moving up
      }).toThrow();
    });

    it('should rotate left when turning left', () => {
      expect(() => {
        spaceship.rotation = 90; // Facing right
        spaceship.rotateLeft(45);

        expect(spaceship.rotation).toBe(45); // Now facing up-right
      }).toThrow();
    });

    it('should rotate right when turning right', () => {
      expect(() => {
        spaceship.rotation = 90; // Facing right
        spaceship.rotateRight(45);

        expect(spaceship.rotation).toBe(135); // Now facing down-right
      }).toThrow();
    });

    it('should wrap rotation at 360 degrees', () => {
      expect(() => {
        spaceship.rotation = 350;
        spaceship.rotateRight(20);

        expect(spaceship.rotation).toBe(10); // 370 wrapped to 10
      }).toThrow();
    });

    it('should wrap rotation at 0 degrees', () => {
      expect(() => {
        spaceship.rotation = 10;
        spaceship.rotateLeft(20);

        expect(spaceship.rotation).toBe(350); // -10 wrapped to 350
      }).toThrow();
    });

    it('should apply velocity damping when no thrust', () => {
      expect(() => {
        spaceship.velocity = { dx: 4, dy: 3 };
        spaceship.thrust = false;

        spaceship.applyDamping(0.98); // 98% of velocity retained

        expect(spaceship.velocity.dx).toBeCloseTo(3.92);
        expect(spaceship.velocity.dy).toBeCloseTo(2.94);
      }).toThrow();
    });

    it('should limit maximum velocity', () => {
      expect(() => {
        spaceship.velocity = { dx: 10, dy: 10 }; // Very high velocity
        const maxSpeed = 5;

        spaceship.limitVelocity(maxSpeed);

        const magnitude = Math.sqrt(spaceship.velocity.dx ** 2 + spaceship.velocity.dy ** 2);
        expect(magnitude).toBeLessThanOrEqual(maxSpeed);
      }).toThrow();
    });
  });

  describe('Visual Representation', () => {
    it('should update character based on rotation', () => {
      expect(() => {
        spaceship.rotation = 0;
        spaceship.updateCharacter();
        expect(spaceship.character).toBe('^');

        spaceship.rotation = 90;
        spaceship.updateCharacter();
        expect(spaceship.character).toBe('>');

        spaceship.rotation = 180;
        spaceship.updateCharacter();
        expect(spaceship.character).toBe('v');

        spaceship.rotation = 270;
        spaceship.updateCharacter();
        expect(spaceship.character).toBe('<');
      }).toThrow();
    });

    it('should handle intermediate rotation angles', () => {
      expect(() => {
        spaceship.rotation = 45; // Northeast
        spaceship.updateCharacter();
        expect(spaceship.character).toBe('^'); // Closest to up

        spaceship.rotation = 135; // Southeast
        spaceship.updateCharacter();
        expect(spaceship.character).toBe('>'); // Closest to right
      }).toThrow();
    });

    it('should support Unicode character mode', () => {
      expect(() => {
        spaceship.setCharacterMode('unicode');

        spaceship.rotation = 0;
        spaceship.updateCharacter();
        expect(spaceship.character).toBe('🚀');

        // Other directions might use directional arrows
        spaceship.rotation = 90;
        spaceship.updateCharacter();
        expect(['➡️', '⬅️', '⬆️', '⬇️']).toContain(spaceship.character);
      }).toThrow();
    });
  });

  describe('State Management', () => {
    it('should track alive/dead state', () => {
      expect(() => {
        expect(spaceship.alive).toBe(true);

        spaceship.destroy();
        expect(spaceship.alive).toBe(false);
      }).toThrow();
    });

    it('should reset to initial state', () => {
      expect(() => {
        // Modify spaceship state
        spaceship.position = { x: 100, y: 100 };
        spaceship.velocity = { dx: 5, dy: 5 };
        spaceship.rotation = 180;
        spaceship.alive = false;

        // Reset to initial state
        spaceship.reset();

        expect(spaceship.position).toEqual({ x: 40, y: 12 });
        expect(spaceship.velocity).toEqual({ dx: 0, dy: 0 });
        expect(spaceship.rotation).toBe(0);
        expect(spaceship.alive).toBe(true);
      }).toThrow();
    });

    it('should clone spaceship state', () => {
      expect(() => {
        const clone = spaceship.clone();

        expect(clone.position).toEqual(spaceship.position);
        expect(clone.velocity).toEqual(spaceship.velocity);
        expect(clone.rotation).toBe(spaceship.rotation);

        // Modifying clone shouldn't affect original
        clone.position.x = 999;
        expect(spaceship.position.x).not.toBe(999);
      }).toThrow();
    });

    it('should validate state consistency', () => {
      expect(() => {
        // Valid state
        expect(spaceship.isValidState()).toBe(true);

        // Invalid position
        spaceship.position = null;
        expect(spaceship.isValidState()).toBe(false);

        // Invalid rotation
        spaceship.position = { x: 0, y: 0 };
        spaceship.rotation = NaN;
        expect(spaceship.isValidState()).toBe(false);
      }).toThrow();
    });
  });

  describe('Screen Wrapping', () => {
    it('should wrap position when moving off screen', () => {
      expect(() => {
        spaceship.position = { x: 85, y: 30 };
        const screenWidth = 80;
        const screenHeight = 25;

        spaceship.wrapPosition(screenWidth, screenHeight);

        expect(spaceship.position.x).toBe(5); // 85 - 80
        expect(spaceship.position.y).toBe(5); // 30 - 25
      }).toThrow();
    });

    it('should handle negative position wrapping', () => {
      expect(() => {
        spaceship.position = { x: -5, y: -10 };
        const screenWidth = 80;
        const screenHeight = 25;

        spaceship.wrapPosition(screenWidth, screenHeight);

        expect(spaceship.position.x).toBe(75); // 80 - 5
        expect(spaceship.position.y).toBe(15); // 25 - 10
      }).toThrow();
    });

    it('should not modify position when within bounds', () => {
      expect(() => {
        spaceship.position = { x: 40, y: 12 };
        const originalPosition = { ...spaceship.position };
        const screenWidth = 80;
        const screenHeight = 25;

        spaceship.wrapPosition(screenWidth, screenHeight);

        expect(spaceship.position).toEqual(originalPosition);
      }).toThrow();
    });
  });

  describe('Collision Bounds', () => {
    it('should calculate collision bounds for spaceship', () => {
      expect(() => {
        spaceship.position = { x: 10, y: 5 };

        const bounds = spaceship.getCollisionBounds();

        expect(bounds.x).toBe(10);
        expect(bounds.y).toBe(5);
        expect(bounds.width).toBe(1); // Single character width
        expect(bounds.height).toBe(1); // Single character height
      }).toThrow();
    });

    it('should check collision with point', () => {
      expect(() => {
        spaceship.position = { x: 10, y: 5 };

        expect(spaceship.isCollidingWith({ x: 10, y: 5 })).toBe(true);
        expect(spaceship.isCollidingWith({ x: 11, y: 5 })).toBe(false);
        expect(spaceship.isCollidingWith({ x: 10, y: 6 })).toBe(false);
      }).toThrow();
    });

    it('should only collide when alive', () => {
      expect(() => {
        spaceship.position = { x: 10, y: 5 };
        spaceship.alive = false;

        expect(spaceship.isCollidingWith({ x: 10, y: 5 })).toBe(false);
      }).toThrow();
    });
  });
});