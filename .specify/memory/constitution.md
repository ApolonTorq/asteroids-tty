# Asteroids TTY Constitution

## Core Principles

### I. Component-First
Every game feature starts as a reusable Astro component
Components must be self-contained and easily extractable to other projects
Clear separation between game logic and Astro framework integration

### II. TypeScript Strictness
Strong typing required throughout - no `any` types except for external library integrations
Type safety ensures reliable retro game mechanics
Interfaces define clear contracts between game systems

### III. Nostalgic Simplicity
Embrace retro limitations as design constraints, not obstacles
Character-based graphics and terminal aesthetics are features, not bugs
Simple implementations preferred over complex optimizations

### IV. Astro Static Generation
Game must run as a static site with no server dependencies
All game state managed client-side with TypeScript
No external APIs or databases - pure frontend experience

### V. Extractable Design
Core game component should be portable to other Astro projects
Minimal file dependencies - ideally single component export
Clear documentation for integration into other projects

## Technology Stack

**Framework**: Astro with TypeScript (strict mode)
**Styling**: CSS modules or scoped styles only
**Game Engine**: Custom TypeScript implementation, no external game libraries
**Testing**: Lightweight - focus on component rendering and game logic validation
**Build**: Standard Astro static build process

## Development Standards

**No Over-Engineering**: This is a fun nostalgic project, not enterprise software
**Readable Code**: Clear variable names reflecting retro computing concepts
**Performance**: Smooth 60fps character animation, but no micro-optimizations needed
**Security**: Minimal concerns - no user data, no external connections
**Maintenance**: Low maintenance design - avoid complex dependencies

## Governance

This constitution reflects the fun, experimental nature of recreating a 1979 game
Simplicity trumps best practices when they conflict with nostalgic authenticity
Document decisions in code comments using retro computing terminology

**Version**: 1.0.0 | **Ratified**: 2025-09-18 | **Last Amended**: 2025-09-18