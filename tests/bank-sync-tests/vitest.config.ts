import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

const here = (relative: string) => resolve(__dirname, relative);

export default defineConfig({
    resolve: {
        alias: [
            { find: /^@app\/(.*)$/, replacement: here('../../packages/app/src/$1') },
            { find: /^expo-sqlite$/, replacement: here('src/harness/__shims__/expo-sqlite.ts') },
            { find: /^expo-background-task$/, replacement: here('src/harness/__shims__/expo-background-task.ts') },
            { find: /^expo-task-manager$/, replacement: here('src/harness/__shims__/expo-task-manager.ts') },
            { find: /^expo-secure-store$/, replacement: here('src/harness/__shims__/expo-secure-store.ts') },
            { find: /^react-native$/, replacement: here('src/harness/__shims__/react-native.ts') },
            { find: /^drizzle-orm\/expo-sqlite$/, replacement: here('src/harness/__shims__/drizzle-expo-sqlite.ts') }
        ]
    },
    test: {
        environment: 'node',
        globals: false,
        setupFiles: [here('src/harness/setup.ts')],
        include: ['src/scenarios/**/*.test.ts'],
        pool: 'forks',
        poolOptions: { forks: { singleFork: true } }
    }
});
