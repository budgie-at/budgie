import { createTestVitestConfig } from '@budgie-at/test-kit/vitest';
import { defineConfig } from 'vitest/config';

const config = createTestVitestConfig(__dirname, '');

export default defineConfig({ ...config, test: { ...config.test, include: ['test/**/*.test.ts'], setupFiles: [] } });
