# 🚀 Asteroids TTY

A nostalgic recreation of the classic Asteroids game using character-based graphics, built with modern web technology while emulating the experience of playing on a 1979 Index 2000 computer.

![Version](https://img.shields.io/badge/version-0.0.1-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)
![Astro](https://img.shields.io/badge/Astro-4.13-orange)

## ✨ Features

### 🎮 Authentic Retro Experience
- **Character-based graphics** using ASCII and Unicode/emoji modes
- **80×25 terminal display** emulating the original Index 2000 limitations
- **Dual physics modes**: "Scrolling" (Index 2000 style) vs "Traditional" Asteroids
- **Progressive difficulty** with configurable levels and asteroid patterns

### 🔧 Modern Implementation
- **Astro component architecture** for easy integration into any project
- **TypeScript strict mode** with comprehensive type safety
- **60 FPS game loop** using requestAnimationFrame
- **Collision detection** optimized with spatial partitioning
- **Responsive design** supporting multiple screen sizes
- **Accessibility features** with keyboard navigation and focus management

### ⚙️ Configurable Everything
- Screen dimensions (30×12 to 120×30)
- Character modes (ASCII `^>vo.` or Unicode `🚀⭐💫`)
- Physics modes (Scrolling vs Traditional)
- Difficulty levels (Easy, Normal, Hard)
- Color schemes and visual themes

## 🎯 Quick Start

### Installation

```bash
git clone https://github.com/your-username/asteroids-tty.git
cd asteroids-tty
npm install
```

### Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Preview production build
npm run preview
```

### Usage as Component

```astro
---
import AsteroidsGame from './src/components/AsteroidsGame.astro';
---

<AsteroidsGame
  width={80}
  height={25}
  characterMode="ascii"
  physicsMode="scrolling"
  difficulty="normal"
  autoStart={true}
  showControls={true}
/>
```

## 🎮 Controls

| Key | Action |
|-----|--------|
| **W** / **↑** | Thrust forward |
| **A** / **←** | Rotate left |
| **D** / **→** | Rotate right |
| **Space** | Shoot projectile |
| **P** / **Esc** | Pause/Resume |
| **R** | Reset (when game over) |
| **C** | Toggle character mode (ASCII ↔ Unicode) |
| **M** | Toggle physics mode (Scrolling ↔ Traditional) |

## 🏗️ Architecture

### Project Structure

```
src/
├── components/
│   └── AsteroidsGame.astro      # Main game component
├── lib/
│   ├── types/                   # TypeScript interface definitions
│   │   ├── geometry.ts          # Position, Velocity interfaces
│   │   ├── spaceship.ts         # Spaceship entity definition
│   │   ├── asteroid.ts          # Asteroid entity and behavior
│   │   ├── projectile.ts        # Projectile entity and lifecycle
│   │   ├── game-state.ts        # Game state management types
│   │   └── display.ts           # Display configuration and character sets
│   ├── engine/                  # Core game engine systems
│   │   ├── physics.ts           # Physics simulation and movement
│   │   ├── collision.ts         # Collision detection with spatial partitioning
│   │   ├── input.ts             # Keyboard input handling
│   │   ├── renderer.ts          # Character-based DOM rendering
│   │   ├── game-state.ts        # Game state management
│   │   └── game-loop.ts         # Main game loop with 60 FPS timing
│   └── objects/                 # Game object controllers
│       ├── spaceship.ts         # Spaceship controller with physics
│       ├── asteroid.ts          # Asteroid controller and manager
│       ├── projectile.ts        # Projectile controller and manager
│       └── level.ts             # Level generation and progression
└── pages/
    ├── index.astro              # Main demo page
    └── demo.astro               # Multi-configuration showcase

tests/
├── component/                   # Component integration tests
├── unit/                        # Unit tests for game logic
└── integration/                 # End-to-end Playwright tests
```

### Core Systems

#### 🎯 Physics Engine
- Dual-mode physics supporting both "scrolling" (Index 2000) and "traditional" Asteroids mechanics
- Accurate velocity/acceleration calculations with screen wrapping
- Configurable thrust power, rotation speed, and drag coefficients

#### 💥 Collision Detection
- Spatial partitioning for optimal performance with large numbers of objects
- Precise circle-based collision detection for spaceship, asteroids, and projectiles
- Asteroid fragmentation with realistic physics

#### 🎨 Rendering System
- Character-based rendering using DOM manipulation (not canvas)
- Z-index layering for proper object display order
- Responsive grid layout with monospace font rendering
- Support for both ASCII characters and Unicode emoji

#### 🎮 Input System
- Configurable key mapping with multi-key support (WASD + arrows)
- Event-driven architecture with proper key state management
- Focus handling for accessibility

## 🔬 Testing

The project follows Test-Driven Development (TDD) with comprehensive coverage:

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration

# Interactive test UI
npm run test:ui
```

### Test Categories
- **Unit Tests**: Core game logic and physics (168 tests)
- **Component Tests**: Astro component integration
- **Integration Tests**: End-to-end gameplay scenarios with Playwright

## 🎨 Configuration Examples

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

## 🚀 Performance

- **60 FPS** game loop with performance monitoring
- **Optimized collision detection** using spatial partitioning
- **Memory efficient** object pooling and cleanup
- **Sub-100ms input response** time for responsive controls
- **Scalable** to large screen sizes (tested up to 120×30)

## 🎯 Design Philosophy

This project recreates the **nostalgic charm** of 1979 terminal gaming while leveraging **modern web standards**:

1. **Authenticity**: Faithful recreation of Index 2000 limitations and physics
2. **Modularity**: Component-first architecture for easy integration
3. **Accessibility**: Keyboard-driven with proper focus management
4. **Performance**: 60 FPS with optimized algorithms
5. **Extractability**: Single-component deployment to any Astro project

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`npm test`)
4. Commit changes (`git commit -m 'Add amazing feature'`)
5. Push to branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📝 Development Notes

### TypeScript Configuration
- Strict mode enabled for maximum type safety
- All game entities fully typed with comprehensive interfaces
- ESLint configuration for consistent code quality

### Browser Compatibility
- Modern ES modules with dynamic imports
- requestAnimationFrame for smooth 60 FPS
- DOM-based rendering for maximum compatibility
- No external runtime dependencies

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🎮 About

This project is a modern recreation of a 1979 BASIC program originally written for the Index 2000 computer. It demonstrates how classic terminal gaming can be preserved and enhanced using contemporary web technologies while maintaining the original's charm and limitations.

**Built with**: Astro 4.13, TypeScript 5.5, Vitest, Playwright

---

*Experience the golden age of computing with modern reliability* ⭐