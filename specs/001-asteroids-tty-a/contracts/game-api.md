# Game API Contracts: Asteroids TTY

## Component Interface Contract

Since this is a client-side only game, the "API" consists of the component interface and internal game methods.

### Astro Component Props

```typescript
interface AsteroidsGameProps {
  // Display configuration
  width?: number;           // default: 80 characters
  height?: number;          // default: 25 characters
  characterMode?: 'ascii' | 'unicode';  // default: 'ascii'
  physicsMode?: 'scrolling' | 'traditional';  // default: 'scrolling'

  // Game settings
  initialLives?: number;    // default: 3
  difficulty?: 'easy' | 'normal' | 'hard';  // default: 'normal'

  // Event callbacks (optional)
  onGameOver?: (score: number) => void;
  onLevelComplete?: (level: number) => void;
  onScoreChange?: (score: number) => void;
}
```

### Game Control Methods

```typescript
interface GameControls {
  // Core game controls
  startGame(): void;
  pauseGame(): void;
  resumeGame(): void;
  resetGame(): void;

  // Input handling
  handleKeyPress(key: string): void;
  handleKeyRelease(key: string): void;

  // Configuration
  setDisplayMode(mode: 'ascii' | 'unicode'): void;
  setPhysicsMode(mode: 'scrolling' | 'traditional'): void;
  setScreenSize(width: number, height: number): void;
}
```

### Game State Query Methods

```typescript
interface GameStateQuery {
  // Current state access
  getCurrentScore(): number;
  getCurrentLevel(): number;
  getRemainingLives(): number;
  getGameStatus(): 'playing' | 'gameOver' | 'paused';

  // Object state access
  getSpaceshipPosition(): Position;
  getAsteroidCount(): number;
  getProjectileCount(): number;

  // Configuration access
  getDisplayConfiguration(): DisplayConfiguration;
  getPhysicsMode(): 'scrolling' | 'traditional';
}
```

## Input Event Contracts

### Keyboard Input Events

```typescript
interface KeyboardEvents {
  // Movement controls
  'ArrowUp' | 'KeyW': () => void;      // Thrust
  'ArrowLeft' | 'KeyA': () => void;    // Rotate left
  'ArrowRight' | 'KeyD': () => void;   // Rotate right
  'Space': () => void;                 // Shoot

  // Game controls
  'KeyP': () => void;                  // Pause/Resume
  'KeyR': () => void;                  // Reset game
  'Escape': () => void;                // Pause

  // Display controls
  'KeyC': () => void;                  // Toggle character mode
  'KeyM': () => void;                  // Toggle physics mode
}
```

### Event Response Contract

```typescript
interface InputResponse {
  // Immediate effects
  key: string;
  action: 'press' | 'release';
  timestamp: number;
  handled: boolean;

  // State changes triggered
  spaceshipChanges?: Partial<Spaceship>;
  gameStateChanges?: Partial<GameState>;
  newObjects?: (Projectile | Asteroid)[];
}
```

## Game Loop Contracts

### Animation Frame Contract

```typescript
interface FrameUpdate {
  // Timing
  timestamp: number;
  deltaTime: number;       // milliseconds since last frame
  frameNumber: number;     // total frames since game start

  // Updates performed
  physicsUpdated: boolean;
  collisionsChecked: boolean;
  renderComplete: boolean;

  // Performance metrics
  frameDuration: number;   // milliseconds for this frame
  fps: number;            // current frames per second
}
```

### Collision Detection Contract

```typescript
interface CollisionEvent {
  // Objects involved
  object1: {
    type: 'spaceship' | 'asteroid' | 'projectile';
    id: string;
    position: Position;
  };
  object2: {
    type: 'spaceship' | 'asteroid' | 'projectile';
    id: string;
    position: Position;
  };

  // Collision details
  timestamp: number;
  position: Position;      // collision point

  // Results
  destroyed: string[];     // IDs of destroyed objects
  created: (Asteroid | Projectile)[]; // New objects (asteroid fragments)
  scoreChange: number;     // Points awarded
}
```

## Rendering Contracts

### Display Output Contract

```typescript
interface DisplayFrame {
  // Grid content
  characters: string[][];  // [row][column] character grid
  colors: string[][];      // [row][column] CSS color values

  // Metadata
  width: number;           // character columns
  height: number;          // character rows
  characterMode: 'ascii' | 'unicode';

  // Game info overlay
  score: number;
  level: number;
  lives: number;
  gameStatus: string;
}
```

### Component Export Contract

```typescript
// Single component export for extractability
export interface AsteroidsComponent {
  // Required for Astro integration
  default: AstroComponent<AsteroidsGameProps>;

  // Optional utilities for embedding
  getDefaultConfig(): AsteroidsGameProps;
  validateConfig(props: Partial<AsteroidsGameProps>): boolean;

  // Version info for compatibility
  version: string;
  requiredAstroVersion: string;
}
```

## Error Handling Contracts

### Error Types

```typescript
interface GameError {
  type: 'input' | 'rendering' | 'physics' | 'configuration';
  code: string;
  message: string;
  timestamp: number;
  recoverable: boolean;
}

// Specific error contracts
interface InputError extends GameError {
  type: 'input';
  invalidKey?: string;
  expectedKeys?: string[];
}

interface RenderingError extends GameError {
  type: 'rendering';
  frameNumber?: number;
  element?: string;
}

interface PhysicsError extends GameError {
  type: 'physics';
  objectId?: string;
  invalidState?: any;
}

interface ConfigurationError extends GameError {
  type: 'configuration';
  invalidProperty?: string;
  validValues?: any[];
}
```

## Testing Contracts

### Component Test Interface

```typescript
interface TestInterface {
  // Setup methods
  createTestGame(props?: Partial<AsteroidsGameProps>): GameControls;
  simulateKeyPress(key: string): void;
  simulateFrames(count: number): void;

  // Assertion helpers
  expectScore(expected: number): void;
  expectAsteroidCount(expected: number): void;
  expectGameStatus(expected: string): void;
  expectCharacterAt(x: number, y: number, char: string): void;

  // Cleanup
  destroyTestGame(): void;
}