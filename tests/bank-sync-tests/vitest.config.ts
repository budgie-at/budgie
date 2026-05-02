import { defineConfig, type Plugin } from 'vitest/config';
import { resolve } from 'node:path';

const here = (relative: string) => resolve(__dirname, relative);

const VIRTUAL_SHIMS: Record<string, string> = {
    'drizzle-orm/expo-sqlite': 'export const drizzle = () => ({});',
    'expo-secure-store': 'export const getItem = () => null;'
};

const inlineShimPlugin = (): Plugin => ({
    name: 'inline-shim',
    enforce: 'pre',
    resolveId(id) {
        if (Object.hasOwn(VIRTUAL_SHIMS, id)) {
            return `\0virtual:${id}`;
        }
        return null;
    },
    load(id) {
        if (id.startsWith('\0virtual:')) {
            const key = id.slice('\0virtual:'.length);
            return VIRTUAL_SHIMS[key] ?? null;
        }
        return null;
    }
});

export default defineConfig({
    plugins: [inlineShimPlugin()],
    resolve: {
        alias: [
            { find: /^@app\/(.*)$/, replacement: here('../../packages/app/src/$1') },
            { find: /^expo-sqlite$/, replacement: here('src/harness/shims/expo-sqlite.ts') },
            { find: /^expo-background-task$/, replacement: here('src/harness/shims/expo-background-task.ts') },
            { find: /^expo-task-manager$/, replacement: here('src/harness/shims/expo-task-manager.ts') },
            { find: /^react-native$/, replacement: here('src/harness/shims/react-native.ts') }
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
