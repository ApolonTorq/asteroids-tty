# Quickstart: Asteroids TTY

## Installation & Setup

### Prerequisites
- Node.js 18+
- npm or yarn package manager

### Create New Astro Project
```bash
npm create astro@latest asteroids-demo
cd asteroids-demo
npm install
```

### Add Asteroids TTY Component
```bash
# Copy the component file (when built)
cp path/to/AsteroidsGame.astro src/components/
```

## Basic Usage

### 1. Add Component to Page
```astro
---
// src/pages/index.astro
import AsteroidsGame from '../components/AsteroidsGame.astro';
---

<html>
<head>
    <title>Asteroids TTY Demo</title>
    <style>
        body {
            background: black;
            color: green;
            font-family: 'Courier New', monospace;
        }
    </style>
</head>
<body>
    <h1>Asteroids TTY - Retro Terminal Game</h1>
    <AsteroidsGame />
</body>
</html>
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Play the Game
- Open http://localhost:4321
- Use WASD or arrow keys to control spaceship
- Press Space to shoot
- Press P to pause/resume
- Press C to toggle ASCII/Unicode characters
- Press M to toggle scrolling/traditional physics

## Configuration Examples

### Custom Screen Size
```astro
<AsteroidsGame
    width={100}
    height={30}
    characterMode="unicode"
    physicsMode="traditional"
/>
```

### Event Handling
```astro
---
const handleGameOver = (score: number) => {
    console.log(`Game Over! Final Score: ${score}`);
};

const handleLevelComplete = (level: number) => {
    console.log(`Level ${level} completed!`);
};
---

<AsteroidsGame
    onGameOver={handleGameOver}
    onLevelComplete={handleLevelComplete}
    difficulty="hard"
/>
```

## Test Scenarios

### Scenario 1: Basic Gameplay
1. Load the game page
2. Verify 80x25 character grid displays
3. Press W (thrust) - spaceship should move up
4. Press A/D - spaceship should rotate left/right
5. Press Space - projectile should fire
6. Verify asteroids are moving around screen
7. Hit asteroid with projectile - should break into smaller pieces
8. Verify score increases when asteroid is destroyed

**Expected Result**: Game plays normally with retro character graphics

### Scenario 2: Vertical Scrolling Mode
1. Start game (default scrolling mode)
2. Wait without input
3. Verify screen scrolls upward
4. Verify asteroids appear at bottom edge
5. Verify spaceship movement compensates for scrolling

**Expected Result**: Screen scrolls continuously, simulating Index 2000 limitations

### Scenario 3: Traditional Mode
1. Press M to switch to traditional mode
2. Verify scrolling stops
3. Move spaceship to screen edge
4. Verify spaceship wraps to opposite edge
5. Watch asteroids wrap at screen boundaries

**Expected Result**: Standard asteroids physics without scrolling

### Scenario 4: Character Mode Toggle
1. Start with ASCII mode (< > ^ v characters)
2. Press C to toggle to Unicode mode
3. Verify spaceship uses emoji characters (🚀 ⬅️ ➡️)
4. Verify asteroids use emoji (🪨 ⚫)
5. Press C again to return to ASCII

**Expected Result**: Visual representation changes between ASCII and Unicode

### Scenario 5: Game Over Sequence
1. Position spaceship near asteroid
2. Move into asteroid to trigger collision
3. Verify lives decrease
4. Repeat until lives = 0
5. Verify "Game Over" state
6. Verify final score display
7. Press R to reset game

**Expected Result**: Game ends properly and can be restarted

### Scenario 6: Level Progression
1. Destroy all asteroids on screen
2. Verify new level starts automatically
3. Verify increased asteroid count
4. Verify faster asteroid movement
5. Verify level number increases
6. Verify score bonus for level completion

**Expected Result**: Progressive difficulty with clear level transitions

## Integration Testing

### Embed in Existing Astro Site
```astro
---
// src/pages/blog/retro-gaming.astro
import Layout from '../../layouts/Layout.astro';
import AsteroidsGame from '../../components/AsteroidsGame.astro';
---

<Layout title="Retro Gaming: Asteroids TTY">
    <article>
        <h1>Recreating 1979 Computer Games</h1>
        <p>This is a recreation of my first programming project...</p>

        <div class="game-container">
            <AsteroidsGame
                width={60}
                height={20}
                characterMode="ascii"
                physicsMode="scrolling"
            />
        </div>

        <p>The game above demonstrates...</p>
    </article>
</Layout>

<style>
.game-container {
    margin: 2rem 0;
    padding: 1rem;
    background: #000;
    border: 2px solid #333;
}
</style>
```

## Performance Validation

### Frame Rate Test
1. Open browser developer tools
2. Monitor Performance tab
3. Play game for 60 seconds
4. Verify consistent 60fps
5. Check for memory leaks
6. Verify smooth character animation

**Target**: Stable 60fps with minimal memory usage

### Input Responsiveness Test
1. Rapidly press movement keys
2. Verify immediate visual response
3. Press multiple keys simultaneously
4. Verify proper key combination handling
5. Test keyboard repeat rates

**Target**: <100ms input response time

## Troubleshooting

### Common Issues

**Game doesn't load**
- Check Node.js version (18+ required)
- Verify Astro dependencies installed
- Check browser console for errors

**Poor performance**
- Reduce screen size (width/height props)
- Check browser hardware acceleration
- Close other tabs/applications

**Controls not working**
- Ensure game area has focus
- Check for keyboard shortcuts conflicts
- Verify browser allows keypress events

**Characters not displaying**
- Check font family (monospace required)
- Verify character encoding (UTF-8)
- Test with ASCII mode first

## Next Steps

1. **Customization**: Modify character sets, colors, or physics
2. **Enhancement**: Add sound effects, particle effects, or power-ups
3. **Integration**: Embed in blog posts, documentation, or portfolios
4. **Learning**: Study the code to understand game development concepts

The component is designed to be self-contained and easily portable to any Astro project!