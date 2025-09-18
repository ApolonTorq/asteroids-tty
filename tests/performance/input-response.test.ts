import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InputHandler } from '../../src/lib/engine/input.js';
import { GameLoop } from '../../src/lib/engine/game-loop.js';
import { PhysicsEngine } from '../../src/lib/engine/physics.js';
import { CollisionSystem } from '../../src/lib/engine/collision.js';
import { Renderer } from '../../src/lib/engine/renderer.js';
import { GameStateManager } from '../../src/lib/engine/game-state.js';
import { createDisplayConfiguration } from '../../src/lib/types/display.js';

describe('Input Response Time Validation (<100ms)', () => {
  let inputHandler: InputHandler;
  let gameLoop: GameLoop;
  let gameState: GameStateManager;
  let mockElement: any;

  const SCREEN_WIDTH = 80;
  const SCREEN_HEIGHT = 25;
  const MAX_RESPONSE_TIME = 100; // 100ms maximum response time

  beforeEach(() => {
    // Create mock DOM element with event handling
    mockElement = {
      addEventListener: (event: string, handler: Function) => {
        mockElement[`_${event}`] = handler;
      },
      removeEventListener: () => {},
      focus: () => {},
      blur: () => {}
    };

    inputHandler = new InputHandler(mockElement);

    // Set up complete game loop for realistic testing
    const physics = new PhysicsEngine(SCREEN_WIDTH, SCREEN_HEIGHT);
    const collision = new CollisionSystem(SCREEN_WIDTH, SCREEN_HEIGHT);
    const renderer = new Renderer(SCREEN_WIDTH, SCREEN_HEIGHT, createDisplayConfiguration());
    gameState = new GameStateManager({
      screenSize: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT }
    });

    gameLoop = new GameLoop(physics, collision, renderer, gameState, inputHandler);
  });

  afterEach(() => {
    inputHandler?.destroy();
    gameLoop?.destroy();
  });

  it('should respond to thrust input within response time limit', async () => {
    const responsePromise = new Promise<number>((resolve) => {
      const startTime = performance.now();

      inputHandler.addEventListener((event) => {
        if (event.action === 'thrust' && event.pressed) {
          const responseTime = performance.now() - startTime;
          resolve(responseTime);
        }
      });
    });

    // Simulate keydown event
    const inputTime = performance.now();
    mockElement._keydown?.({
      code: 'KeyW',
      preventDefault: () => {},
      repeat: false
    });

    const responseTime = await responsePromise;
    expect(responseTime).toBeLessThan(MAX_RESPONSE_TIME);
  });

  it('should respond to shooting input within response time limit', async () => {
    gameLoop.start(); // Start game loop for realistic conditions

    const responsePromise = new Promise<number>((resolve) => {
      const startTime = performance.now();

      inputHandler.addEventListener((event) => {
        if (event.action === 'shoot' && event.pressed) {
          const responseTime = performance.now() - startTime;
          resolve(responseTime);
        }
      });
    });

    // Simulate space key press
    mockElement._keydown?.({
      code: 'Space',
      preventDefault: () => {},
      repeat: false
    });

    const responseTime = await responsePromise;
    gameLoop.stop();

    expect(responseTime).toBeLessThan(MAX_RESPONSE_TIME);
  });

  it('should respond to rotation inputs within response time limit', async () => {
    const leftResponsePromise = new Promise<number>((resolve) => {
      const startTime = performance.now();

      inputHandler.addEventListener((event) => {
        if (event.action === 'rotateLeft' && event.pressed) {
          const responseTime = performance.now() - startTime;
          resolve(responseTime);
        }
      });
    });

    // Test left rotation
    mockElement._keydown?.({
      code: 'KeyA',
      preventDefault: () => {},
      repeat: false
    });

    const leftResponseTime = await leftResponsePromise;
    expect(leftResponseTime).toBeLessThan(MAX_RESPONSE_TIME);

    // Reset input handler
    mockElement._keyup?.({
      code: 'KeyA',
      preventDefault: () => {},
      repeat: false
    });

    const rightResponsePromise = new Promise<number>((resolve) => {
      const startTime = performance.now();

      inputHandler.addEventListener((event) => {
        if (event.action === 'rotateRight' && event.pressed) {
          const responseTime = performance.now() - startTime;
          resolve(responseTime);
        }
      });
    });

    // Test right rotation
    mockElement._keydown?.({
      code: 'KeyD',
      preventDefault: () => {},
      repeat: false
    });

    const rightResponseTime = await rightResponsePromise;
    expect(rightResponseTime).toBeLessThan(MAX_RESPONSE_TIME);
  });

  it('should handle multiple simultaneous inputs within response time', async () => {
    gameLoop.start();

    const responses: number[] = [];
    const inputStartTime = performance.now();

    inputHandler.addEventListener((event) => {
      if (event.pressed) {
        const responseTime = performance.now() - inputStartTime;
        responses.push(responseTime);
      }
    });

    // Simulate multiple simultaneous key presses
    const simultaneousInputs = [
      { code: 'KeyW' }, // Thrust
      { code: 'KeyA' }, // Rotate left
      { code: 'Space' } // Shoot
    ];

    simultaneousInputs.forEach(input => {
      mockElement._keydown?.({
        ...input,
        preventDefault: () => {},
        repeat: false
      });
    });

    // Wait for all responses
    await new Promise(resolve => setTimeout(resolve, 50));

    gameLoop.stop();

    expect(responses.length).toBe(simultaneousInputs.length);
    responses.forEach(responseTime => {
      expect(responseTime).toBeLessThan(MAX_RESPONSE_TIME);
    });
  });

  it('should maintain response time under game load', async () => {
    // Add game load with asteroids and projectiles
    gameState.spawnAsteroidsForLevel(8);

    for (let i = 0; i < 5; i++) {
      const spaceship = gameState.getState().objects.spaceship;
      const projectile = {
        position: { x: spaceship.position.x, y: spaceship.position.y },
        velocity: { x: Math.random() * 4 - 2, y: Math.random() * 4 - 2 },
        active: true,
        age: 0,
        maxAge: 3000
      };
      gameState.addProjectile(projectile);
    }

    gameLoop.start();

    const responsePromise = new Promise<number>((resolve) => {
      const startTime = performance.now();

      inputHandler.addEventListener((event) => {
        if (event.action === 'thrust' && event.pressed) {
          const responseTime = performance.now() - startTime;
          resolve(responseTime);
        }
      });
    });

    // Allow game to run for a moment to build up load
    await new Promise(resolve => setTimeout(resolve, 100));

    // Test input response under load
    mockElement._keydown?.({
      code: 'KeyW',
      preventDefault: () => {},
      repeat: false
    });

    const responseTime = await responsePromise;
    gameLoop.stop();

    expect(responseTime).toBeLessThan(MAX_RESPONSE_TIME);
  });

  it('should handle rapid input sequences within response time', async () => {
    const rapidInputDelay = 50; // 50ms between inputs
    const responses: number[] = [];

    inputHandler.addEventListener((event) => {
      if (event.pressed) {
        responses.push(event.timestamp);
      }
    });

    const inputs = ['KeyW', 'KeyA', 'KeyD', 'Space', 'KeyP'];
    const startTime = performance.now();

    // Send rapid sequence of inputs
    for (let i = 0; i < inputs.length; i++) {
      setTimeout(() => {
        mockElement._keydown?.({
          code: inputs[i],
          preventDefault: () => {},
          repeat: false
        });
      }, i * rapidInputDelay);
    }

    // Wait for all inputs to process
    await new Promise(resolve => setTimeout(resolve, inputs.length * rapidInputDelay + 100));

    expect(responses.length).toBe(inputs.length);

    // Check that each response was timely
    responses.forEach((responseTime, index) => {
      const expectedTime = startTime + (index * rapidInputDelay);
      const actualResponseDelay = responseTime - expectedTime;
      expect(actualResponseDelay).toBeLessThan(MAX_RESPONSE_TIME);
    });
  });

  it('should handle game control inputs within response time', async () => {
    const controlInputs = [
      { code: 'KeyP', action: 'pause' },
      { code: 'KeyC', action: 'toggleCharacterMode' },
      { code: 'KeyM', action: 'togglePhysicsMode' },
      { code: 'KeyR', action: 'reset' }
    ];

    for (const input of controlInputs) {
      const responsePromise = new Promise<number>((resolve) => {
        const startTime = performance.now();

        inputHandler.addEventListener((event) => {
          if (event.action === input.action && event.pressed) {
            const responseTime = performance.now() - startTime;
            resolve(responseTime);
          }
        });
      });

      mockElement._keydown?.({
        code: input.code,
        preventDefault: () => {},
        repeat: false
      });

      const responseTime = await responsePromise;
      expect(responseTime).toBeLessThan(MAX_RESPONSE_TIME);

      // Reset for next test
      mockElement._keyup?.({
        code: input.code,
        preventDefault: () => {},
        repeat: false
      });
    }
  });

  it('should maintain consistent response times over extended periods', async () => {
    gameLoop.start();

    const responseTimes: number[] = [];
    const testDuration = 2000; // 2 seconds
    const inputInterval = 200; // Input every 200ms

    let inputCount = 0;

    const intervalId = setInterval(() => {
      const startTime = performance.now();

      const listener = (event: any) => {
        if (event.action === 'thrust' && event.pressed) {
          const responseTime = performance.now() - startTime;
          responseTimes.push(responseTime);
          inputHandler.removeEventListener(listener);
        }
      };

      inputHandler.addEventListener(listener);

      mockElement._keydown?.({
        code: 'KeyW',
        preventDefault: () => {},
        repeat: false
      });

      inputCount++;

      if (inputCount * inputInterval >= testDuration) {
        clearInterval(intervalId);
      }
    }, inputInterval);

    // Wait for test completion
    await new Promise(resolve => setTimeout(resolve, testDuration + 500));

    gameLoop.stop();

    expect(responseTimes.length).toBeGreaterThan(5);

    // All response times should be within limit
    responseTimes.forEach(responseTime => {
      expect(responseTime).toBeLessThan(MAX_RESPONSE_TIME);
    });

    // Average response time should be well within limit
    const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    expect(averageResponseTime).toBeLessThan(MAX_RESPONSE_TIME * 0.5); // Half of max acceptable
  });
});