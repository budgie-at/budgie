import { availableParallelism } from 'node:os';

import { createTestVitestConfig } from '@budgie-at/test-kit/vitest';
import { defineConfig, mergeConfig } from 'vitest/config';

const LOCAL_MIN_WORKERS = 4;
const LOCAL_MAX_WORKERS = 8;
const CI_MAX_WORKERS = 2;

export default defineConfig(
    mergeConfig(createTestVitestConfig(__dirname, 'src/harness/setup.ts'), {
        test: {
            maxWorkers:
                process.env['CI'] === 'true'
                    ? CI_MAX_WORKERS
                    : Math.min(LOCAL_MAX_WORKERS, Math.max(LOCAL_MIN_WORKERS, Math.floor(availableParallelism() / 2)))
        }
    })
);
