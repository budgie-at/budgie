import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: { isolate: true, environment: 'node', include: ['test/**/*.test.ts'] }
});
