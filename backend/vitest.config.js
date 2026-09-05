import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      // By default vitest doesn't load non-VITE_ prefixed variables from .env
      // We can specify an envPrefix to tell it to load them.
      // But actually, the easiest way to load ALL variables is to set envPrefix to ['']
    },
    envPrefix: [''],
    fileParallelism: false,
  },
});
