import { defineConfig, type Plugin } from 'vitest/config';
import { resolve } from 'node:path';

const here = (relative: string) => resolve(__dirname, relative);

const VIRTUAL_PREFIX = '\0virtual:';

const VIRTUAL_SHIMS: Record<string, string> = {
    'drizzle-orm/expo-sqlite': `export const drizzle = () => ({});`,
    'expo-secure-store': `export const getItem = () => null;`,
    'expo-sqlite': `
        export const openDatabaseSync = () => ({});
        export const deleteDatabaseAsync = async () => undefined;
        export const bundledExtensions = {};
    `,
    'expo-background-task': `
        export const BackgroundTaskResult = Object.freeze({ Success: 'success', Failed: 'failed' });
        export const registerTaskAsync = async () => undefined;
    `,
    'expo-task-manager': `
        export const isTaskRegisteredAsync = async () => true;
        export const defineTask = () => undefined;
        export const unregisterTaskAsync = async () => undefined;
    `,
    'react-native': `
        export const InteractionManager = {
            runAfterInteractions(cb) {
                cb();
                return { cancel: () => undefined };
            }
        };
    `
};

const inlineShimPlugin = (): Plugin => ({
    name: 'inline-shim',
    enforce: 'pre',
    resolveId(id) {
        if (Object.hasOwn(VIRTUAL_SHIMS, id)) {
            return `${VIRTUAL_PREFIX}${id}`;
        }
        return null;
    },
    load(id) {
        if (id.startsWith(VIRTUAL_PREFIX)) {
            const key = id.slice(VIRTUAL_PREFIX.length);
            return VIRTUAL_SHIMS[key] ?? null;
        }
        return null;
    }
});

export default defineConfig({
    plugins: [inlineShimPlugin()],
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
