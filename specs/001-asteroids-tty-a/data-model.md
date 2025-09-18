# Data Model: Asteroids TTY

## Game Object Interfaces

### Position
```typescript
interface Position {
  x: number;  // 0 to screen width
  y: number;  // 0 to screen height
}
```

### Velocity
```typescript
interface Velocity {
  dx: number;  // pixels per frame
  dy: number;  // pixels per frame
}
```

### Spaceship
```typescript
interface Spaceship {
  position: Position;
  velocity: Velocity;
  rotation: number;     // 0-360 degrees
  thrust: boolean;      // currently accelerating
  character: string;    // visual representation (< > ^ v)
  alive: boolean;       // collision state
}
```

**Validation Rules**:
- Position must be within screen boundaries (with wrapping)
- Rotation normalized to 0-360 degrees
- Character updates based on rotation direction

**State Transitions**:
- alive: true → false (collision with asteroid)
- thrust: false ↔ true (user input)
- rotation: incremental changes (user input)

### Asteroid
```typescript
interface Asteroid {
  position: Position;
  velocity: Velocity;
  size: 'large' | 'small';
  character: string;    // 'O' for large, 'o' for small
  active: boolean;      // destroyed state
}
```

**Validation Rules**:
- Large asteroids use 'O', small asteroids use 'o'
- Position wraps at screen boundaries
- Velocity maintains consistent movement

**State Transitions**:
- active: true → false (hit by projectile)
- size: large → 2-3 small asteroids (fragmentation)

### Projectile
```typescript
interface Projectile {
  position: Position;
  velocity: Velocity;
  lifespan: number;     // frames remaining
  character: string;    // '.' for bullet
  active: boolean;      // expired/hit state
}
```

**Validation Rules**:
- Lifespan decreases each frame
- Position moves according to velocity
- Character always '.' for retro aesthetic

**State Transitions**:
- active: true → false (collision or lifespan expired)
- lifespan: countdown to 0

### GameState
```typescript
interface GameState {
  score: number;
  level: number;
  lives: number;
  gameMode: 'scrolling' | 'traditional';
  characterMode: 'ascii' | 'unicode';
  screenSize: {
    width: number;    // character columns
    height: number;   // character rows
  };
  objects: {
    spaceship: Spaceship;
    asteroids: Asteroid[];
    projectiles: Projectile[];
  };
  gameStatus: 'playing' | 'gameOver' | 'paused';
}
```

**Validation Rules**:
- Score always non-negative
- Level starts at 1, increments when all asteroids destroyed
- Lives typically 3, decreases on spaceship collision
- Screen size minimum 40x20, default 80x25

**State Transitions**:
- gameStatus: playing ↔ paused (user input)
- gameStatus: playing → gameOver (lives = 0)
- level: increments when asteroids array empty

### DisplayConfiguration
```typescript
interface DisplayConfiguration {
  characterSet: {
    spaceship: {
      up: string;     // '^' or '🚀'
      down: string;   // 'v' or '⬇️'
      left: string;   // '<' or '⬅️'
      right: string;  // '>' or '➡️'
    };
    asteroid: {
      large: string;  // 'O' or '🪨'
      small: string;  // 'o' or '⚫'
    };
    projectile: string; // '.' or '•'
  };
  colors: {
    background: string;
    foreground: string;
    highlight: string;
  };
}
```

**Validation Rules**:
- Characters must be single display units
- Unicode mode uses emoji alternatives
- Colors use valid CSS color values

## Entity Relationships

### Spaceship → Projectiles
- One-to-many: Spaceship creates multiple projectiles
- Projectiles inherit spaceship's position and rotation
- Projectiles have independent velocity and lifespan

### Asteroids → Fragments
- One-to-many: Large asteroids create 2-3 small asteroids
- Fragment position near original asteroid
- Fragment velocity randomized but maintains general direction

### GameState → All Objects
- Composition: GameState contains all game objects
- GameState manages object lifecycle (creation/destruction)
- GameState coordinates collision detection between objects

### DisplayConfiguration → Visual Representation
- Configuration pattern: Display settings applied to all objects
- Character mode determines visual representation
- Configuration changes affect all objects immediately

## Data Flow

1. **Input Processing**: User input updates spaceship state
2. **Physics Update**: All objects update position based on velocity
3. **Collision Detection**: Check spaceship/projectile interactions with asteroids
4. **State Updates**: Process collisions, update score, check level completion
5. **Render**: Apply display configuration to create visual representation
6. **Boundary Handling**: Wrap positions at screen edges (traditional mode) or scroll (scrolling mode)