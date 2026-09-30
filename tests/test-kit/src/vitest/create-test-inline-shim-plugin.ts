import { createRequire } from 'node:module';
import { resolve } from 'node:path';

import type { TestInlineShimPluginInterface } from './interface/test-inline-shim-plugin.interface';

const VIRTUAL_PREFIX = '\0virtual:';

const VIRTUAL_SHIMS: Record<string, string> = {
    'expo-secure-store': `export const getItem = () => null;`,
    expo: `export const requireNativeModule = () => ({});`,
    'expo-file-system': `export const File = class { constructor() {} };`,
    'expo-file-system/legacy': `export const createDownloadResumable = () => ({});`,
    'expo-constants': `export default { expoConfig: { extra: { aiEnabled: true } } };`,
    'llama.rn': `export const initLlama = async () => ({});`,
    'whisper.rn': `export const initWhisper = async () => ({});`,
    'expo-sqlite': `
        export class SQLiteDatabase {}
        export class SQLiteStatement {}
        export const openDatabaseSync = () => ({});
        export const deleteDatabaseAsync = async () => undefined;
        export const bundledExtensions = {};
        export const addDatabaseChangeListener = () => ({ remove: () => undefined });
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
    'expo-router': `
        export const useRouter = () => ({ push: () => undefined, navigate: () => undefined, replace: () => undefined });
        export const router = { push: () => undefined, navigate: () => undefined, replace: () => undefined };
    `,
    '@lingui/core/macro': `
        export const t = parts => (Array.isArray(parts) ? parts.join('') : String(parts));
        export const msg = parts => {
            const message = Array.isArray(parts) ? parts.join('') : String(parts);

            return { id: message, message };
        };
    `,
    '@lingui/react/macro': `
        export const useLingui = () => ({ t: parts => (Array.isArray(parts) ? parts.join('') : String(parts)) });
    `,
    'expo-local-authentication': `
        export const hasHardwareAsync = async () => false;
        export const isEnrolledAsync = async () => false;
        export const authenticateAsync = async () => ({ success: false });
    `,
    'expo-notifications': `
        export const AndroidImportance = { DEFAULT: 3, HIGH: 4 };
        export const scheduleNotificationAsync = async () => '';
        export const setNotificationChannelAsync = async () => null;
        export const getPermissionsAsync = async () => ({ granted: false });
        export const requestPermissionsAsync = async () => ({ granted: false });
    `,
    'expo-haptics': `
        export const ImpactFeedbackStyle = { Light: 'light', Medium: 'medium', Heavy: 'heavy' };
        export const NotificationFeedbackType = { Success: 'success', Warning: 'warning', Error: 'error' };
        export const impactAsync = async () => undefined;
        export const notificationAsync = async () => undefined;
    `,
    'expo-document-picker': `
        export const getDocumentAsync = async () => ({ canceled: true, assets: null });
    `,
    'expo-sharing': `
        export const isAvailableAsync = async () => false;
        export const shareAsync = async () => undefined;
    `,
    'expo-localization': `
        export const getLocales = () => [{ languageCode: 'en', languageTag: 'en-US', regionCode: 'US', currencyCode: 'USD' }];
    `,
    'expo-sqlite/kv-store': `
        const store = new Map();
        export default {
            getItem: async key => store.get(key) ?? null,
            setItem: async (key, value) => {
                store.set(key, value);
            },
            removeItem: async key => {
                store.delete(key);
            }
        };
    `,
    'react-native': `
        export const InteractionManager = {
            runAfterInteractions(cb) {
                cb();
                return { cancel: () => undefined };
            }
        };
        export const Platform = { OS: 'ios', select: options => options.ios ?? options.default };
        export const AppState = { currentState: 'active', addEventListener: () => ({ remove: () => undefined }) };
        export const Alert = { alert: () => undefined };
        export const Linking = { openURL: async () => undefined, openSettings: async () => undefined };
        export const Appearance = { getColorScheme: () => 'light', addChangeListener: () => ({ remove: () => undefined }) };
        export const StyleSheet = { create: styles => styles, hairlineWidth: 1 };
    `
};

const DRIZZLE_EXPO_SQLITE_SHIM: Record<string, string> = {
    'drizzle-orm/expo-sqlite': `
        import { drizzle as drizzleBetterSqlite } from ${JSON.stringify(createRequire(import.meta.url).resolve('drizzle-orm/better-sqlite3'))};

        export const drizzle = (database, config) => {
            if (database?.$client) {
                return drizzleBetterSqlite(database.$client, config);
            }

            if (typeof database?.prepare === 'function') {
                return drizzleBetterSqlite(database, config);
            }

            return {};
        };
    `
};

const APP_WIDGET_MODULE_PATTERN = /\/widget\/[a-z-]+\.widget$/u;

const APP_WIDGET_SHIM_ID = 'app-widget';

const APP_WIDGET_SHIM = `export default { updateSnapshot: () => undefined, updateTimeline: () => undefined, reload: () => undefined };`;

export const createTestInlineShimPlugin = (includeDrizzleExpoSqlite: boolean = false): TestInlineShimPluginInterface => ({
    name: 'inline-shim',
    enforce: 'pre',
    resolveId: id => {
        const virtualShims = includeDrizzleExpoSqlite ? { ...VIRTUAL_SHIMS, ...DRIZZLE_EXPO_SQLITE_SHIM } : VIRTUAL_SHIMS;

        if (Object.hasOwn(virtualShims, id)) {
            return `${VIRTUAL_PREFIX}${id}`;
        }

        if (APP_WIDGET_MODULE_PATTERN.test(id)) {
            return `${VIRTUAL_PREFIX}${APP_WIDGET_SHIM_ID}`;
        }

        return null;
    },
    load: id => {
        if (id.startsWith(VIRTUAL_PREFIX)) {
            const key = id.slice(VIRTUAL_PREFIX.length);

            if (key === APP_WIDGET_SHIM_ID) {
                return APP_WIDGET_SHIM;
            }

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
