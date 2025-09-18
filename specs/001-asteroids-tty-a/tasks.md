# Tasks: Asteroids TTY

**Input**: Design documents from `/specs/001-asteroids-tty-a/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Extract: Astro + TypeScript, single component architecture
2. Load design documents:
   → data-model.md: 7 entities → model tasks
   → contracts/: Component interface → contract test tasks
   → quickstart.md: 6 test scenarios → integration tests
3. Generate tasks by category:
   → Setup: Astro project, TypeScript config, dependencies
   → Tests: component tests, integration tests, unit tests
   → Core: TypeScript interfaces, game engine, component
   → Integration: keyboard input, rendering, physics
   → Polish: performance validation, extractability
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Single component = sequential for main implementation
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- File paths for single Astro project structure

## Path Conventions
Single Astro project structure:
- `src/components/` - Main component
- `src/lib/` - Game logic and types
- `src/pages/` - Demo pages
- `tests/` - All test files
- Root level - Config files

## Phase 3.1: Setup
- [x] T001 Create Astro project structure with TypeScript strict mode
- [x] T002 Configure package.json with Astro, TypeScript, Vitest, Playwright dependencies
- [x] T003 [P] Configure TypeScript strict mode in tsconfig.json
- [x] T004 [P] Configure Vitest for unit testing in vite.config.ts
- [x] T005 [P] Configure Playwright for component integration testing

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Component Interface Tests
- [x] T006 [P] Component prop validation test in tests/component/AsteroidsGame.test.ts
- [x] T007 [P] Component rendering test in tests/component/component-rendering.test.ts
- [x] T008 [P] Game controls interface test in tests/component/game-controls.test.ts

### Game Logic Unit Tests
- [x] T009 [P] Position and Velocity interface tests in tests/unit/geometry.test.ts
- [x] T010 [P] Spaceship state management tests in tests/unit/spaceship.test.ts
- [x] T011 [P] Asteroid behavior tests in tests/unit/asteroid.test.ts
- [x] T012 [P] Projectile lifecycle tests in tests/unit/projectile.test.ts
- [x] T013 [P] GameState management tests in tests/unit/game-state.test.ts
- [x] T014 [P] Collision detection tests in tests/unit/collision.test.ts

### Integration Scenario Tests (from quickstart.md)
- [x] T015 [P] Basic gameplay scenario test in tests/integration/basic-gameplay.test.ts
- [x] T016 [P] Vertical scrolling mode test in tests/integration/scrolling-mode.test.ts
- [x] T017 [P] Traditional mode test in tests/integration/traditional-mode.test.ts
- [x] T018 [P] Character mode toggle test in tests/integration/character-toggle.test.ts
- [x] T019 [P] Game over sequence test in tests/integration/game-over.test.ts
- [x] T020 [P] Level progression test in tests/integration/level-progression.test.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### TypeScript Interfaces and Types
- [x] T021 [P] Position and Velocity interfaces in src/lib/types/geometry.ts
- [x] T022 [P] Spaceship interface in src/lib/types/spaceship.ts
- [x] T023 [P] Asteroid interface in src/lib/types/asteroid.ts
- [x] T024 [P] Projectile interface in src/lib/types/projectile.ts
- [x] T025 [P] GameState interface in src/lib/types/game-state.ts
- [x] T026 [P] DisplayConfiguration interface in src/lib/types/display.ts

### Game Engine Core
- [x] T027 [P] Physics engine for position/velocity updates in src/lib/engine/physics.ts
- [x] T028 [P] Collision detection system in src/lib/engine/collision.ts
- [x] T029 [P] Input handling system in src/lib/engine/input.ts
- [x] T030 [P] Rendering system for character grid in src/lib/engine/renderer.ts
- [x] T031 Game state manager in src/lib/engine/game-state.ts
- [x] T032 Game loop controller in src/lib/engine/game-loop.ts

### Game Objects
- [ ] T033 [P] Spaceship class implementation in src/lib/objects/spaceship.ts
- [ ] T034 [P] Asteroid class implementation in src/lib/objects/asteroid.ts
- [ ] T035 [P] Projectile class implementation in src/lib/objects/projectile.ts
- [ ] T036 [P] Level generator in src/lib/objects/level.ts

## Phase 3.4: Integration

### Main Component Assembly
- [ ] T037 AsteroidsGame.astro component with props interface
- [ ] T038 Integrate game engine with Astro component lifecycle
- [ ] T039 Implement keyboard event handling in component
- [ ] T040 Implement character grid rendering in component
- [ ] T041 Connect physics modes (scrolling vs traditional)
- [ ] T042 Connect character modes (ASCII vs Unicode)

### Display and Controls
- [ ] T043 Screen size configuration handling
- [ ] T044 Game HUD (score, level, lives) rendering
- [ ] T045 Game over and pause state handling
- [ ] T046 Error handling and component error boundaries

## Phase 3.5: Polish

### Performance and Validation
- [ ] T047 [P] 60fps performance validation test in tests/performance/frame-rate.test.ts
- [ ] T048 [P] Input response time validation (<100ms) in tests/performance/input-response.test.ts
- [ ] T049 [P] Memory usage validation in tests/performance/memory.test.ts

### Demo and Documentation
- [ ] T050 [P] Create demo page in src/pages/index.astro
- [ ] T051 [P] Create integration demo page in src/pages/demo.astro
- [ ] T052 [P] Component documentation in src/components/README.md

### Extractability Validation
- [ ] T053 Test component extraction to new Astro project
- [ ] T054 Validate single-file dependency requirement
- [ ] T055 Final constitution compliance check

## Dependencies

### Critical Path
1. **Setup (T001-T005)** → All other tasks
2. **Tests (T006-T020)** → Implementation (T021-T046)
3. **Types (T021-T026)** → Engine & Objects (T027-T036)
4. **Engine Core (T027-T032)** → Integration (T037-T046)
5. **Objects (T033-T036)** → Integration (T037-T046)
6. **Integration (T037-T046)** → Polish (T047-T055)

### Specific Dependencies
- T031 (Game state manager) blocks T032 (Game loop)
- T037 (Main component) blocks T038-T046 (Integration)
- T053-T055 (Extractability) require T037-T046 complete

## Parallel Example
```bash
# Setup phase - can run together:
Task: "Configure TypeScript strict mode in tsconfig.json"
Task: "Configure Vitest for unit testing in vite.config.ts"
Task: "Configure Playwright for component integration testing"

# Test creation phase - all different files:
Task: "Position and Velocity interface tests in tests/unit/geometry.test.ts"
Task: "Spaceship state management tests in tests/unit/spaceship.test.ts"
Task: "Asteroid behavior tests in tests/unit/asteroid.test.ts"
Task: "Projectile lifecycle tests in tests/unit/projectile.test.ts"

# Interface creation - all different files:
Task: "Position and Velocity interfaces in src/lib/types/geometry.ts"
Task: "Spaceship interface in src/lib/types/spaceship.ts"
Task: "Asteroid interface in src/lib/types/asteroid.ts"
```

## Task Generation Rules Applied

1. **From Contracts**:
   - Component interface → T006-T008 tests, T037 implementation
   - Game controls → T030 input system, T031 state manager

2. **From Data Model**:
   - 7 entities → T021-T026 interface tasks [P]
   - Game objects → T033-T036 implementation tasks [P]

3. **From Quickstart Scenarios**:
   - 6 test scenarios → T015-T020 integration tests [P]
   - Performance requirements → T047-T049 validation [P]

4. **From Research Decisions**:
   - DOM-based rendering → T030 renderer, T040 integration
   - Single component → T037 main component (sequential)
   - TypeScript strictness → T003 config, T021-T026 interfaces

## Validation Checklist

- [x] All contracts have corresponding tests (T006-T008)
- [x] All entities have model tasks (T021-T026)
- [x] All tests come before implementation (T006-T020 → T021+)
- [x] Parallel tasks truly independent (different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] TDD order enforced (tests must fail before implementation)

## Notes
- [P] tasks = different files, no shared dependencies
- Main component (T037+) is sequential due to single-file constraint
- Verify all tests fail before implementing T021+
- Commit after each task completion
- Constitution compliance validated in T055