import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  compilerOptions: {
    types: ['vite/client']
  }
});