import { GameLoop } from '../lib/engine/game-loop.js';
import { PhysicsEngine } from '../lib/engine/physics.js';
import { CollisionSystem } from '../lib/engine/collision.js';
import { Renderer } from '../lib/engine/renderer.js';
import { GameStateManager } from '../lib/engine/game-state.js';
import { InputHandler } from '../lib/engine/input.js';

// Configuration interface
interface GameConfig {
  screenSize: { width: number; height: number };
  displayConfig: {
    characterMode: string;
    characterSet: any;
    colors: any;
    screenSize: { width: number; height: number };
  };
  physicsMode: string;
  difficulty: string;
  autoStart: boolean;
  componentId: string;
}

// Game instance variables
let gameLoop: GameLoop | null = null;
let gameContainer: Element | null = null;
let gameInitialized = false;

// Initialize game function
export async function initializeGame(config: GameConfig): Promise<void> {
  if (gameInitialized) return;

  gameContainer = document.getElementById(config.componentId) || document.querySelector('.asteroids-game-container');
  if (!gameContainer) {
    console.error('Game container not found');
    return;
  }

  try {
    // Create game systems
    const physics = new PhysicsEngine(config.screenSize.width, config.screenSize.height);
    physics.setGameMode(config.physicsMode as any);

    const collision = new CollisionSystem(config.screenSize.width, config.screenSize.height);

    const renderer = new Renderer(config.screenSize.width, config.screenSize.height, config.displayConfig as any);

    const gameState = new GameStateManager({
      screenSize: config.screenSize,
      gameMode: config.physicsMode as any,
      characterMode: config.displayConfig.characterMode as any,
      difficulty: config.difficulty as any
    });

    const input = new InputHandler(gameContainer);

    // Create game loop with callbacks
    const callbacks = {};
    let hudElement: Element | null = null;

    // Add HUD update callback
    (callbacks as any).onUpdate = (frameData: any) => {
      if (hudElement) {
        const currentState = gameState.getState();
        const newHUD = renderer.renderHUD({
          score: currentState.score,
          level: currentState.level,
          lives: currentState.lives,
          gameStatus: currentState.gameStatus,
          fps: Math.round(frameData.fps)
        });

        // Replace existing HUD
        const gameWrapper = hudElement.parentElement;
        if (gameWrapper) {
          gameWrapper.replaceChild(newHUD, hudElement);
          hudElement = newHUD;
        }
      }
    };

    gameLoop = new GameLoop(
      physics,
      collision,
      renderer,
      gameState,
      input,
      {
        targetFPS: 60,
        maxDeltaTime: 50,
        enableDebug: false
      },
      callbacks
    );

    // Create game wrapper with HUD
    const gameWrapper = document.createElement('div');
    gameWrapper.className = 'game-wrapper';
    gameWrapper.style.cssText = 'position: relative; display: inline-block;';

    // Create and insert game DOM element
    const gameElement = renderer.createDOMElement();
    gameElement.tabIndex = 0; // Make focusable

    // Create HUD element
    hudElement = renderer.renderHUD({
      score: gameState.getScore(),
      level: gameState.getLevel(),
      lives: gameState.getLives(),
      gameStatus: gameState.getGameStatus()
    });

    // Assemble game wrapper
    gameWrapper.appendChild(gameElement);
    gameWrapper.appendChild(hudElement);

    // Replace loading message
    const loadingElement = gameContainer.querySelector('.game-loading');
    if (loadingElement) {
      gameContainer.replaceChild(gameWrapper, loadingElement);
    } else {
      gameContainer.insertBefore(gameWrapper, gameContainer.firstChild);
    }

    // Set up initial level
    gameState.spawnAsteroidsForLevel(1);

    // Auto-start if requested
    if (config.autoStart) {
      gameLoop.start();
    }

    // Focus game element for keyboard input
    gameElement.focus();

    gameInitialized = true;

    // Expose game loop for external control
    if (typeof window !== 'undefined') {
      (window as any).astroGameInstances = (window as any).astroGameInstances || {};
      (window as any).astroGameInstances[config.componentId] = gameLoop;
    }

  } catch (error) {
    console.error('Failed to initialize Asteroids game:', error);

    // Show error message
    const errorElement = document.createElement('div');
    errorElement.className = 'game-error';
    errorElement.innerHTML = `
      <p><strong>Error loading game:</strong></p>
      <p>${(error as Error).message}</p>
      <p>Please check the console for more details.</p>
    `;
    errorElement.style.cssText = `
      color: #FF0000;
      text-align: center;
      padding: 2rem;
      border: 1px solid #FF0000;
      background-color: #220000;
      border-radius: 4px;
    `;

    const loadingElement = gameContainer!.querySelector('.game-loading');
    if (loadingElement) {
      gameContainer!.replaceChild(errorElement, loadingElement);
    }
  }
}

// Cleanup function
export function cleanup(): void {
  if (gameLoop) {
    gameLoop.destroy();
    gameLoop = null;
  }

  if (typeof window !== 'undefined' && (window as any).astroGameInstances) {
    delete (window as any).astroGameInstances;
  }

  gameInitialized = false;
}

// Auto-initialization for component
if (typeof document !== 'undefined') {
  const initGame = () => {
    const componentId = document.querySelector('.asteroids-game-container')?.id || 'asteroids-game-default';
    const config: GameConfig = {
      screenSize: {width: 80, height: 25},
      displayConfig: {
        characterMode: "ascii",
        characterSet: {
          spaceship: { up: "^", down: "v", left: "<", right: ">" },
          asteroid: { large: "O", small: "o" },
          projectile: "."
        },
        colors: {
          background: "#000000",
          foreground: "#00FF00",
          accent: "#FFFF00",
          highlight: "#FF0000"
        },
        screenSize: {width: 80, height: 25}
      },
      physicsMode: "scrolling",
      difficulty: "normal",
      autoStart: true,
      componentId: componentId
    };

    initializeGame(config);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
  } else {
    setTimeout(initGame, 0);
  }

  // Cleanup on page unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', cleanup);
  }
}