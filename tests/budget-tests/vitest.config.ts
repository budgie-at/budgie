import { createTestInlineShimPlugin } from '@budgie-at/test-kit/vitest';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [createTestInlineShimPlugin(true)],
    resolve: {
        alias: [{ find: /^@app\/(.*)$/u, replacement: `${__dirname}/../../packages/app/src/$1` }]
    },
    test: {
        environment: 'node',
        globals: true,
        include: ['src/**/*.test.ts'],
        pool: 'forks',
        fileParallelism: false
    }
});
