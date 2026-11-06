import { createTestVitestConfig } from '@budgie-at/test-kit/vitest';
import { defineConfig, mergeConfig } from 'vitest/config';

export default defineConfig(
    mergeConfig(createTestVitestConfig(__dirname, 'src/harness/scenario/setup.ts'), {
        test: {
            isolate: true,
            ...(process.env['CI'] === 'true' && { maxWorkers: 2 })
        }
    })
);
