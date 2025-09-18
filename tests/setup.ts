// Test setup file for Vitest
import { beforeEach, afterEach, vi } from 'vitest';

// Mock requestAnimationFrame and related APIs for game loop testing
Object.defineProperty(window, 'requestAnimationFrame', {
  writable: true,
  value: vi.fn((cb: FrameRequestCallback) => {
    return setTimeout(cb, 16); // ~60fps
  })
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  writable: true,
  value: vi.fn((id: number) => {
    clearTimeout(id);
  })
});

// Mock performance.now for consistent timing in tests
Object.defineProperty(window, 'performance', {
  writable: true,
  value: {
    now: vi.fn(() => Date.now())
  }
});

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});

// Clean up after each test
afterEach(() => {
  vi.restoreAllMocks();
});