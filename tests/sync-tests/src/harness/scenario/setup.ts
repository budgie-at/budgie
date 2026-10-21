import { assertStoredBalancesMatchLedger, buildTestDb, resetTestDb } from '@budgie-at/test-kit';
import * as Effect from 'effect/Effect';
import { vi, afterAll, afterEach, beforeAll, beforeEach } from 'vitest';

import { emptyFn, isDefined, isNotEmptyString } from '@rnw-community/shared';

vi.mock('@app/@generic/drizzle/service/database-connection.service', async () => {
    const { FakeDatabaseConnectionService } = await import('../fake/fake-database-connection.service');

    return { DatabaseConnectionService: FakeDatabaseConnectionService };
});

vi.mock('@budgie/contracts', async importOriginal => {
    const { void: voidEffect } = await import('effect/Effect');

    return { ...(await importOriginal<typeof import('@budgie/contracts')>()), YIELD_TO_UI: voidEffect };
});

const resolveLinguiMessage = (descriptor: unknown): string => {
    if (typeof descriptor === 'string') {
        return descriptor;
    }

    if (typeof descriptor === 'object' && descriptor !== null && 'message' in descriptor && typeof descriptor.message === 'string') {
        return descriptor.message;
    }

    return '';
};

vi.mock('@lingui/core', () => ({
    i18n: {
        locale: 'en',
        load: emptyFn,
        activate: emptyFn,
        _: (descriptor: unknown, values?: Record<string, string>): string => {
            const message = resolveLinguiMessage(descriptor);

            if (!isDefined(values)) {
                return message;
            }

            return Object.entries(values).reduce((result, [key, value]) => result.replaceAll(`{${key}}`, value), message);
        }
    }
}));

export const backupDatabasePath = isNotEmptyString(process.env['BUDGIE_BACKUP_DB']) ? process.env['BUDGIE_BACKUP_DB'] : null;

const testDbHandle = await buildTestDb(backupDatabasePath);

export const testDb = testDbHandle.database;

vi.mock('@app/@generic/runtime/app.runtime', async () => {
    const { testAtomRuntime, testRuntime } = await import('./test-runtime');

    return { appAtomRuntime: testAtomRuntime, appRuntime: testRuntime };
});

vi.mock('expo-app-intents', async () => {
    const { walletCaptureNativeStub } = await import('../wallet-capture/wallet-capture-app-intents.stub');

    return walletCaptureNativeStub;
});

import { walletCaptureNativeStub } from '../wallet-capture/wallet-capture-app-intents.stub';

import { mockServer } from './mock-server';

beforeAll(() => {
    mockServer.listen({ onUnhandledFrame: 'error' });
});

beforeEach(() => {
    walletCaptureNativeStub.reset();
    if (!isDefined(backupDatabasePath)) {
        return Effect.runPromise(resetTestDb(testDb));
    }

    return undefined;
});

afterEach(() => {
    mockServer.resetHandlers();

    return Effect.runPromise(assertStoredBalancesMatchLedger(testDb));
});

afterAll(() => {
    mockServer.close();

    return testDbHandle.dispose();
});
