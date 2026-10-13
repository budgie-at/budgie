import { createTestVitestConfig } from '@budgie-at/test-kit/vitest';
import { defineConfig } from 'vitest/config';

const config = createTestVitestConfig(__dirname, 'test/ledger-test-layer.ts');

export default defineConfig({ ...config, test: { ...config.test, include: ['test/**/*.test.ts'] } });
