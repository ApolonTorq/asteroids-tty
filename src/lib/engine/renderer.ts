import type { Position } from '../types/geometry.js';
import type { Spaceship } from '../types/spaceship.js';
import type { Asteroid } from '../types/asteroid.js';
import type { Projectile } from '../types/projectile.js';
import type { GameState } from '../types/game-state.js';
import type { DisplayConfiguration, ColorScheme } from '../types/display.js';
import { getCharacterForObject, getCSSColorVars, getMonospaceCSS } from '../types/display.js';

export interface RenderCell {
  character: string;
  color?: string;
  backgroundColor?: string;
  zIndex: number;
}

export interface RenderFrame {
  cells: RenderCell[][];
  width: number;
  height: number;
  timestamp: number;
}

export interface HUDData {
  score: number;
  level: number;
  lives: number;
  gameStatus: string;
  fps?: number;
}

export class Renderer {
  private canvas: RenderCell[][];
  private width: number;
  private height: number;
  private displayConfig: DisplayConfiguration;
  private container: HTMLElement | null;

  constructor(width: number, height: number, displayConfig: DisplayConfiguration) {
    this.width = width;
    this.height = height;
    this.displayConfig = displayConfig;
    this.container = null;
    this.canvas = this.createEmptyCanvas();
  }

  private createEmptyCanvas(): RenderCell[][] {
    return Array.from({ length: this.height }, () =>
      Array.from({ length: this.width }, () => ({
        character: ' ',
        color: this.displayConfig.colors.foreground,
        backgroundColor: this.displayConfig.colors.background,
        zIndex: 0
      }))
    );
  }

  // Clear the canvas
  clear(): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.canvas[y][x] = {
          character: ' ',
          color: this.displayConfig.colors.foreground,
          backgroundColor: this.displayConfig.colors.background,
          zIndex: 0
        };
      }
    }
  }

  // Set a character at a specific position
  setCharacter(
    x: number,
    y: number,
    character: string,
    color?: string,
    backgroundColor?: string,
    zIndex: number = 1
  ): void {
    const cellX = Math.floor(x);
    const cellY = Math.floor(y);

    if (cellX >= 0 && cellX < this.width && cellY >= 0 && cellY < this.height) {
      const currentCell = this.canvas[cellY][cellX];

      // Only update if new character has higher or equal z-index
      if (zIndex >= currentCell.zIndex) {
        this.canvas[cellY][cellX] = {
          character,
          color: color || this.displayConfig.colors.foreground,
          backgroundColor: backgroundColor || this.displayConfig.colors.background,
          zIndex
        };
      }
    }
  }

  // Render individual game objects
  renderSpaceship(spaceship: Spaceship): void {
    if (!spaceship.alive) return;

    const character = getCharacterForObject(
      'spaceship',
      this.displayConfig,
      { rotation: spaceship.rotation }
    );

    const color = spaceship.thrust
      ? this.displayConfig.colors.highlight
      : this.displayConfig.colors.foreground;

    this.setCharacter(
      spaceship.position.x,
      spaceship.position.y,
      character,
      color,
      undefined,
      3 // High z-index for spaceship
    );
  }

  renderAsteroid(asteroid: Asteroid): void {
    if (!asteroid.active) return;

    const character = getCharacterForObject(
      'asteroid',
      this.displayConfig,
      { size: asteroid.size }
    );

    this.setCharacter(
      asteroid.position.x,
      asteroid.position.y,
      character,
      this.displayConfig.colors.foreground,
      undefined,
      2 // Medium z-index for asteroids
    );
  }

  renderProjectile(projectile: Projectile): void {
    if (!projectile.active) return;

    const character = getCharacterForObject('projectile', this.displayConfig);

    this.setCharacter(
      projectile.position.x,
      projectile.position.y,
      character,
      this.displayConfig.colors.accent,
      undefined,
      1 // Low z-index for projectiles
    );
  }

  // Render all game objects
  renderGameState(gameState: GameState): void {
    this.clear();

    // Render projectiles first (lowest z-index)
    gameState.objects.projectiles.forEach(projectile => {
      this.renderProjectile(projectile);
    });

    // Render asteroids
    gameState.objects.asteroids.forEach(asteroid => {
      this.renderAsteroid(asteroid);
    });

    // Render spaceship last (highest z-index)
    this.renderSpaceship(gameState.objects.spaceship);
  }

  // Get current frame for rendering
  getFrame(): RenderFrame {
    return {
      cells: this.canvas.map(row => [...row]), // Deep copy
      width: this.width,
      height: this.height,
      timestamp: performance.now()
    };
  }

  // DOM rendering methods
  createDOMElement(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'asteroids-container';

    this.applyContainerStyles(container);
    this.container = container;

    // Create character grid
    const grid = document.createElement('div');
    grid.className = 'character-grid';
    this.applyGridStyles(grid);

    // Create rows and cells
    for (let y = 0; y < this.height; y++) {
      const row = document.createElement('div');
      row.className = 'character-row';
      this.applyRowStyles(row);

      for (let x = 0; x < this.width; x++) {
        const cell = document.createElement('span');
        cell.className = 'character-cell';
        cell.textContent = ' ';
        this.applyCellStyles(cell);
        row.appendChild(cell);
      }

      grid.appendChild(row);
    }

    container.appendChild(grid);
    return container;
  }

  updateDOMElement(): void {
    if (!this.container) return;

    const grid = this.container.querySelector('.character-grid');
    if (!grid) return;

    const rows = grid.querySelectorAll('.character-row');

    for (let y = 0; y < this.height && y < rows.length; y++) {
      const cells = rows[y].querySelectorAll('.character-cell');

      for (let x = 0; x < this.width && x < cells.length; x++) {
        const cell = cells[x] as HTMLElement;
        const renderCell = this.canvas[y][x];

        cell.textContent = renderCell.character;
        cell.style.color = renderCell.color || this.displayConfig.colors.foreground;
        cell.style.backgroundColor = renderCell.backgroundColor || this.displayConfig.colors.background;
      }
    }
  }

  // Style application methods
  private applyContainerStyles(container: HTMLElement): void {
    const styles = {
      ...getMonospaceCSS(),
      ...getCSSColorVars(this.displayConfig.colors),
      backgroundColor: 'var(--game-bg)',
      color: 'var(--game-fg)',
      padding: '1rem',
      border: '2px solid var(--game-fg)',
      borderRadius: '4px',
      display: 'inline-block',
      position: 'relative'
    };

    Object.assign(container.style, styles);
  }

  private applyGridStyles(grid: HTMLElement): void {
    Object.assign(grid.style, {
      lineHeight: '1',
      whiteSpace: 'pre',
      userSelect: 'none',
      cursor: 'default'
    });
  }

  private applyRowStyles(row: HTMLElement): void {
    Object.assign(row.style, {
      display: 'block',
      height: '1em',
      margin: '0',
      padding: '0'
    });
  }

  private applyCellStyles(cell: HTMLElement): void {
    Object.assign(cell.style, {
      display: 'inline-block',
      width: '1ch',
      height: '1em',
      textAlign: 'center',
      verticalAlign: 'top',
      margin: '0',
      padding: '0'
    });
  }

  // HUD rendering
  renderHUD(hudData: HUDData): HTMLElement {
    const hud = document.createElement('div');
    hud.className = 'game-hud';

    const hudStyles = {
      ...getMonospaceCSS(),
      position: 'absolute',
      top: '0.5rem',
      left: '0.5rem',
      right: '0.5rem',
      display: 'flex',
      justifyContent: 'space-between',
      color: this.displayConfig.colors.highlight,
      fontSize: '0.9em',
      pointerEvents: 'none'
    };

    Object.assign(hud.style, hudStyles);

    // Left side: Score and Level
    const leftInfo = document.createElement('div');
    leftInfo.innerHTML = `
      <div class="score">Score: ${hudData.score}</div>
      <div class="level">Level: ${hudData.level}</div>
    `;

    // Right side: Lives and Status
    const rightInfo = document.createElement('div');
    rightInfo.style.textAlign = 'right';
    rightInfo.innerHTML = `
      <div class="lives">Lives: ${hudData.lives}</div>
      <div class="status">${hudData.gameStatus}</div>
    `;

    // Center: FPS (if available)
    if (hudData.fps !== undefined) {
      const centerInfo = document.createElement('div');
      centerInfo.textContent = `${Math.round(hudData.fps)} FPS`;
      centerInfo.style.fontSize = '0.8em';
      centerInfo.style.opacity = '0.7';
      hud.appendChild(centerInfo);
    }

    hud.appendChild(leftInfo);
    hud.appendChild(rightInfo);

    return hud;
  }

  // Configuration updates
  updateDisplayConfig(newConfig: DisplayConfiguration): void {
    this.displayConfig = newConfig;

    if (this.container) {
      // Update CSS variables
      const colorVars = getCSSColorVars(newConfig.colors);
      Object.entries(colorVars).forEach(([property, value]) => {
        this.container!.style.setProperty(property, value);
      });
    }
  }

  updateScreenSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.canvas = this.createEmptyCanvas();

    // If DOM element exists, recreate it
    if (this.container) {
      const parent = this.container.parentElement;
      if (parent) {
        const newElement = this.createDOMElement();
        parent.replaceChild(newElement, this.container);
      }
    }
  }

  // Utility methods
  getScreenSize(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  // Debug rendering
  renderDebugInfo(debugData: any): void {
    const debugStr = JSON.stringify(debugData, null, 2);
    const lines = debugStr.split('\n').slice(0, this.height - 1);

    lines.forEach((line, index) => {
      const characters = line.slice(0, this.width - 1).split('');
      characters.forEach((char, x) => {
        this.setCharacter(x, index, char, this.displayConfig.colors.accent, undefined, 10);
      });
    });
  }

  // Performance monitoring
  private frameCount = 0;
  private lastFPSUpdate = 0;
  private currentFPS = 0;

  updateFPS(): number {
    this.frameCount++;
    const now = performance.now();

    if (now - this.lastFPSUpdate >= 1000) {
      this.currentFPS = this.frameCount;
      this.frameCount = 0;
      this.lastFPSUpdate = now;
    }

    return this.currentFPS;
  }

  getFPS(): number {
    return this.currentFPS;
  }
}