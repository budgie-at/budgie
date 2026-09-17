import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const APP_ENTRY_URL = new URL('../../../../../packages/app/index.js', import.meta.url);
const APP_INITIALIZATION_URL = new URL('../../../../../packages/app/src/@generic/hook/use-app-initialization.hook.ts', import.meta.url);
const BACKGROUND_TASK_IMPORTS = [
    {
        entry: './src/account/task/account-balance-incremental.task',
        initialization: '../../account/task/account-balance-incremental.task'
    },
    {
        entry: './src/budget/task/budget-alert-monitor.task',
        initialization: '../../budget/task/budget-alert-monitor.task'
    },
    {
        entry: './src/exchange-rate/task/exchange-rate-sync.task',
        initialization: '../../exchange-rate/task/exchange-rate-sync.task'
    },
    { entry: './src/sync/task/binance-sync.task', initialization: '../../sync/task/binance-sync.task' },
    { entry: './src/sync/task/monobank-sync.task', initialization: '../../sync/task/monobank-sync.task' },
    {
        entry: './src/sync/task/transfer-consolidation.task',
        initialization: '../../sync/task/transfer-consolidation.task'
    }
];

describe('sync/background-task-entry', () => {
    it('defines every background task from the JavaScript entry before Expo Router starts', () => {
        const appEntrySource = readFileSync(APP_ENTRY_URL, 'utf8');
        const routerEntryIndex = appEntrySource.indexOf("import 'expo-router/entry'");

        expect(routerEntryIndex).toBeGreaterThan(-1);
        for (const backgroundTaskImport of BACKGROUND_TASK_IMPORTS) {
            const taskImportIndex = appEntrySource.indexOf(`import '${backgroundTaskImport.entry}'`);
            expect(taskImportIndex).toBeGreaterThan(-1);
            expect(taskImportIndex).toBeLessThan(routerEntryIndex);
        }
    });

    it('does not defer background task definitions to React initialization', () => {
        const initializationSource = readFileSync(APP_INITIALIZATION_URL, 'utf8');

        for (const backgroundTaskImport of BACKGROUND_TASK_IMPORTS) {
            expect(initializationSource).not.toContain(`import('${backgroundTaskImport.initialization}')`);
        }
    });
});
