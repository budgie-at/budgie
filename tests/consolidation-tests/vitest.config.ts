import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

import { createTestInlineShimPlugin } from '@budgie-at/test-kit/vitest';

const here = (relative: string) => resolve(__dirname, relative);

export default defineConfig({
    plugins: [createTestInlineShimPlugin(true)],
    test: {
        environment: 'node',
        globals: false,
        setupFiles: [here('src/harness/setup.ts')],
        include: ['src/scenarios/**/*.test.ts'],
        pool: 'forks',
        poolOptions: { forks: { singleFork: true } }
    }
});
