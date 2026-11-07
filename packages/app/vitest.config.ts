import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: { env: { TZ: 'America/New_York' }, isolate: false, environment: 'node', include: ['test/**/*.test.ts'] }
});
