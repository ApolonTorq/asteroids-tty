# AsteroidsGame Component Documentation

The `AsteroidsGame.astro` component is a fully-featured, retro terminal-style Asteroids game that can be easily integrated into any Astro project.

## Overview

This component recreates the classic Asteroids game experience from 1979, complete with character-based graphics, dual physics modes, and comprehensive customization options. It's designed as a self-contained, extractable component that brings nostalgic gaming to modern web applications.

## Basic Usage

```astro
---
import AsteroidsGame from './path/to/AsteroidsGame.astro';
---

<AsteroidsGame />
```

## Props Interface

```typescript
interface Props {
  width?: number;                    // Screen width in characters (default: 80)
  height?: number;                   // Screen height in characters (default: 25)
  characterMode?: 'ascii' | 'unicode'; // Character set (default: 'ascii')
  physicsMode?: GameMode;            // Physics simulation mode (default: 'scrolling')
  difficulty?: Difficulty;           // Game difficulty (default: 'normal')
  autoStart?: boolean;              // Start game automatically (default: true)
  showControls?: boolean;           // Display control instructions (default: true)
  onGameOver?: (score: number) => void;
  onLevelComplete?: (level: number) => void;
  onScoreChange?: (score: number) => void;
}
```

## Configuration Examples

### Classic 1979 Mode
```astro
<AsteroidsGame
  width={80}
  height={25}
  characterMode="ascii"
  physicsMode="scrolling"
  difficulty="normal"
/>
```

### Modern Unicode Mode
```astro
<AsteroidsGame
  width={60}
  height={20}
  characterMode="unicode"
  physicsMode="traditional"
  difficulty="normal"
/>
```

### Mobile-Friendly Compact
```astro
<AsteroidsGame
  width={40}
  height={15}
  characterMode="ascii"
  physicsMode="traditional"
  difficulty="easy"
/>
```

### Expert Challenge Mode
```astro
<AsteroidsGame
  width={100}
  height={30}
  characterMode="unicode"
  physicsMode="scrolling"
  difficulty="hard"
/>
```

## Prop Details

### Screen Dimensions

**`width`** (number, default: 80)
- Character-based screen width
- Range: 30-120 characters
- Affects gameplay area and asteroid spawning

**`height`** (number, default: 25)
- Character-based screen height
- Range: 12-30 characters
- Influences game dynamics and collision space

### Visual Configuration

**`characterMode`** ('ascii' | 'unicode', default: 'ascii')

**ASCII Mode Characters:**
- Spaceship: `^` `v` `<` `>` (directional)
- Asteroids: `O` (large), `o` (small)
- Projectiles: `.`

**Unicode Mode Characters:**
- Spaceship: `🚀` `⬇️` `⬅️` `➡️`
- Asteroids: `☄️` (large), `💫` (small)
- Projectiles: `⭐`

### Physics Modes

**`physicsMode`** ('scrolling' | 'traditional', default: 'scrolling')

**Scrolling Mode (Index 2000 Emulation):**
- Vertical scrolling physics simulation
- Spaceship moves relative to scrolling field
- Asteroids move with scroll velocity
- Authentic 1979 experience

**Traditional Mode (Classic Asteroids):**
- Standard Asteroids physics
- Spaceship and asteroids move independently
- Screen wrapping on all edges
- Modern gameplay feel

### Difficulty Levels

**`difficulty`** ('easy' | 'normal' | 'hard', default: 'normal')

**Easy:**
- Slower asteroid speeds (0.7x multiplier)
- Fewer asteroids (0.8x count)
- Reduced scoring (0.8x points)

**Normal:**
- Balanced gameplay
- Standard progression curves
- Default scoring system

**Hard:**
- Faster asteroids (1.3x speed)
- More asteroids (1.2x count)
- Bonus scoring (1.5x points)

### Behavior Configuration

**`autoStart`** (boolean, default: true)
- `true`: Game starts immediately when component loads
- `false`: Manual start required (spacebar or API call)

**`showControls`** (boolean, default: true)
- `true`: Displays control instructions below game
- `false`: Clean game-only display

### Event Callbacks

**`onGameOver`** ((score: number) => void)
```astro
<AsteroidsGame
  onGameOver={(score) => {
    console.log(`Game Over! Final score: ${score}`);
    // Handle game over logic
  }}
/>
```

**`onLevelComplete`** ((level: number) => void)
```astro
<AsteroidsGame
  onLevelComplete={(level) => {
    console.log(`Level ${level} completed!`);
    // Handle level progression
  }}
/>
```

**`onScoreChange`** ((score: number) => void)
```astro
<AsteroidsGame
  onScoreChange={(score) => {
    document.getElementById('score-display').textContent = score;
    // Update external score display
  }}
/>
```

## Controls

| Key | Action | Description |
|-----|--------|-------------|
| **W** / **↑** | Thrust | Apply forward thrust to spaceship |
| **A** / **←** | Rotate Left | Rotate spaceship counterclockwise |
| **D** / **→** | Rotate Right | Rotate spaceship clockwise |
| **Space** | Shoot | Fire projectile in current direction |
| **P** / **Esc** | Pause/Resume | Toggle game pause state |
| **R** | Reset | Restart game (when game over) |
| **C** | Toggle Characters | Switch between ASCII/Unicode modes |
| **M** | Toggle Physics | Switch between Scrolling/Traditional modes |

## Game Features

### Scoring System
- **Small Asteroid**: 100 points
- **Large Asteroid**: 50 points
- **Level Completion Bonus**: Level × 100 points
- **Extra Life**: Every 10,000 points
- **Difficulty Multiplier**: Applied to all scoring

### Level Progression
- **Asteroid Count**: 4 + (level ÷ 2), max 15
- **Asteroid Speed**: 0.8 + (level × 0.15), max 4.0
- **Large Asteroid Ratio**: Decreases with level (70% → 30%)

### Physics Simulation
- **60 FPS** game loop with requestAnimationFrame
- **Collision detection** with spatial partitioning optimization
- **Screen wrapping** for seamless edge transitions
- **Realistic thrust/drag** mechanics

## Performance Specifications

- **Target FPS**: 60 FPS sustained
- **Input Response**: <100ms input-to-action latency
- **Memory Usage**: Bounded object pools, automatic cleanup
- **Browser Support**: Modern browsers with ES2020+ support

## Integration Patterns

### Blog Integration
```astro
---
// blog-post.astro
import AsteroidsGame from '../components/AsteroidsGame.astro';
---

<article>
  <h1>Retro Gaming Nostalgia</h1>
  <p>Experience the classic Asteroids game from 1979...</p>

  <AsteroidsGame
    width={60}
    height={20}
    characterMode="ascii"
    autoStart={false}
    showControls={false}
  />

  <p>This recreation captures the essence of terminal gaming...</p>
</article>
```

### Portfolio Showcase
```astro
---
// portfolio.astro
import AsteroidsGame from '../components/AsteroidsGame.astro';
---

<section class="interactive-demo">
  <h2>Interactive Game Development</h2>

  <div class="demo-grid">
    <AsteroidsGame
      width={80}
      height={25}
      characterMode="ascii"
      physicsMode="scrolling"
      difficulty="normal"
    />
  </div>

  <p>Built with Astro, TypeScript, and modern web standards.</p>
</section>
```

### Educational Content
```astro
---
// tutorial.astro
import AsteroidsGame from '../components/AsteroidsGame.astro';
---

<div class="tutorial-section">
  <h3>Game Physics Demonstration</h3>

  <div class="physics-comparison">
    <div>
      <h4>Scrolling Physics</h4>
      <AsteroidsGame
        width={50}
        height={20}
        physicsMode="scrolling"
        autoStart={false}
      />
    </div>

    <div>
      <h4>Traditional Physics</h4>
      <AsteroidsGame
        width={50}
        height={20}
        physicsMode="traditional"
        autoStart={false}
      />
    </div>
  </div>
</div>
```

## External API

The component exposes a global API for external control:

```javascript
// Access game instance
const gameApi = window.AsteroidsGame['asteroids-game-{id}'];

// Control methods
gameApi.start();          // Start game
gameApi.stop();           // Stop game
gameApi.pause();          // Pause game
gameApi.resume();         // Resume game
gameApi.reset();          // Reset game state

// Information methods
gameApi.isRunning();      // Returns boolean
gameApi.getStats();       // Returns performance stats
gameApi.getDebugInfo();   // Returns debug information
```

## Styling and Customization

The component includes built-in responsive CSS but can be customized:

```css
.asteroids-game-container {
  /* Override container styles */
  background-color: #001100;
  border-color: #00FF00;
}

.game-controls {
  /* Customize control display */
  font-size: 0.8em;
  max-width: 400px;
}

@media (max-width: 768px) {
  .asteroids-game-container {
    /* Mobile responsive overrides */
    padding: 0.5rem;
  }
}
```

## Error Handling

The component includes comprehensive error handling:

- **Load Errors**: Display user-friendly error messages
- **Runtime Errors**: Graceful degradation with error boundaries
- **Invalid Props**: Validation with helpful error messages
- **Browser Compatibility**: Feature detection and fallbacks

## Accessibility

- **Keyboard Navigation**: Full keyboard control support
- **Focus Management**: Proper focus handling for screen readers
- **Color Contrast**: High contrast color schemes
- **Responsive Design**: Mobile and desktop compatibility

## Technical Architecture

### Component Lifecycle
1. **Initialization**: Async module loading and system setup
2. **Rendering**: DOM element creation and HUD integration
3. **Game Loop**: 60 FPS update/render cycle
4. **Cleanup**: Proper resource disposal on unmount

### Memory Management
- **Object Pooling**: Reuse game objects to prevent allocation
- **Automatic Cleanup**: Remove inactive objects each frame
- **Event Cleanup**: Proper event listener disposal
- **Performance Monitoring**: Track memory usage and frame rates

### Browser Compatibility
- **ES2020+**: Modern JavaScript features
- **Module Loading**: Dynamic imports for code splitting
- **RequestAnimationFrame**: Smooth 60 FPS animation
- **DOM Manipulation**: Standard DOM APIs for rendering

## Migration and Extraction

To extract this component to a new Astro project:

1. **Copy Files**:
   ```bash
   cp -r src/components/AsteroidsGame.astro target/src/components/
   cp -r src/lib/ target/src/lib/
   ```

2. **Install Dependencies**:
   ```bash
   npm install typescript @astrojs/check
   ```

3. **Update Imports**: Adjust import paths if necessary

4. **Test Integration**: Verify component loads and functions correctly

The component is designed for zero-dependency extraction and should work in any Astro 4+ project with TypeScript support.

## Troubleshooting

### Common Issues

**Component doesn't load:**
- Check TypeScript configuration
- Verify import paths are correct
- Ensure browser supports ES2020+

**Poor performance:**
- Reduce screen size for better frame rates
- Lower difficulty for fewer objects
- Check for browser console errors

**Input not responding:**
- Ensure game element has focus
- Check for keyboard event conflicts
- Verify browser compatibility

**Graphics not displaying:**
- Check character encoding (UTF-8)
- Verify font supports Unicode characters
- Test with ASCII mode first

### Debug Information

Enable debug mode for development:

```javascript
// In browser console
const gameApi = window.AsteroidsGame['asteroids-game-{id}'];
console.log(gameApi.getDebugInfo());
```

This provides detailed information about game state, performance, and system status.

## Contributing

When modifying the component:

1. **Maintain TypeScript strict mode**
2. **Add comprehensive tests** for new features
3. **Update documentation** for API changes
4. **Verify extractability** after modifications
5. **Test multiple configurations** and browsers

The component follows the project's constitution emphasizing nostalgic simplicity, TypeScript strictness, and extractable design.