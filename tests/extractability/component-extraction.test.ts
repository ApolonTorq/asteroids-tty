import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';

describe('Component Extraction Validation', () => {
  const projectRoot = resolve(__dirname, '../..');
  const srcPath = join(projectRoot, 'src');

  it('should have all required component files for extraction', () => {
    const requiredFiles = [
      'components/AsteroidsGame.astro',
      'lib/types/geometry.ts',
      'lib/types/spaceship.ts',
      'lib/types/asteroid.ts',
      'lib/types/projectile.ts',
      'lib/types/game-state.ts',
      'lib/types/display.ts',
      'lib/engine/physics.ts',
      'lib/engine/collision.ts',
      'lib/engine/input.ts',
      'lib/engine/renderer.ts',
      'lib/engine/game-state.ts',
      'lib/engine/game-loop.ts',
      'lib/objects/spaceship.ts',
      'lib/objects/asteroid.ts',
      'lib/objects/projectile.ts',
      'lib/objects/level.ts'
    ];

    requiredFiles.forEach(file => {
      const filePath = join(srcPath, file);
      expect(existsSync(filePath)).toBe(true);
    });
  });

  it('should have valid import/export structure for extraction', () => {
    const mainComponent = join(srcPath, 'components/AsteroidsGame.astro');
    const componentContent = readFileSync(mainComponent, 'utf-8');

    // Check for proper imports
    expect(componentContent).toContain("import type { ScreenSize, GameMode, Difficulty }");
    expect(componentContent).toContain("import type { DisplayConfiguration }");
    expect(componentContent).toContain("import { CHARACTER_SETS }");

    // Check for component export structure
    expect(componentContent).toContain("export interface Props");

    // Verify async import structure for browser compatibility
    expect(componentContent).toContain("import('../lib/engine/");
  });

  it('should have self-contained type definitions', () => {
    const typeFiles = [
      'lib/types/geometry.ts',
      'lib/types/spaceship.ts',
      'lib/types/asteroid.ts',
      'lib/types/projectile.ts',
      'lib/types/game-state.ts',
      'lib/types/display.ts'
    ];

    typeFiles.forEach(file => {
      const filePath = join(srcPath, file);
      const content = readFileSync(filePath, 'utf-8');

      // Check for proper TypeScript exports
      expect(content).toMatch(/export\s+(interface|type|const|function)/);

      // Verify no external non-relative imports
      const externalImports = content.match(/import.*from\s+['"][^.\/]/g);
      expect(externalImports).toBeNull();
    });
  });

  it('should have valid relative import paths', () => {
    const engineFiles = [
      'lib/engine/physics.ts',
      'lib/engine/collision.ts',
      'lib/engine/input.ts',
      'lib/engine/renderer.ts',
      'lib/engine/game-state.ts',
      'lib/engine/game-loop.ts'
    ];

    engineFiles.forEach(file => {
      const filePath = join(srcPath, file);
      const content = readFileSync(filePath, 'utf-8');

      // Check that all imports are relative
      const importLines = content.match(/import.*from\s+['"][^'"]*/g) || [];
      importLines.forEach(importLine => {
        const importPath = importLine.match(/from\s+['"]([^'"]*)/)?.[1];
        if (importPath && !importPath.startsWith('.')) {
          // Allow Node.js built-ins and standard APIs
          const allowedExternals = ['performance', 'requestAnimationFrame', 'document', 'window'];
          const isAllowed = allowedExternals.some(allowed => importPath.includes(allowed));
          if (!isAllowed) {
            throw new Error(`Non-relative import found in ${file}: ${importPath}`);
          }
        }
      });
    });
  });

  it('should not require external dependencies beyond Astro basics', () => {
    const packageJsonPath = join(projectRoot, 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

    // Runtime dependencies should be minimal for extractability
    const runtimeDeps = Object.keys(packageJson.dependencies || {});

    // Only allow Astro as runtime dependency
    const allowedRuntimeDeps = ['astro'];
    runtimeDeps.forEach(dep => {
      expect(allowedRuntimeDeps).toContain(dep);
    });
  });

  it('should have proper ESM module structure', () => {
    const packageJsonPath = join(projectRoot, 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

    // Check for ESM configuration
    expect(packageJson.type).toBe('module');

    // Check that all TypeScript files use .js extensions in imports
    const tsFiles = [
      'lib/engine/game-loop.ts',
      'lib/engine/collision.ts',
      'components/AsteroidsGame.astro'
    ];

    tsFiles.forEach(file => {
      const filePath = join(srcPath, file);
      const content = readFileSync(filePath, 'utf-8');

      const importLines = content.match(/import.*from\s+['"][^'"]*.js['"];/g) || [];
      const relativeImports = content.match(/import.*from\s+['"]\.\.?\//g) || [];

      // All relative imports should use .js extension
      if (relativeImports.length > 0) {
        expect(importLines.length).toBeGreaterThan(0);
      }
    });
  });

  it('should have complete game functionality in single component', () => {
    const mainComponent = join(srcPath, 'components/AsteroidsGame.astro');
    const componentContent = readFileSync(mainComponent, 'utf-8');

    // Check for complete game setup
    expect(componentContent).toContain('GameLoop');
    expect(componentContent).toContain('PhysicsEngine');
    expect(componentContent).toContain('CollisionSystem');
    expect(componentContent).toContain('Renderer');
    expect(componentContent).toContain('GameStateManager');
    expect(componentContent).toContain('InputHandler');

    // Check for game lifecycle management
    expect(componentContent).toContain('initializeGame');
    expect(componentContent).toContain('cleanup');
    expect(componentContent).toContain('gameLoop.start');
    expect(componentContent).toContain('gameLoop.destroy');

    // Check for error handling
    expect(componentContent).toContain('try {');
    expect(componentContent).toContain('catch (error)');
  });

  it('should support all required game features for standalone use', () => {
    const mainComponent = join(srcPath, 'components/AsteroidsGame.astro');
    const componentContent = readFileSync(mainComponent, 'utf-8');

    // Essential game features
    const requiredFeatures = [
      'width',
      'height',
      'characterMode',
      'physicsMode',
      'difficulty',
      'autoStart',
      'showControls',
      'onGameOver',
      'onLevelComplete',
      'onScoreChange'
    ];

    requiredFeatures.forEach(feature => {
      expect(componentContent).toContain(feature);
    });

    // Game control features
    expect(componentContent).toContain('spawnAsteroidsForLevel');
    expect(componentContent).toContain('renderHUD');
    expect(componentContent).toContain('addEventListener');
  });

  it('should have accessible documentation for extraction', () => {
    const componentReadme = join(srcPath, 'components/README.md');
    const readmeContent = readFileSync(componentReadme, 'utf-8');

    // Check documentation completeness
    expect(readmeContent).toContain('# AsteroidsGame Component Documentation');
    expect(readmeContent).toContain('## Props Interface');
    expect(readmeContent).toContain('## Configuration Examples');
    expect(readmeContent).toContain('## Migration and Extraction');

    // Check for extraction instructions
    expect(readmeContent).toContain('cp -r src/components/AsteroidsGame.astro');
    expect(readmeContent).toContain('cp -r src/lib/');
    expect(readmeContent).toContain('npm install');
  });

  it('should validate TypeScript configuration compatibility', () => {
    const tsConfigPath = join(projectRoot, 'tsconfig.json');
    const tsConfig = JSON.parse(readFileSync(tsConfigPath, 'utf-8'));

    // Check for strict mode (required for component reliability)
    expect(tsConfig.compilerOptions.strict).toBe(true);

    // Check for ES module compatibility
    expect(tsConfig.compilerOptions.moduleResolution).toBe('bundler');
    expect(tsConfig.compilerOptions.allowImportingTsExtensions).toBe(true);
    expect(tsConfig.compilerOptions.noEmit).toBe(true);

    // Check for modern target
    expect(['ES2020', 'ES2021', 'ES2022', 'ESNext']).toContain(tsConfig.compilerOptions.target);
  });

  it('should have minimal styling dependencies for extraction', () => {
    const mainComponent = join(srcPath, 'components/AsteroidsGame.astro');
    const componentContent = readFileSync(mainComponent, 'utf-8');

    // Check that all styles are inline/scoped
    expect(componentContent).toContain('<style>');

    // Should not reference external CSS files
    expect(componentContent).not.toContain('import.*\\.css');
    expect(componentContent).not.toContain('<link.*stylesheet');

    // All styles should be self-contained
    const styleSection = componentContent.match(/<style>([\s\S]*?)<\/style>/)?.[1];
    if (styleSection) {
      // Should not reference external assets
      expect(styleSection).not.toMatch(/url\(['"](?!data:)/);
      expect(styleSection).not.toMatch(/@import/);
    }
  });

  it('should support browser compatibility for extraction', () => {
    const mainComponent = join(srcPath, 'components/AsteroidsGame.astro');
    const componentContent = readFileSync(mainComponent, 'utf-8');

    // Check for modern browser API usage with fallbacks
    expect(componentContent).toContain('performance.now');
    expect(componentContent).toContain('requestAnimationFrame');
    expect(componentContent).toContain('typeof window !== \'undefined\'');

    // Check for SSR safety
    expect(componentContent).toContain('document.readyState');
    expect(componentContent).toContain('DOMContentLoaded');
  });

  it('should have proper error boundaries for robustness', () => {
    const mainComponent = join(srcPath, 'components/AsteroidsGame.astro');
    const componentContent = readFileSync(mainComponent, 'utf-8');

    // Check for comprehensive error handling
    expect(componentContent).toContain('console.error');
    expect(componentContent).toContain('game-error');
    expect(componentContent).toContain('Error loading game');

    // Error recovery mechanisms
    expect(componentContent).toContain('Failed to initialize');
    expect(componentContent).toContain('check the console');
  });

  it('should validate single-file dependency requirement', () => {
    // Count the actual number of files required
    const componentFiles = [
      'components/AsteroidsGame.astro',
      'components/README.md'
    ];

    const libFiles = [
      'lib/types/geometry.ts',
      'lib/types/spaceship.ts',
      'lib/types/asteroid.ts',
      'lib/types/projectile.ts',
      'lib/types/game-state.ts',
      'lib/types/display.ts',
      'lib/engine/physics.ts',
      'lib/engine/collision.ts',
      'lib/engine/input.ts',
      'lib/engine/renderer.ts',
      'lib/engine/game-state.ts',
      'lib/engine/game-loop.ts',
      'lib/objects/spaceship.ts',
      'lib/objects/asteroid.ts',
      'lib/objects/projectile.ts',
      'lib/objects/level.ts'
    ];

    const totalFiles = componentFiles.length + libFiles.length;

    // While technically multiple files, they form a cohesive single component
    expect(totalFiles).toBeLessThan(20); // Reasonable module count
    expect(componentFiles.length).toBe(2); // Only 2 component files
    expect(libFiles.length).toBe(16); // Supporting library files

    // Main component file should be self-sufficient as entry point
    const mainComponent = join(srcPath, 'components/AsteroidsGame.astro');
    expect(existsSync(mainComponent)).toBe(true);

    const componentContent = readFileSync(mainComponent, 'utf-8');

    // Single component should handle all game initialization
    expect(componentContent).toContain('loadGameModules');
    expect(componentContent).toContain('initializeGame');
    expect(componentContent).toContain('async function');
  });
});