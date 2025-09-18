import { defineConfig } from 'vite';
import { defineConfig as defineVitestConfig } from 'vitest/config';

export default defineConfig(
  defineVitestConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'tests/',
          '*.config.*',
          'dist/'
        ]
      }
    },
    resolve: {
      alias: {
        '@': '/src',
        '@/lib': '/src/lib',
        '@/components': '/src/components'
      }
    }
  })
);