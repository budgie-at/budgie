import { createTestVitestConfig } from '@budgie-at/test-kit/vitest';
import { defineConfig } from 'vitest/config';

const config = createTestVitestConfig(__dirname, 'test/test-context.ts', true);

export default defineConfig({
    ...config,
    test: { ...config.test, include: ['test/**/*.test.ts'], globals: true, env: { TZ: 'Europe/Vienna' } }
});
