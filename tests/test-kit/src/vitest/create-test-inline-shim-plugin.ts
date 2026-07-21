import { resolve } from 'node:path';

import type { TestInlineShimPluginInterface } from './interface/test-inline-shim-plugin.interface';

const VIRTUAL_PREFIX = '\0virtual:';

const VIRTUAL_SHIMS: Record<string, string> = {
    'expo-secure-store': `export const getItem = () => null;`,
    expo: `export const requireNativeModule = () => ({});`,
    'expo-file-system': `export const File = class { constructor() {} };`,
    'expo-sqlite': `
        export class SQLiteDatabase {}
        export class SQLiteStatement {}
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

const DRIZZLE_EXPO_SQLITE_SHIM: Record<string, string> = {
    'drizzle-orm/expo-sqlite': `
        import { drizzle as drizzleBetterSqlite } from 'drizzle-orm/better-sqlite3';

        export const drizzle = (database, config) => {
            if (database?.$client) {
                return drizzleBetterSqlite(database.$client, config);
            }

            return {};
        };
    `
};

export const createTestInlineShimPlugin = (includeDrizzleExpoSqlite: boolean = false): TestInlineShimPluginInterface => ({
    name: 'inline-shim',
    enforce: 'pre',
    resolveId: id => {
        const virtualShims = includeDrizzleExpoSqlite ? { ...VIRTUAL_SHIMS, ...DRIZZLE_EXPO_SQLITE_SHIM } : VIRTUAL_SHIMS;

        if (Object.hasOwn(virtualShims, id)) {
            return `${VIRTUAL_PREFIX}${id}`;
        }

        return null;
    },
    load: id => {
        if (id.startsWith(VIRTUAL_PREFIX)) {
            const key = id.slice(VIRTUAL_PREFIX.length);
            const virtualShims = includeDrizzleExpoSqlite ? { ...VIRTUAL_SHIMS, ...DRIZZLE_EXPO_SQLITE_SHIM } : VIRTUAL_SHIMS;

            return virtualShims[key] ?? null;
        }

        return null;
    }
});

export const createTestVitestConfig = (rootDir: string, setupFile: string, includeAppAlias = false) => {
    const here = (relative: string) => resolve(rootDir, relative);

    return {
        plugins: [createTestInlineShimPlugin(true)],
        ...(includeAppAlias && {
            resolve: {
                alias: [{ find: /^@app\/(.*)$/u, replacement: here('../../packages/app/src/$1') }]
            }
        }),
        test: {
            environment: 'node',
            globals: false,
            setupFiles: [here(setupFile)],
            include: ['src/scenarios/**/*.test.ts'],
            pool: 'forks',
            fileParallelism: false
        }
    };
};
