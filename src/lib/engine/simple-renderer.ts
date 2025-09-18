import type { GameState } from '../types/game-state.js';
import type { Spaceship } from '../types/spaceship.js';
import type { Asteroid } from '../types/asteroid.js';
import type { Projectile } from '../types/projectile.js';

/**
 * Simple, efficient renderer that uses the DOM as state storage
 * No frame buffers, no complex diffing - just direct DOM manipulation
 */
export class SimpleRenderer {
  private container: HTMLElement | null = null;
  private gameElements: Map<string, HTMLElement> = new Map();
  private width: number;
  private height: number;
  private gameOverElement: HTMLElement | null = null;
  private statusElement: HTMLElement | null = null;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  createDOMElement(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'game-container';
    container.style.cssText = `
      position: relative;
      width: ${this.width}ch;
      height: ${this.height}em;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      line-height: 1;
      background: #000;
      color: #0f0;
      border: 2px solid #0f0;
      overflow: hidden;
    `;

    this.container = container;
    return container;
  }

  private createElement(id: string, character: string, x: number, y: number): HTMLElement {
    const elem = document.createElement('span');
    elem.id = id;
    elem.textContent = character;
    elem.style.cssText = `
      position: absolute;
      left: ${x}ch;
      top: ${y}em;
    `;
    return elem;
  }

  private updateElement(id: string, x: number, y: number, character?: string) {
    let elem = this.gameElements.get(id);
    if (!elem) {
      elem = this.createElement(id, character || '?', x, y);
      this.gameElements.set(id, elem);
      this.container?.appendChild(elem);
    } else {
      elem.style.left = `${x}ch`;
      elem.style.top = `${y}em`;
      if (character) {
        elem.textContent = character;
      }
    }
  }

  private removeElement(id: string) {
    const elem = this.gameElements.get(id);
    if (elem) {
      elem.remove();
      this.gameElements.delete(id);
    }
  }

  private frameCount = 0;

  renderGameState(gameState: GameState): void {
    if (!this.container) return;
    this.frameCount++;

    // Update game status display
    this.updateStatusDisplay(gameState);

    // Emergency check for too many objects
    const totalObjects = 1 + gameState.objects.asteroids.length + gameState.objects.projectiles.length;
    if (totalObjects > 100) {
      console.error(`[SimpleRenderer] Too many objects! Total: ${totalObjects}, Asteroids: ${gameState.objects.asteroids.length}, Projectiles: ${gameState.objects.projectiles.length}`);
      return;
    }

    let updateCount = 0;
    let createCount = 0;
    let removeCount = 0;

    // Update spaceship
    const spaceship = gameState.objects.spaceship;
    if (spaceship.alive) {
      // Fix rotation calculation - rotation is in degrees
      const normalizedRotation = ((spaceship.rotation % 360) + 360) % 360;
      const index = Math.round(normalizedRotation / 90) % 4;
      const chars = ['^', '>', 'v', '<'];
      const existed = this.gameElements.has('spaceship');

      const shipX = Math.floor(spaceship.position.x);
      const shipY = Math.floor(spaceship.position.y);

      // Log spaceship position for first 10 frames or if out of bounds
      if (this.frameCount <= 10 || shipX < 0 || shipX >= this.width || shipY < 0 || shipY >= this.height) {
        console.log(`[SimpleRenderer] Frame ${this.frameCount} - Rendering spaceship:`, {
          x: shipX,
          y: shipY,
          velocity: { dx: spaceship.velocity.dx, dy: spaceship.velocity.dy },
          rotation: spaceship.rotation,
          char: chars[index],
          outOfBounds: shipX < 0 || shipX >= this.width || shipY < 0 || shipY >= this.height
        });
      }

      // Clamp position to screen bounds for rendering
      const renderX = Math.max(0, Math.min(this.width - 1, shipX));
      const renderY = Math.max(0, Math.min(this.height - 1, shipY));

      this.updateElement('spaceship', renderX, renderY, chars[index]);
      if (existed) updateCount++; else createCount++;
    } else {
      if (this.gameElements.has('spaceship')) {
        this.removeElement('spaceship');
        removeCount++;
      }
    }

    // Update asteroids
    const activeAsteroidIds = new Set<string>();
    gameState.objects.asteroids.forEach((asteroid, i) => {
      const id = `asteroid-${i}`;
      if (asteroid.active) {
        activeAsteroidIds.add(id);
        const char = asteroid.size === 'large' ? 'O' : 'o';
        const existed = this.gameElements.has(id);
        this.updateElement(id,
          Math.floor(asteroid.position.x),
          Math.floor(asteroid.position.y),
          char
        );
        if (existed) updateCount++; else createCount++;
      }
    });

    // Remove inactive asteroids
    this.gameElements.forEach((elem, id) => {
      if (id.startsWith('asteroid-') && !activeAsteroidIds.has(id)) {
        this.removeElement(id);
        removeCount++;
      }
    });

    // Update projectiles
    const activeProjectileIds = new Set<string>();
    gameState.objects.projectiles.forEach((projectile, i) => {
      const id = `projectile-${i}`;
      if (projectile.active) {
        activeProjectileIds.add(id);
        const existed = this.gameElements.has(id);
        this.updateElement(id,
          Math.floor(projectile.position.x),
          Math.floor(projectile.position.y),
          '•'
        );
        if (existed) updateCount++; else createCount++;
      }
    });

    // Remove inactive projectiles
    this.gameElements.forEach((elem, id) => {
      if (id.startsWith('projectile-') && !activeProjectileIds.has(id)) {
        this.removeElement(id);
        removeCount++;
      }
    });

    // Log if there were many DOM operations (only in extreme cases)
    const totalOps = updateCount + createCount + removeCount;
    if (totalOps > 100) {
      console.warn('Excessive DOM operations:', {
        updates: updateCount,
        creates: createCount,
        removes: removeCount,
        total: totalOps,
        elements: this.gameElements.size
      });
    }
  }

  private updateStatusDisplay(gameState: GameState): void {
    // Show game over screen
    if (gameState.gameStatus === 'gameOver') {
      if (!this.gameOverElement) {
        this.gameOverElement = document.createElement('div');
        this.gameOverElement.className = 'game-over-overlay';
        this.gameOverElement.style.cssText = `
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          background: rgba(0, 0, 0, 0.9);
          border: 2px solid #ff0000;
          padding: 2em;
          z-index: 1000;
          color: #ff0000;
          font-family: 'Courier New', monospace;
        `;
        this.gameOverElement.innerHTML = `
          <h2 style="margin: 0 0 1em 0; font-size: 2em;">GAME OVER</h2>
          <p style="margin: 0.5em 0; color: #0f0;">Score: ${gameState.score}</p>
          <p style="margin: 0.5em 0; color: #0f0;">Level: ${gameState.level}</p>
          <p style="margin: 1.5em 0 0 0; color: #ffff00;">Press 'R' to Restart</p>
        `;
        this.container?.appendChild(this.gameOverElement);
      } else {
        // Update score if it changed
        this.gameOverElement.innerHTML = `
          <h2 style="margin: 0 0 1em 0; font-size: 2em;">GAME OVER</h2>
          <p style="margin: 0.5em 0; color: #0f0;">Score: ${gameState.score}</p>
          <p style="margin: 0.5em 0; color: #0f0;">Level: ${gameState.level}</p>
          <p style="margin: 1.5em 0 0 0; color: #ffff00;">Press 'R' to Restart</p>
        `;
      }
    } else if (this.gameOverElement) {
      // Remove game over screen when game restarts
      this.gameOverElement.remove();
      this.gameOverElement = null;
    }

    // Show paused screen
    if (gameState.gameStatus === 'paused') {
      if (!this.statusElement) {
        this.statusElement = document.createElement('div');
        this.statusElement.className = 'game-status-overlay';
        this.statusElement.style.cssText = `
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          background: rgba(0, 0, 0, 0.9);
          border: 2px solid #ffff00;
          padding: 1em 2em;
          z-index: 999;
          color: #ffff00;
          font-family: 'Courier New', monospace;
          font-size: 1.5em;
        `;
        this.statusElement.innerHTML = 'PAUSED';
        this.container?.appendChild(this.statusElement);
      }
    } else if (this.statusElement) {
      this.statusElement.remove();
      this.statusElement = null;
    }

    // Update HUD
    this.updateHUD(gameState);
  }

  private updateHUD(gameState: GameState): void {
    let hudElement = this.gameElements.get('hud');
    if (!hudElement) {
      hudElement = document.createElement('div');
      hudElement.id = 'hud';
      hudElement.style.cssText = `
        position: absolute;
        top: -1.5em;
        left: 0;
        color: #0f0;
        font-family: 'Courier New', monospace;
      `;
      this.gameElements.set('hud', hudElement);
      this.container?.appendChild(hudElement);
    }
    hudElement.textContent = `Score: ${gameState.score} | Lives: ${gameState.lives} | Level: ${gameState.level}`;
  }

  clear(): void {
    this.gameElements.forEach((elem, id) => {
      this.removeElement(id);
    });
    if (this.gameOverElement) {
      this.gameOverElement.remove();
      this.gameOverElement = null;
    }
    if (this.statusElement) {
      this.statusElement.remove();
      this.statusElement = null;
    }
  }

  updateScreenSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    if (this.container) {
      this.container.style.width = `${width}ch`;
      this.container.style.height = `${height}em`;
    }
  }

  getScreenSize(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  // Stub methods for compatibility
  renderHUD(hudData: any): HTMLElement {
    const hud = document.createElement('div');
    hud.className = 'game-hud';
    hud.style.cssText = `
      padding: 10px;
      background: #001100;
      color: #0f0;
      border: 1px solid #0f0;
      margin-top: 10px;
    `;
    hud.innerHTML = `
      Score: ${hudData.score} | Lives: ${hudData.lives} | Level: ${hudData.level}
    `;
    return hud;
  }

  updateDisplayConfig(): void {
    // No-op for now
  }
}