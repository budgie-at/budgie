import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

import { createTestInlineShimPlugin } from '@budgie-at/test-kit/vitest';

const here = (relative: string) => resolve(__dirname, relative);

export default defineConfig({
    plugins: [createTestInlineShimPlugin(true)],
    resolve: {
        alias: [{ find: /^@app\/(.*)$/, replacement: here('../../packages/app/src/$1') }]
    },
    test: {
        environment: 'node',
        globals: false,
        setupFiles: [here('src/harness/scenario/setup.ts')],
        include: ['src/scenarios/**/*.test.ts'],
        pool: 'forks',
        poolOptions: { forks: { singleFork: true } }
    }
});
