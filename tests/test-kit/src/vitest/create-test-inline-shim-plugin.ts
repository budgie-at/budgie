import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { TestInlineShimPluginInterface } from './interface/test-inline-shim-plugin.interface';

const VIRTUAL_PREFIX = '\0virtual:';

const VIRTUAL_SHIMS: Record<string, string> = {
    'expo-secure-store': `export const getItem = () => null;`,
    expo: `export const requireNativeModule = () => ({}); export const requireOptionalNativeModule = () => null; export const NativeModule = class {};`,
    'expo-file-system': `
        export const File = class { constructor() {} };
        export const Directory = class { constructor() { this.uri = 'file:///tmp/sqlite/'; } };
        export const Paths = { document: '/tmp', cache: '/tmp' };
    `,
    'expo-file-system/legacy': `export const createDownloadResumable = () => ({});`,
    'expo-constants': `export default { expoConfig: { extra: { aiEnabled: true } } };`,
    'llama.rn': `export const initLlama = async () => ({});`,
    'whisper.rn': `export const initWhisper = async () => ({});`,
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
    '@op-engineering/op-sqlite': `
        export const open = () => {
            throw new Error('op-sqlite is unavailable in tests');
        };
        export class Storage {
            store = new Map();
            getItem = async key => this.store.get(key) ?? null;
            setItem = async (key, value) => {
                this.store.set(key, value);
            };
            removeItem = async key => {
                this.store.delete(key);
            };
            closeSync = () => undefined;
        }
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

const APP_WIDGET_MODULE_PATTERN = /\/widget\/[a-z-]+\.widget$/u;

const APP_WIDGET_SHIM_ID = 'app-widget';

const APP_WIDGET_SHIM = `export default { updateSnapshot: () => undefined, updateTimeline: () => undefined, reload: () => undefined };`;

export const createTestInlineShimPlugin = (): TestInlineShimPluginInterface => ({
    name: 'inline-shim',
    enforce: 'pre',
    resolveId: id => {
        if (Object.hasOwn(VIRTUAL_SHIMS, id)) {
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

            return VIRTUAL_SHIMS[key] ?? null;
        }

        if (id.endsWith('.sql')) {
            return `export default ${JSON.stringify(readFileSync(id, 'utf8'))};`;
        }

        return null;
    }
});

export const createTestVitestConfig = (rootDir: string, setupFile: string, includeAppAlias = false) => {
    const here = (relative: string) => resolve(rootDir, relative);

    return {
        plugins: [createTestInlineShimPlugin()],
        ...(includeAppAlias && {
            resolve: {
                alias: [{ find: /^@app\/(.*)$/u, replacement: here('../../packages/app/src/$1') }]
            }
        }),
        test: {
            server: { deps: { inline: [/@effect\/sql-sqlite-react-native/u] } },
            environment: 'node',
            globals: false,
            setupFiles: [here(setupFile)],
            include: ['src/scenarios/**/*.test.ts'],
            pool: 'forks',
            fileParallelism: false
        }
    };
};
