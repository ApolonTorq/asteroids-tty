import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';

describe('Constitution Compliance Validation', () => {
  const projectRoot = resolve(__dirname, '../..');
  const srcPath = join(projectRoot, 'src');
  const constitutionPath = join(projectRoot, '.specify/memory/constitution.md');

  it('should comply with Component-First Architecture principle', () => {
    // Check that main component exists and is primary interface
    const mainComponent = join(srcPath, 'components/AsteroidsGame.astro');
    expect(existsSync(mainComponent)).toBe(true);

    const componentContent = readFileSync(mainComponent, 'utf-8');

    // Component should be self-contained and reusable
    expect(componentContent).toContain('export interface Props');
    expect(componentContent).toContain('const componentId');
    expect(componentContent).toContain('createDOMElement');

    // Should encapsulate all game functionality
    expect(componentContent).toContain('initializeGame');
    expect(componentContent).toContain('loadGameModules');
    expect(componentContent).toContain('cleanup');

    // Component should be configurable via props
    const propsInterface = componentContent.match(/export interface Props\s*{([^}]+)}/s)?.[1];
    expect(propsInterface).toContain('width?:');
    expect(propsInterface).toContain('height?:');
    expect(propsInterface).toContain('characterMode?:');
    expect(propsInterface).toContain('physicsMode?:');
  });

  it('should comply with TypeScript Strictness principle', () => {
    // Check TypeScript configuration
    const tsConfigPath = join(projectRoot, 'tsconfig.json');
    const tsConfig = JSON.parse(readFileSync(tsConfigPath, 'utf-8'));

    expect(tsConfig.compilerOptions.strict).toBe(true);

    // Check that all key files use proper TypeScript
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

      // Should have proper interface definitions
      expect(content).toMatch(/export\s+interface\s+\w+/);

      // Should use type imports where appropriate
      const importLines = content.match(/import.*from.*['"];/g) || [];
      importLines.forEach(line => {
        if (line.includes('import {') && !line.includes('import type {')) {
          // Should prefer type imports for types
          const importedItems = line.match(/import\s*{\s*([^}]+)\s*}/)?.[1];
          if (importedItems && !importedItems.includes('create') && !importedItems.includes('get')) {
            // Allow non-type imports for functions and constants
          }
        }
      });
    });

    // Check engine files for proper typing
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

      // Should have proper class definitions with typing
      expect(content).toMatch(/export\s+class\s+\w+/);

      // Should use proper method signatures
      expect(content).toMatch(/:\s*(void|boolean|number|string|\w+)/);
    });
  });

  it('should comply with Nostalgic Simplicity principle', () => {
    // Check that implementation focuses on retro gaming essence
    const mainComponent = join(srcPath, 'components/AsteroidsGame.astro');
    const componentContent = readFileSync(mainComponent, 'utf-8');

    // Should support ASCII character mode (nostalgic)
    expect(componentContent).toContain("characterMode === 'ascii'");
    expect(componentContent).toContain('CHARACTER_SETS.ascii');

    // Should support scrolling physics mode (Index 2000 emulation)
    expect(componentContent).toContain("physicsMode");
    expect(componentContent).toContain("'scrolling'");

    // Check display configuration maintains retro aesthetic
    const displayPath = join(srcPath, 'lib/types/display.ts');
    const displayContent = readFileSync(displayPath, 'utf-8');

    expect(displayContent).toContain("ascii: {");
    expect(displayContent).toContain("'^'"); // ASCII spaceship
    expect(displayContent).toContain("'O'"); // ASCII asteroid
    expect(displayContent).toContain("'.'"); // ASCII projectile

    // Should maintain simple character-based graphics
    expect(displayContent).toContain("unicode: {");

    // Check that complexity is managed (no over-engineering)
    const packageJsonPath = join(projectRoot, 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

    const runtimeDeps = Object.keys(packageJson.dependencies || {});
    expect(runtimeDeps.length).toBeLessThanOrEqual(2); // Minimal dependencies
  });

  it('should comply with Astro Static Generation principle', () => {
    // Check Astro configuration
    const astroConfigPath = join(projectRoot, 'astro.config.mjs');
    if (existsSync(astroConfigPath)) {
      const astroConfig = readFileSync(astroConfigPath, 'utf-8');
      // Should not force specific output mode (allow static generation)
      expect(astroConfig).not.toContain("output: 'server'");
    }

    // Check that component supports SSR safety
    const mainComponent = join(srcPath, 'components/AsteroidsGame.astro');
    const componentContent = readFileSync(mainComponent, 'utf-8');

    // Should handle server-side rendering safely
    expect(componentContent).toContain("typeof window !== 'undefined'");
    expect(componentContent).toContain('DOMContentLoaded');

    // Should use proper dynamic imports for browser code
    expect(componentContent).toContain('async function loadGameModules');
    expect(componentContent).toContain("import('../lib/engine/");

    // Check package.json for proper module configuration
    const packageJsonPath = join(projectRoot, 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

    expect(packageJson.type).toBe('module'); // ESM for Astro compatibility
  });

  it('should comply with Extractable Design principle', () => {
    // Check that component can be extracted as single unit
    const mainComponent = join(srcPath, 'components/AsteroidsGame.astro');
    expect(existsSync(mainComponent)).toBe(true);

    // Check for component documentation
    const componentReadme = join(srcPath, 'components/README.md');
    expect(existsSync(componentReadme)).toBe(true);

    const readmeContent = readFileSync(componentReadme, 'utf-8');
    expect(readmeContent).toContain('Migration and Extraction');
    expect(readmeContent).toContain('cp -r src/components/AsteroidsGame.astro');

    // Check that all dependencies are relative
    const componentContent = readFileSync(mainComponent, 'utf-8');
    const importLines = componentContent.match(/import.*from\s+['"][^'"]*['"];/g) || [];

    importLines.forEach(line => {
      const importPath = line.match(/from\s+['"]([^'"]*)/)?.[1];
      if (importPath) {
        // Should be relative import or allowed module
        expect(importPath.startsWith('../') || importPath.startsWith('./')).toBe(true);
      }
    });

    // Check supporting files are properly structured
    const requiredStructure = [
      'lib/types/',
      'lib/engine/',
      'lib/objects/'
    ];

    requiredStructure.forEach(dir => {
      const dirPath = join(srcPath, dir);
      expect(existsSync(dirPath)).toBe(true);
    });

    // Check that there are no hidden dependencies
    const packageJsonPath = join(projectRoot, 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

    // Runtime dependencies should be minimal
    const runtimeDeps = Object.keys(packageJson.dependencies || {});
    expect(runtimeDeps).toEqual(['astro']); // Only Astro allowed

    // Should not require complex build tools beyond TypeScript
    const devDeps = Object.keys(packageJson.devDependencies || {});
    const buildTools = devDeps.filter(dep =>
      dep.includes('webpack') ||
      dep.includes('rollup') ||
      dep.includes('parcel') ||
      dep.includes('gulp')
    );
    expect(buildTools.length).toBe(0); // No complex bundlers required
  });

  it('should validate constitution document exists and is followed', () => {
    // Check constitution file exists
    expect(existsSync(constitutionPath)).toBe(true);

    const constitutionContent = readFileSync(constitutionPath, 'utf-8');

    // Should contain all 5 principles
    const principles = [
      'Component-First Architecture',
      'TypeScript Strictness',
      'Nostalgic Simplicity',
      'Astro Static Generation',
      'Extractable Design'
    ];

    principles.forEach(principle => {
      expect(constitutionContent).toContain(principle);
    });

    // Should mention project context
    expect(constitutionContent).toContain('asteroids-tty');
    expect(constitutionContent).toContain('1979');
    expect(constitutionContent).toContain('Index 2000');

    // Should emphasize appropriate characteristics
    expect(constitutionContent).toContain('low-maintenance');
    expect(constitutionContent).toContain('nostalgic');
    expect(constitutionContent).toContain('fun project');
  });

  it('should validate project maintains simplicity as stated in constitution', () => {
    const constitutionContent = readFileSync(constitutionPath, 'utf-8');

    // Constitution should emphasize simplicity
    expect(constitutionContent).toContain('simple');
    expect(constitutionContent).toContain('not enterprise software');

    // Check that codebase reflects this philosophy
    const totalFileCount = [
      'components/',
      'lib/types/',
      'lib/engine/',
      'lib/objects/'
    ].reduce((count, dir) => {
      const dirPath = join(srcPath, dir);
      if (existsSync(dirPath)) {
        const files = require('fs').readdirSync(dirPath, { recursive: true })
          .filter((file: string) => file.endsWith('.ts') || file.endsWith('.astro'));
        return count + files.length;
      }
      return count;
    }, 0);

    // Should be manageable number of files (not over-engineered)
    expect(totalFileCount).toBeLessThan(25);

    // Check for appropriate complexity level
    const mainComponent = join(srcPath, 'components/AsteroidsGame.astro');
    const componentContent = readFileSync(mainComponent, 'utf-8');
    const lineCount = componentContent.split('\n').length;

    // Main component should be substantial but not excessive
    expect(lineCount).toBeGreaterThan(200); // Functional
    expect(lineCount).toBeLessThan(500); // Not over-complex
  });

  it('should validate extractability matches constitution requirements', () => {
    const constitutionContent = readFileSync(constitutionPath, 'utf-8');

    // Constitution should mention extractability
    expect(constitutionContent).toContain('extractable');
    expect(constitutionContent).toContain('blog');

    // Check that implementation supports blog integration
    const mainComponent = join(srcPath, 'components/AsteroidsGame.astro');
    const componentContent = readFileSync(mainComponent, 'utf-8');

    // Should have configurable props for blog use
    expect(componentContent).toContain('autoStart');
    expect(componentContent).toContain('showControls');
    expect(componentContent).toContain('width');
    expect(componentContent).toContain('height');

    // Should be self-contained
    expect(componentContent).toContain('position: relative');
    expect(componentContent).toContain('display: inline-block');

    // Documentation should support extraction
    const componentReadme = join(srcPath, 'components/README.md');
    const readmeContent = readFileSync(componentReadme, 'utf-8');

    expect(readmeContent).toContain('Blog Integration');
    expect(readmeContent).toContain('portfolio');
    expect(readmeContent).toContain('Educational Content');
  });

  it('should validate TypeScript strictness as constitutional requirement', () => {
    const constitutionContent = readFileSync(constitutionPath, 'utf-8');

    // Constitution should emphasize TypeScript strictness
    expect(constitutionContent).toContain('TypeScript');
    expect(constitutionContent).toContain('strict');

    // Check implementation follows this
    const tsConfigPath = join(projectRoot, 'tsconfig.json');
    const tsConfig = JSON.parse(readFileSync(tsConfigPath, 'utf-8'));

    expect(tsConfig.compilerOptions.strict).toBe(true);
    expect(tsConfig.compilerOptions.noImplicitAny).toBe(true);
    expect(tsConfig.compilerOptions.strictNullChecks).toBe(true);
    expect(tsConfig.compilerOptions.strictFunctionTypes).toBe(true);

    // All source files should be TypeScript
    const sourceFiles = require('fs').readdirSync(srcPath, { recursive: true })
      .filter((file: string) => file.endsWith('.ts') || file.endsWith('.astro'));

    expect(sourceFiles.length).toBeGreaterThan(15); // Substantial TypeScript usage

    // No JavaScript files in src (except Astro frontmatter)
    const jsFiles = require('fs').readdirSync(srcPath, { recursive: true })
      .filter((file: string) => file.endsWith('.js'));

    expect(jsFiles.length).toBe(0); // Pure TypeScript implementation
  });

  it('should validate nostalgic authenticity as constitutional principle', () => {
    const constitutionContent = readFileSync(constitutionPath, 'utf-8');

    // Constitution should emphasize nostalgia
    expect(constitutionContent).toContain('nostalgic');
    expect(constitutionContent).toContain('1979');
    expect(constitutionContent).toContain('Index 2000');

    // Check implementation preserves nostalgic elements
    const displayPath = join(srcPath, 'lib/types/display.ts');
    const displayContent = readFileSync(displayPath, 'utf-8');

    // ASCII character set should be authentic
    expect(displayContent).toContain("up: '^'");
    expect(displayContent).toContain("large: 'O'");
    expect(displayContent).toContain("projectile: '.'");

    // Physics should support original scrolling mode
    const physicsPath = join(srcPath, 'lib/engine/physics.ts');
    const physicsContent = readFileSync(physicsPath, 'utf-8');

    expect(physicsContent).toContain('scrolling');
    expect(physicsContent).toContain('traditional');

    // Game should default to nostalgic settings
    const mainComponent = join(srcPath, 'components/AsteroidsGame.astro');
    const componentContent = readFileSync(mainComponent, 'utf-8');

    expect(componentContent).toContain("characterMode = 'ascii'");
    expect(componentContent).toContain("physicsMode = 'scrolling'");
    expect(componentContent).toContain("width = 80");
    expect(componentContent).toContain("height = 25");
  });
});